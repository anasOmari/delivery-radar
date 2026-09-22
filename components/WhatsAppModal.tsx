'use client';

import React, { useState, useMemo, useRef } from 'react';
import {
  MessageCircle,
  X,
  Send,
  Copy,
  Check,
  Sparkles,
  Layers,
  Clock,
  Repeat,
  Settings,
  CheckCircle,
  AlertTriangle,
  FileText,
  Zap,
} from 'lucide-react';
import { Lead, LeadStatus } from '@/lib/types';
import { formatPhoneForWhatsApp } from '@/lib/exporter';
import { MARKETING_TEMPLATES, DRIP_SEQUENCES, applyTemplate } from '@/lib/opportunity';
import { useLanguage } from '@/lib/LanguageContext';
import { getWhatsAppConfig, DEFAULT_AUTO_MESSAGE_TEMPLATE, WhatsAppConfig } from '@/lib/whatsappProviders';
import { normalizeToInternational, isValidPhone } from '@/lib/phone';
import { Modal, Button, Banner, StatusPill } from '@/components/ui';
import { WhatsAppSettingsModal } from './WhatsAppSettingsModal';

interface WhatsAppModalProps {
  lead: Lead | null;
  campaignLeads?: Lead[];
  initialCustomText?: string;
  onClose: () => void;
  onStatusChange: (leadId: string, newStatus: LeadStatus) => void;
}

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({
  lead: initialLead,
  campaignLeads = [],
  initialCustomText,
  onClose,
  onStatusChange
}) => {
  const { t, locale } = useLanguage();
  const isCampaignMode = campaignLeads.length > 0;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'admin_auto' | 'templates' | 'drip'>('admin_auto');
  const [selectedTemplateId, setSelectedTemplateId] = useState('web_design');
  const [selectedDripStep, setSelectedDripStep] = useState(1);
  const [copied, setCopied] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [sendStatus, setSendStatus] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle');
  const [sendError, setSendError] = useState<string | null>(null);

  const [config, setConfig] = useState<WhatsAppConfig>(getWhatsAppConfig());

  // Bulk auto-send (campaign mode): one click sends to all leads sequentially.
  const [bulkSending, setBulkSending] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number; sent: number; failed: number; skipped: number } | null>(null);
  const [bulkReport, setBulkReport] = useState<{ sent: number; failed: number; skipped: number; total: number; cancelled: boolean; errors: string[] } | null>(null);
  const [skipNoWhatsApp, setSkipNoWhatsApp] = useState(true);
  const bulkCancelRef = useRef(false);

  const activeLead = isCampaignMode ? campaignLeads[currentIndex] : initialLead;

  const currentTemplateObj = useMemo(() =>
    MARKETING_TEMPLATES.find(t => t.id === selectedTemplateId) || MARKETING_TEMPLATES[0],
    [selectedTemplateId]
  );

  const initialMessage = useMemo(() => {
    if (!activeLead) return '';
    if (initialCustomText) return initialCustomText;
    // If admin configured a custom auto message in settings, default to it!
    const autoTemplate = config.autoMessageTemplate || DEFAULT_AUTO_MESSAGE_TEMPLATE;
    return applyTemplate(autoTemplate, activeLead);
  }, [activeLead, initialCustomText, config.autoMessageTemplate]);

  const [customMessage, setCustomMessage] = useState<string>(initialMessage);

  if (!activeLead) return null;

  const cleanPhone = formatPhoneForWhatsApp(activeLead.phone);
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(customMessage)}`;
  const hasApiProvider = config.provider !== 'none';

  const getProviderDisplayName = () => {
    switch (config.provider) {
      case 'greenapi': return 'GREEN-API';
      case 'whapi': return 'Whapi.Cloud';
      case 'wati': return 'WATI';
      case 'twilio': return 'Twilio SMS';
      default: return 'WhatsApp API';
    }
  };

  const handleSelectAdminAuto = () => {
    setActiveTab('admin_auto');
    const autoTemplate = config.autoMessageTemplate || DEFAULT_AUTO_MESSAGE_TEMPLATE;
    setCustomMessage(applyTemplate(autoTemplate, activeLead));
  };

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const tmpl = MARKETING_TEMPLATES.find(t => t.id === templateId);
    if (tmpl) {
      setCustomMessage(applyTemplate(tmpl.template, activeLead));
    }
  };

  const handleSelectDrip = (step: number) => {
    setSelectedDripStep(step);
    const drip = DRIP_SEQUENCES.find(d => d.step === step);
    if (drip) {
      setCustomMessage(applyTemplate(drip.template, activeLead));
    }
  };

  const handleSendViaAPI = async () => {
    if (!hasApiProvider || !activeLead.phone) return;

    setSendStatus('sending');
    setSendError(null);

    try {
      const res = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config,
          message: {
            to: activeLead.phone,
            text: customMessage,
          },
          action: 'send',
        }),
      });

      const result = await res.json();

      if (result.success) {
        setSendStatus('sent');
        onStatusChange(activeLead.id, 'contacted');

        const delay = (config.sendDelaySeconds || 2) * 1000;
        setTimeout(() => {
          if (isCampaignMode && currentIndex < campaignLeads.length - 1) {
            advanceToNextLead();
          } else {
            onClose();
          }
        }, Math.max(1200, isCampaignMode ? delay : 1200));
      } else {
        setSendStatus('failed');
        setSendError(result.error || t('notify.api_error'));
      }
    } catch {
      setSendStatus('failed');
      setSendError(t('notify.server_error'));
    }
  };

  const handleOpenWhatsApp = () => {
    window.open(whatsappUrl, '_blank');
    onStatusChange(activeLead.id, 'contacted');

    if (isCampaignMode && currentIndex < campaignLeads.length - 1) {
      advanceToNextLead();
    } else {
      onClose();
    }
  };

  /** Personalized message for any lead using the currently selected tab/template. */
  const buildMessageForLead = (target: Lead): string => {
    if (activeTab === 'templates') {
      return applyTemplate(currentTemplateObj.template, target);
    }
    if (activeTab === 'drip') {
      const drip = DRIP_SEQUENCES.find(d => d.step === selectedDripStep);
      if (drip) return applyTemplate(drip.template, target);
    }
    const autoTemplate = config.autoMessageTemplate || DEFAULT_AUTO_MESSAGE_TEMPLATE;
    return applyTemplate(autoTemplate, target);
  };

  /** Campaign bulk auto-send: one click dispatches to every valid WhatsApp number. */
  const handleBulkSend = async () => {
    if (!hasApiProvider || bulkSending || !isCampaignMode || campaignLeads.length === 0) return;
    bulkCancelRef.current = false;
    setBulkSending(true);
    setBulkReport(null);

    const delayMs = Math.max(1000, (config.sendDelaySeconds || 2) * 1000);
    const total = campaignLeads.length;
    let sent = 0, failed = 0, skipped = 0;
    const errors: string[] = [];
    setBulkProgress({ done: 0, total, sent: 0, failed: 0, skipped: 0 });

    for (let i = 0; i < campaignLeads.length; i++) {
      if (bulkCancelRef.current) break;
      const target = campaignLeads[i];
      const normalized = normalizeToInternational(target.phone || '');
      if (!normalized || !isValidPhone(normalized) || (skipNoWhatsApp && target.hasWhatsApp === false)) {
        skipped++;
        setBulkProgress({ done: i + 1, total, sent, failed, skipped });
        continue;
      }
      try {
        const res = await fetch('/api/whatsapp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            config,
            message: { to: normalized, text: buildMessageForLead(target) },
            action: 'send',
          }),
        });
        const result = await res.json();
        if (result.success) {
          sent++;
          onStatusChange(target.id, 'contacted');
        } else {
          failed++;
          if (errors.length < 5) errors.push(`${target.name}: ${result.error || 'failed'}`);
        }
      } catch {
        failed++;
        if (errors.length < 5) errors.push(`${target.name}: server error`);
      }
      setBulkProgress({ done: i + 1, total, sent, failed, skipped });
      if (i < campaignLeads.length - 1 && !bulkCancelRef.current) {
        await new Promise(r => setTimeout(r, delayMs));
      }
    }

    setBulkSending(false);
    setBulkReport({ sent, failed, skipped, total, cancelled: bulkCancelRef.current, errors });
  };

  const advanceToNextLead = () => {
    const nextIndex = currentIndex + 1;
    setCurrentIndex(nextIndex);
    const nextLead = campaignLeads[nextIndex];
    const autoTemplate = config.autoMessageTemplate || DEFAULT_AUTO_MESSAGE_TEMPLATE;
    setCustomMessage(applyTemplate(autoTemplate, nextLead));
    setSendStatus('idle');
    setSendError(null);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(customMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (showSettings) {
    return (
      <WhatsAppSettingsModal
        onClose={() => setShowSettings(false)}
        onSaved={(updated) => {
          setConfig(updated);
          if (activeTab === 'admin_auto') {
            setCustomMessage(applyTemplate(updated.autoMessageTemplate || DEFAULT_AUTO_MESSAGE_TEMPLATE, activeLead));
          }
        }}
      />
    );
  }

  return (
    <Modal
      size="lg"
      onClose={onClose}
      icon={<MessageCircle size={18} />}
      iconTone="whatsapp"
      title={isCampaignMode
        ? `${t('whatsapp.campaign.mode')} (${currentIndex + 1} ${t('whatsapp.campaign.of')} ${campaignLeads.length})`
        : t('whatsapp.title')}
      subtitle={`${activeLead.name} - ${activeLead.city} (${activeLead.phone || (t('common.phone') + ': --')})`}
      headerActions={
        <Button
          size="sm"
          icon={<Settings size={15} />}
          onClick={() => setShowSettings(true)}
          title={t('whatsapp.api.settings')}
        >
          {t('header.messages.settings')}
        </Button>
      }
      footer={
        <>
          {isCampaignMode ? (
            <div className="flex-align gap-2">
              <Button
                size="sm"
                disabled={currentIndex === 0}
                onClick={() => {
                  const prev = currentIndex - 1;
                  setCurrentIndex(prev);
                  const prevLead = campaignLeads[prev];
                  const autoTemplate = config.autoMessageTemplate || DEFAULT_AUTO_MESSAGE_TEMPLATE;
                  setCustomMessage(applyTemplate(autoTemplate, prevLead));
                }}
              >
                {t('action.previous')}
              </Button>
              <span className="text-sm subtext">{currentIndex + 1} / {campaignLeads.length}</span>
            </div>
          ) : (
            <Button onClick={onClose}>
              {t('action.cancel')}
            </Button>
          )}

          <div className="flex-align gap-2">
            {isCampaignMode && hasApiProvider && (
              <Button
                variant="whatsapp"
                onClick={handleBulkSend}
                disabled={bulkSending || campaignLeads.length === 0}
                title={locale === 'ar' ? 'إرسال تلقائي واحد لكل جهات الحملة' : 'One-click auto-send to the whole campaign'}
                loading={bulkSending}
                icon={<Zap size={16} />}
              >
                {bulkSending
                  ? (locale === 'ar' ? 'جاري الإرسال للكل...' : 'Sending to all...')
                  : (locale === 'ar' ? `إرسال تلقائي للكل 🚀 (${campaignLeads.length})` : `Auto-send to all 🚀 (${campaignLeads.length})`)}
              </Button>
            )}
            {hasApiProvider && (
              <Button
                variant="whatsapp"
                onClick={handleSendViaAPI}
                disabled={!activeLead.phone || sendStatus === 'sending' || sendStatus === 'sent' || bulkSending}
                loading={sendStatus === 'sending'}
                icon={<Send size={16} />}
              >
                {sendStatus === 'sending'
                  ? (locale === 'ar' ? 'جاري الإرسال عبر Green-API...' : 'Sending via Green-API...')
                  : isCampaignMode && currentIndex < campaignLeads.length - 1
                    ? t('whatsapp.campaign.send')
                    : (locale === 'ar' ? `إرسال عبر ${getProviderDisplayName()}` : `Send via ${getProviderDisplayName()}`)}
              </Button>
            )}

            <Button
              onClick={handleOpenWhatsApp}
              disabled={!activeLead.phone || bulkSending}
              icon={<MessageCircle size={16} />}
              className={hasApiProvider ? 'btn-dashed' : undefined}
            >
              {hasApiProvider
                ? (locale === 'ar' ? 'wa.me (يدوي)' : 'wa.me (manual)')
                : t('whatsapp.open')}
            </Button>
          </div>
        </>
      }
    >
          {activeLead.opportunityReason && (
            <div className="opportunity-banner">
              <Sparkles size={16} />
              <div>
                <strong>{activeLead.opportunityScore || 90}% - {activeLead.opportunityReason}</strong>
              </div>
            </div>
          )}

          {/* API Status Indicator */}
          {hasApiProvider && (
            <Banner tone="green" icon={<CheckCircle size={15} />}>
              <span>
                {getProviderDisplayName()} • {locale === 'ar' ? 'البوابة جاهزة للإرسال الآلي' : 'Ready for auto-messaging'}
              </span>
              <Button variant="ghost" size="xs" onClick={() => setShowSettings(true)}>
                {locale === 'ar' ? 'تعديل الإعدادات' : 'Configure'}
              </Button>
            </Banner>
          )}

          {/* Send Status Feedback */}
          {sendStatus === 'sent' && (
            <Banner tone="green" icon={<CheckCircle size={16} />}>
              {locale === 'ar' ? 'تم إرسال الرسالة بنجاح عبر Green-API!' : 'Message sent successfully via Green-API!'}
            </Banner>
          )}

          {sendStatus === 'failed' && sendError && (
            <Banner tone="red" icon={<AlertTriangle size={16} />}>
              {sendError}
            </Banner>
          )}

          {/* Bulk auto-send progress / report (campaign mode) */}
          {isCampaignMode && hasApiProvider && bulkProgress && (
            <Banner tone="whatsapp">
              <div className="ui-flex-fill">
                <div className="flex-between ui-mb-2">
                  <strong>
                    {bulkSending
                      ? (locale === 'ar' ? `🚀 جاري الإرسال التلقائي... (${bulkProgress.done}/${bulkProgress.total})` : `🚀 Auto-sending... (${bulkProgress.done}/${bulkProgress.total})`)
                      : (locale === 'ar' ? `📊 نتيجة الإرسال التلقائي (${bulkProgress.done}/${bulkProgress.total})` : `📊 Bulk send report (${bulkProgress.done}/${bulkProgress.total})`)}
                  </strong>
                  {bulkSending && (
                    <Button size="xs" icon={<X size={12} />} onClick={() => { bulkCancelRef.current = true; }}>
                      {locale === 'ar' ? 'إيقاف' : 'Stop'}
                    </Button>
                  )}
                </div>
                <div className="ui-progress-track">
                  <div
                    className="ui-progress-fill"
                    style={{ width: `${bulkProgress.total ? Math.round((bulkProgress.done / bulkProgress.total) * 100) : 0}%` }}
                  />
                </div>
                <div className="ui-row-counts">
                  <StatusPill tone="green">✅ {bulkProgress.sent} {locale === 'ar' ? 'تم' : 'sent'}</StatusPill>
                  <StatusPill tone="red">❌ {bulkProgress.failed} {locale === 'ar' ? 'فشل' : 'failed'}</StatusPill>
                  <span className="subtext">⏭️ {bulkProgress.skipped} {locale === 'ar' ? 'تُخطي' : 'skipped'}</span>
                </div>
                {bulkReport && !bulkSending && (
                  <div className="ui-report">
                    <div>
                      {bulkReport.cancelled
                        ? (locale === 'ar' ? '⏹️ تم إيقاف الإرسال يدوياً.' : '⏹️ Sending stopped manually.')
                        : (locale === 'ar'
                          ? `انتهى الإرسال: ${bulkReport.sent} ناجح، ${bulkReport.failed} فاشل، ${bulkReport.skipped} متخطى من أصل ${bulkReport.total}.`
                          : `Finished: ${bulkReport.sent} sent, ${bulkReport.failed} failed, ${bulkReport.skipped} skipped of ${bulkReport.total}.`)}
                    </div>
                    {bulkReport.errors.length > 0 && (
                      <div className="subtext">
                        {bulkReport.errors.map((e, idx) => <div key={idx}>• {e}</div>)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Banner>
          )}

          {/* Skip non-WhatsApp numbers option (campaign bulk mode) */}
          {isCampaignMode && hasApiProvider && !bulkSending && !bulkReport && (
            <label className="ui-check-row">
              <input
                type="checkbox"
                className="ui-checkbox"
                checked={skipNoWhatsApp}
                onChange={e => setSkipNoWhatsApp(e.target.checked)}
              />
              <span>{locale === 'ar' ? 'تخطي الأرقام المسجلة بدون واتساب (أرضي/غير صالح) أثناء الإرسال التلقائي' : 'Skip non-WhatsApp numbers during auto-send'}</span>
            </label>
          )}

          {/* Template Selection Tabs */}
          <div className="whatsapp-tab-group">
            <button
              type="button"
              className={`whatsapp-tab-btn ${activeTab === 'admin_auto' ? 'active' : ''}`}
              onClick={handleSelectAdminAuto}
            >
              <FileText size={14} />
              <span>{locale === 'ar' ? 'رسالة الإعدادات المعتمدة ⭐' : 'Admin Template ⭐'}</span>
            </button>
            <button
              type="button"
              className={`whatsapp-tab-btn ${activeTab === 'templates' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('templates');
                handleSelectTemplate(selectedTemplateId);
              }}
            >
              <Layers size={14} />
              <span>{t('whatsapp.templates')}</span>
            </button>
            <button
              type="button"
              className={`whatsapp-tab-btn ${activeTab === 'drip' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('drip');
                handleSelectDrip(selectedDripStep);
              }}
            >
              <Repeat size={14} />
              <span>{t('whatsapp.drip')}</span>
            </button>
          </div>

          {activeTab === 'templates' && (
            <div className="template-selector-box">
              <label className="modal-label">
                <span>{t('whatsapp.templates')}:</span>
              </label>
              <div className="template-chips">
                {MARKETING_TEMPLATES.map(tmpl => (
                  <button
                    key={tmpl.id}
                    type="button"
                    className={`preset-chip ${selectedTemplateId === tmpl.id ? 'chip-active' : ''}`}
                    onClick={() => handleSelectTemplate(tmpl.id)}
                  >
                    {tmpl.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'drip' && (
            <div className="template-selector-box">
              <label className="modal-label">
                <Clock size={14} />
                <span>{t('whatsapp.drip')}:</span>
              </label>
              <div className="drip-steps-grid">
                {DRIP_SEQUENCES.map(drip => (
                  <button
                    key={drip.step}
                    type="button"
                    className={`drip-step-card ${selectedDripStep === drip.step ? 'active' : ''}`}
                    onClick={() => handleSelectDrip(drip.step)}
                  >
                    <div className="step-num">#{drip.step}</div>
                    <div className="step-timing">{drip.timing}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message Content Area */}
          <div className="modal-form-group">
            <div className="flex-between">
              <label className="modal-label">
                <span>{t('whatsapp.message')}:</span>
              </label>
              <Button size="xs" onClick={handleCopy} icon={copied ? <Check size={13} /> : <Copy size={13} />}>
                {copied ? t('notify.copied') : t('whatsapp.copy')}
              </Button>
            </div>
            <textarea
              className="textarea-field font-regular"
              rows={6}
              value={customMessage}
              onChange={e => setCustomMessage(e.target.value)}
            />
          </div>
    </Modal>
  );
};
