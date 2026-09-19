'use client';

import React, { useState, useMemo } from 'react';
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
  Loader2,
  FileText,
} from 'lucide-react';
import { Lead, LeadStatus } from '@/lib/types';
import { formatPhoneForWhatsApp } from '@/lib/exporter';
import { MARKETING_TEMPLATES, DRIP_SEQUENCES, applyTemplate } from '@/lib/opportunity';
import { useLanguage } from '@/lib/LanguageContext';
import { getWhatsAppConfig, DEFAULT_AUTO_MESSAGE_TEMPLATE, WhatsAppConfig } from '@/lib/whatsappProviders';
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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-left">
            <div className="modal-header-icon" style={{ background: 'rgba(37, 211, 102, 0.12)', color: 'var(--whatsapp-color, #25D366)' }}>
              <MessageCircle size={18} />
            </div>
            <div>
              <h3 className="modal-title">
                {isCampaignMode
                  ? `${t('whatsapp.campaign.mode')} (${currentIndex + 1} ${t('whatsapp.campaign.of')} ${campaignLeads.length})`
                  : t('whatsapp.title')}
              </h3>
              <p className="modal-subtitle">
                {activeLead.name} - {activeLead.city} ({activeLead.phone || (t('common.phone') + ': --')})
              </p>
            </div>
          </div>
          <div className="flex-align gap-2">
            <button
              className="btn btn-secondary btn-icon"
              onClick={() => setShowSettings(true)}
              title={t('whatsapp.api.settings')}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}
            >
              <Settings size={15} />
              <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{t('header.messages.settings')}</span>
            </button>
            <button className="modal-close-btn" onClick={onClose} title={t('action.close')}>
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="modal-body">
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
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 14px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--status-green-bg, rgba(34, 197, 94, 0.1))',
                border: '1px solid var(--status-green-border, rgba(34, 197, 94, 0.3))',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: 'var(--status-green, #16a34a)',
              }}
            >
              <div className="flex-align gap-2">
                <CheckCircle size={15} />
                <span>
                  {getProviderDisplayName()} • {locale === 'ar' ? 'البوابة جاهزة للإرسال الآلي' : 'Ready for auto-messaging'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowSettings(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'inherit',
                  textDecoration: 'underline',
                  fontSize: '0.76rem',
                  cursor: 'pointer',
                  fontWeight: 700,
                }}
              >
                {locale === 'ar' ? 'تعديل الإعدادات' : 'Configure'}
              </button>
            </div>
          )}

          {/* Send Status Feedback */}
          {sendStatus === 'sent' && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--status-green-bg, rgba(34, 197, 94, 0.12))',
                border: '1px solid var(--status-green-border, #16a34a)',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--status-green, #16a34a)',
              }}
            >
              <CheckCircle size={16} />
              <span>{locale === 'ar' ? 'تم إرسال الرسالة بنجاح عبر Green-API!' : 'Message sent successfully via Green-API!'}</span>
            </div>
          )}

          {sendStatus === 'failed' && sendError && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--status-red-bg, rgba(239, 68, 68, 0.1))',
                border: '1px solid var(--status-red-border, #dc2626)',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--status-red, #dc2626)',
              }}
            >
              <AlertTriangle size={16} />
              <span>{sendError}</span>
            </div>
          )}

          {/* Template Selection Tabs */}
          <div className="whatsapp-tab-group" style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              className={`whatsapp-tab-btn ${activeTab === 'admin_auto' ? 'active' : ''}`}
              onClick={handleSelectAdminAuto}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
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
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
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
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
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
              <button type="button" className="btn btn-secondary btn-xs" onClick={handleCopy}>
                {copied ? <Check size={13} className="text-success" /> : <Copy size={13} />}
                <span>{copied ? t('notify.copied') : t('whatsapp.copy')}</span>
              </button>
            </div>
            <textarea
              className="textarea-field font-regular"
              rows={6}
              value={customMessage}
              onChange={e => setCustomMessage(e.target.value)}
              style={{ lineHeight: 1.6 }}
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer flex-between">
          {isCampaignMode ? (
            <div className="flex-align gap-2">
              <button
                className="btn btn-secondary btn-sm"
                disabled={currentIndex === 0}
                onClick={() => {
                  const prev = currentIndex - 1;
                  setCurrentIndex(prev);
                  const prevLead = campaignLeads[prev];
                  const autoTemplate = config.autoMessageTemplate || DEFAULT_AUTO_MESSAGE_TEMPLATE;
                  setCustomMessage(applyTemplate(autoTemplate, prevLead));
                }}
              >
                <span>{t('action.previous')}</span>
              </button>
              <span className="text-sm subtext">{currentIndex + 1} / {campaignLeads.length}</span>
            </div>
          ) : (
            <button className="btn btn-secondary" onClick={onClose}>
              {t('action.cancel')}
            </button>
          )}

          <div className="flex-align gap-2">
            {hasApiProvider && (
              <button
                className="btn btn-whatsapp"
                onClick={handleSendViaAPI}
                disabled={!activeLead.phone || sendStatus === 'sending' || sendStatus === 'sent'}
                style={{
                  background: '#25D366',
                  color: '#fff',
                  borderColor: '#25D366',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: 700,
                }}
              >
                {sendStatus === 'sending' ? (
                  <Loader2 size={16} className="spin" />
                ) : (
                  <Send size={16} />
                )}
                <span>
                  {sendStatus === 'sending'
                    ? (locale === 'ar' ? 'جاري الإرسال عبر Green-API...' : 'Sending via Green-API...')
                    : isCampaignMode && currentIndex < campaignLeads.length - 1
                      ? t('whatsapp.campaign.send')
                      : (locale === 'ar' ? `إرسال عبر ${getProviderDisplayName()}` : `Send via ${getProviderDisplayName()}`)}
                </span>
              </button>
            )}

            <button
              className="btn btn-secondary"
              onClick={handleOpenWhatsApp}
              disabled={!activeLead.phone}
              style={hasApiProvider ? { border: '1px dashed var(--border-default)' } : {}}
            >
              <MessageCircle size={16} />
              <span>
                {hasApiProvider
                  ? (locale === 'ar' ? 'wa.me (يدوي)' : 'wa.me (manual)')
                  : t('whatsapp.open')}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
