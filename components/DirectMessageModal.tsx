'use client';

import React, { useState, useEffect } from 'react';
import {
  Send,
  MessageCircle,
  Phone,
  User,
  MapPin,
  Check,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
  Copy,
  Layers,
  Sparkles,
  X
} from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { getWhatsAppConfig, DEFAULT_AUTO_MESSAGE_TEMPLATE, WhatsAppConfig } from '@/lib/whatsappProviders';
import { formatPhoneForWhatsApp } from '@/lib/exporter';
import { MARKETING_TEMPLATES, applyTemplate } from '@/lib/opportunity';
import { Lead } from '@/lib/types';

interface DirectMessageModalProps {
  onClose: () => void;
  onSuccess?: (phone: string, message: string) => void;
}

export const DirectMessageModal: React.FC<DirectMessageModalProps> = ({ onClose, onSuccess }) => {
  const { t, locale } = useLanguage();
  const [config, setConfig] = useState<WhatsAppConfig>(getWhatsAppConfig());
  
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientCity, setRecipientCity] = useState(locale === 'ar' ? 'عمان' : 'Amman');
  const [recipientCategory, setRecipientCategory] = useState(locale === 'ar' ? 'مطاعم ومتاجر' : 'Stores & Restaurants');

  const [messageText, setMessageText] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('alnada_delivery');
  
  const [isSending, setIsSending] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<{ hasWhatsApp: boolean; message: string } | null>(null);
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // Initialize and update message based on inputs and template
  useEffect(() => {
    const rawTemplate = config.autoMessageTemplate || DEFAULT_AUTO_MESSAGE_TEMPLATE;
    const dummyLead: Partial<Lead> = {
      name: recipientName.trim() || (locale === 'ar' ? 'المحل' : 'Store'),
      city: recipientCity.trim() || (locale === 'ar' ? 'المنطقة' : 'Area'),
      category: recipientCategory.trim() || (locale === 'ar' ? 'النشاط' : 'Business'),
      phone: recipientPhone.trim(),
    };
    setMessageText(applyTemplate(rawTemplate, dummyLead as Lead));
  }, [recipientName, recipientCity, recipientCategory, config.autoMessageTemplate, locale, recipientPhone]);

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const tmpl = MARKETING_TEMPLATES.find(t => t.id === templateId);
    if (tmpl) {
      const dummyLead: Partial<Lead> = {
        name: recipientName.trim() || (locale === 'ar' ? 'المحل' : 'Store'),
        city: recipientCity.trim() || (locale === 'ar' ? 'المنطقة' : 'Area'),
        category: recipientCategory.trim() || (locale === 'ar' ? 'النشاط' : 'Business'),
        phone: recipientPhone.trim(),
      };
      setMessageText(applyTemplate(tmpl.template, dummyLead as Lead));
    }
  };

  const handleCheckWhatsApp = async () => {
    if (!recipientPhone.trim()) return;
    setIsChecking(true);
    setCheckResult(null);

    try {
      const res = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config,
          message: { to: recipientPhone },
          action: 'checkNumber',
        }),
      });
      const data = await res.json();

      if (data.success && data.whatsapp) {
        setCheckResult({
          hasWhatsApp: true,
          message: locale === 'ar' ? '✅ الرقم مسجل ومفعل على واتساب' : '✅ Number is registered on WhatsApp',
        });
      } else {
        setCheckResult({
          hasWhatsApp: false,
          message: locale === 'ar' ? '⚠️ الرقم غير مسجل على واتساب أو تعذر التحقق منه' : '⚠️ Number not on WhatsApp or could not verify',
        });
      }
    } catch {
      setCheckResult({
        hasWhatsApp: false,
        message: locale === 'ar' ? '❌ خطأ أثناء التحقق' : '❌ Verification error',
      });
    } finally {
      setIsChecking(false);
    }
  };

  const handleSendViaAPI = async () => {
    if (!recipientPhone.trim() || !messageText.trim()) return;
    setIsSending(true);
    setSendResult(null);

    try {
      const res = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config,
          message: {
            to: recipientPhone,
            text: messageText,
          },
          action: 'send',
        }),
      });
      const data = await res.json();

      if (data.success) {
        setSendResult({
          success: true,
          message: locale === 'ar'
            ? `✅ تم إرسال الرسالة إلى (${recipientPhone}) بنجاح عبر Green-API!`
            : `✅ Message delivered to (${recipientPhone}) via Green-API!`,
        });
        if (onSuccess) onSuccess(recipientPhone, messageText);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setSendResult({
          success: false,
          message: `${locale === 'ar' ? '❌ فشل الإرسال:' : '❌ Failed to send:'} ${data.error || 'Check settings'}`,
        });
      }
    } catch {
      setSendResult({
        success: false,
        message: locale === 'ar' ? '❌ خطأ أثناء الاتصال بالخادم' : '❌ Server connection error',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleOpenWaMe = () => {
    const cleanPhone = formatPhoneForWhatsApp(recipientPhone);
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`;
    window.open(url, '_blank');
    if (onSuccess) onSuccess(recipientPhone, messageText);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasApiProvider = config.provider !== 'none';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-box modal-lg"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '720px', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title flex-align gap-2">
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: 'rgba(37, 211, 102, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--whatsapp-color, #25D366)',
              }}
            >
              <Send size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>
                {locale === 'ar' ? 'إرسال رسالة واتساب لجهة محددة' : 'Send WhatsApp to Specific Contact'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--text-tertiary)' }}>
                {locale === 'ar'
                  ? 'أدخل رقم الهاتف وبيانات المحل لإرسال رسالة العرض تلقائياً'
                  : 'Enter phone number and details to dispatch your offer'}
              </p>
            </div>
          </div>
          <button className="btn-close" onClick={onClose}>&times;</button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Recipient Inputs Grid */}
          <div
            style={{
              background: 'var(--bg-surface-elevated, #1c1c28)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
              {/* Phone Input with validation check button */}
              <div>
                <label className="input-label" style={{ fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                  <Phone size={13} style={{ color: '#25D366' }} />
                  <span>{locale === 'ar' ? 'رقم هاتف المستلم' : 'Recipient Phone'} *</span>
                </label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="text"
                    placeholder="e.g. 0788779463 or 962788779463"
                    value={recipientPhone}
                    onChange={e => {
                      setRecipientPhone(e.target.value);
                      setCheckResult(null);
                    }}
                    style={{
                      flex: 1,
                      padding: '9px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-default)',
                      background: 'var(--bg-surface)',
                      color: 'var(--text-primary)',
                      fontFamily: 'monospace',
                      fontSize: '0.9rem',
                    }}
                  />
                  {hasApiProvider && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-xs"
                      onClick={handleCheckWhatsApp}
                      disabled={isChecking || !recipientPhone.trim()}
                      title={locale === 'ar' ? 'فحص وجود الواتساب' : 'Check WhatsApp'}
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      {isChecking ? <Loader2 size={13} className="spin" /> : <ShieldCheck size={13} />}
                      <span>{locale === 'ar' ? 'فحص' : 'Check'}</span>
                    </button>
                  )}
                </div>
                {checkResult && (
                  <div
                    style={{
                      fontSize: '0.75rem',
                      marginTop: '4px',
                      color: checkResult.hasWhatsApp ? 'var(--status-green, #16a34a)' : 'var(--status-red, #dc2626)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontWeight: 600,
                    }}
                  >
                    {checkResult.hasWhatsApp ? <Check size={12} /> : <AlertTriangle size={12} />}
                    <span>{checkResult.message}</span>
                  </div>
                )}
              </div>

              {/* Name Input */}
              <div>
                <label className="input-label" style={{ fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                  <User size={13} />
                  <span>{locale === 'ar' ? 'اسم المحل / المستلم' : 'Business / Contact Name'}</span>
                </label>
                <input
                  type="text"
                  placeholder={locale === 'ar' ? 'مثال: مطعم ورد الشام' : 'e.g. Al-Ameed Coffee'}
                  value={recipientName}
                  onChange={e => setRecipientName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-default)',
                    background: 'var(--bg-surface)',
                    color: 'var(--text-primary)',
                    fontSize: '0.88rem',
                  }}
                />
              </div>

              {/* City Input */}
              <div>
                <label className="input-label" style={{ fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                  <MapPin size={13} />
                  <span>{locale === 'ar' ? 'المدينة / المنطقة' : 'City / Region'}</span>
                </label>
                <input
                  type="text"
                  placeholder={locale === 'ar' ? 'مثال: عمان - خلدا' : 'e.g. Amman - Khalda'}
                  value={recipientCity}
                  onChange={e => setRecipientCity(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-default)',
                    background: 'var(--bg-surface)',
                    color: 'var(--text-primary)',
                    fontSize: '0.88rem',
                  }}
                />
              </div>

              {/* Category Input */}
              <div>
                <label className="input-label" style={{ fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                  <Sparkles size={13} />
                  <span>{locale === 'ar' ? 'نوع النشاط' : 'Business Category'}</span>
                </label>
                <input
                  type="text"
                  placeholder={locale === 'ar' ? 'مثال: حلويات ومأكولات' : 'e.g. Sweets & Cafe'}
                  value={recipientCategory}
                  onChange={e => setRecipientCategory(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-default)',
                    background: 'var(--bg-surface)',
                    color: 'var(--text-primary)',
                    fontSize: '0.88rem',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Preset Templates Selector */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <Layers size={13} style={{ color: '#25D366' }} />
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                {locale === 'ar' ? 'اختر نموذج الرسالة:' : 'Choose Message Template:'}
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {MARKETING_TEMPLATES.map(tmpl => (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => handleSelectTemplate(tmpl.id)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '16px',
                    background: selectedTemplateId === tmpl.id ? 'rgba(37, 211, 102, 0.15)' : 'var(--bg-surface-elevated)',
                    border: `1px solid ${selectedTemplateId === tmpl.id ? '#25D366' : 'var(--border-default)'}`,
                    color: selectedTemplateId === tmpl.id ? '#25D366' : 'var(--text-secondary)',
                    fontSize: '0.78rem',
                    fontWeight: selectedTemplateId === tmpl.id ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {tmpl.title}
                </button>
              ))}
            </div>
          </div>

          {/* Message Textarea */}
          <div>
            <div className="flex-between" style={{ marginBottom: '6px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {locale === 'ar' ? 'نص الرسالة المرسلة:' : 'Message Content:'}
              </label>
              <button type="button" className="btn btn-secondary btn-xs" onClick={handleCopy}>
                {copied ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                <span>{copied ? t('notify.copied') : t('whatsapp.copy')}</span>
              </button>
            </div>
            <textarea
              className="textarea-field"
              rows={7}
              value={messageText}
              onChange={e => setMessageText(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-default)',
                background: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                fontSize: '0.86rem',
                lineHeight: 1.6,
              }}
            />
          </div>

          {/* Send Status Banner */}
          {sendResult && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                background: sendResult.success ? 'var(--status-green-bg, rgba(34, 197, 94, 0.12))' : 'var(--status-red-bg, rgba(239, 68, 68, 0.1))',
                border: `1px solid ${sendResult.success ? 'var(--status-green-border, #16a34a)' : 'var(--status-red-border, #dc2626)'}`,
                fontSize: '0.85rem',
                fontWeight: 600,
                color: sendResult.success ? 'var(--status-green, #16a34a)' : 'var(--status-red, #dc2626)',
              }}
            >
              {sendResult.success ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
              <span>{sendResult.message}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer flex-between" style={{ padding: '14px 20px', borderTop: '1px solid var(--border-default)' }}>
          <button className="btn btn-secondary" onClick={onClose}>
            {t('action.cancel')}
          </button>

          <div className="flex-align gap-2">
            {hasApiProvider && (
              <button
                className="btn btn-whatsapp"
                onClick={handleSendViaAPI}
                disabled={!recipientPhone.trim() || isSending}
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
                {isSending ? <Loader2 size={16} className="spin" /> : <Send size={16} />}
                <span>
                  {isSending
                    ? (locale === 'ar' ? 'جاري الإرسال عبر Green-API...' : 'Sending via Green-API...')
                    : (locale === 'ar' ? 'إرسال عبر Green-API' : 'Send via Green-API')}
                </span>
              </button>
            )}

            <button
              className="btn btn-secondary"
              onClick={handleOpenWaMe}
              disabled={!recipientPhone.trim()}
              style={hasApiProvider ? { border: '1px dashed var(--border-default)' } : {}}
            >
              <MessageCircle size={16} />
              <span>{hasApiProvider ? (locale === 'ar' ? 'wa.me (يدوي)' : 'wa.me (manual)') : t('whatsapp.open')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
