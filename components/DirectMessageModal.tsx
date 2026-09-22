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
  CheckCircle2,
  ShieldCheck,
  Copy,
  Layers,
  Sparkles
} from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { getWhatsAppConfig, saveWhatsAppConfig, DEFAULT_AUTO_MESSAGE_TEMPLATE, WhatsAppConfig } from '@/lib/whatsappProviders';
import { getWhatsAppConfigFromSupabase } from '@/lib/supabase';
import { formatPhoneForWhatsApp } from '@/lib/exporter';
import { normalizeToInternational, phoneValidationError } from '@/lib/phone';
import { MARKETING_TEMPLATES, applyTemplate } from '@/lib/opportunity';
import { Lead } from '@/lib/types';
import { Modal, Button, Banner, Field, TextInput, TextArea } from '@/components/ui';

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
  const [configLoading, setConfigLoading] = useState(true);

  // Refresh config from server/Supabase on mount: localStorage alone may be
  // stale (e.g. credentials saved on another browser), which previously hid
  // the API send button or sent with empty credentials.
  useEffect(() => {
    let cancelled = false;
    async function refreshConfig() {
      try {
        const dbConfig = await getWhatsAppConfigFromSupabase();
        if (!cancelled && dbConfig && (dbConfig.provider !== 'none' || dbConfig.greenapi?.idInstance)) {
          const merged = { ...getWhatsAppConfig(), ...dbConfig };
          setConfig(merged);
          saveWhatsAppConfig(merged);
          return;
        }
      } catch {}
      try {
        const r = await fetch('/api/whatsapp/config');
        const data = await r.json();
        if (!cancelled && data?.config && (data.config.provider !== 'none' || data.config.greenapi?.idInstance)) {
          const merged = { ...getWhatsAppConfig(), ...data.config };
          setConfig(merged);
          saveWhatsAppConfig(merged);
        }
      } catch {} finally {
        if (!cancelled) setConfigLoading(false);
      }
      if (!cancelled) setConfigLoading(false);
    }
    refreshConfig();
    return () => { cancelled = true; };
  }, []);

  // Normalized international number preview + live validation
  const normalizedPhone = normalizeToInternational(recipientPhone || '');
  const phoneError = recipientPhone.trim() ? phoneValidationError(normalizedPhone, locale) : null;

  // Initialize and update message based on inputs and template
  useEffect(() => {
    const rawTemplate = config.autoMessageTemplate || DEFAULT_AUTO_MESSAGE_TEMPLATE;
    const dummyLead: Partial<Lead> = {
      name: recipientName.trim() || (locale === 'ar' ? 'المحل' : 'Store'),
      city: recipientCity.trim() || (locale === 'ar' ? 'المنطقة' : 'Area'),
      category: recipientCategory.trim() || (locale === 'ar' ? 'النشاط' : 'Business'),
      phone: recipientPhone.trim(),
    };
    // eslint-disable-next-line react-hooks/set-state-in-effect -- derived template text synced on input/config change
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
    if (phoneError || !normalizedPhone) {
      setCheckResult({
        hasWhatsApp: false,
        message: phoneError || (locale === 'ar' ? '❌ رقم الهاتف غير صالح' : '❌ Invalid phone number'),
      });
      return;
    }
    setIsChecking(true);
    setCheckResult(null);

    try {
      const res = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config,
          message: { to: normalizedPhone },
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
    if (phoneError || !normalizedPhone) {
      setSendResult({
        success: false,
        message: phoneError || (locale === 'ar' ? '❌ رقم الهاتف غير صالح — أدخل رقماً بصيغة دولية أو محلية أردنية (07...) ' : '❌ Invalid phone number'),
      });
      return;
    }
    if (config.provider === 'none') {
      setSendResult({
        success: false,
        message: locale === 'ar'
          ? '❌ لا توجد بوابة إرسال مفعّلة. افتح إعدادات الواتساب واختر GREEN-API ثم احفظ البيانات.'
          : '❌ No sending gateway active. Open WhatsApp settings and configure GREEN-API.',
      });
      return;
    }
    if (config.provider === 'greenapi' && (!config.greenapi?.idInstance || !config.greenapi?.apiTokenInstance)) {
      setSendResult({
        success: false,
        message: locale === 'ar'
          ? '❌ بيانات Green-API ناقصة (idInstance / apiTokenInstance). افتح الإعدادات وأكمل الحفظ ثم أعد المحاولة.'
          : '❌ Green-API credentials missing. Open settings, save them, then retry.',
      });
      return;
    }
    setIsSending(true);
    setSendResult(null);

    try {
      const res = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config,
          message: {
            to: normalizedPhone,
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
            ? `✅ تم إرسال الرسالة إلى (${normalizedPhone}) بنجاح عبر Green-API!`
            : `✅ Message delivered to (${normalizedPhone}) via Green-API!`,
        });
        if (onSuccess) onSuccess(normalizedPhone, messageText);
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
    if (phoneError || !normalizedPhone) {
      setSendResult({
        success: false,
        message: phoneError || (locale === 'ar' ? '❌ رقم الهاتف غير صالح' : '❌ Invalid phone number'),
      });
      return;
    }
    const cleanPhone = formatPhoneForWhatsApp(recipientPhone);
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`;
    window.open(url, '_blank');
    if (onSuccess) onSuccess(cleanPhone, messageText);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasApiProvider = config.provider !== 'none';

  return (
    <Modal
      size="lg"
      onClose={onClose}
      icon={<Send size={18} />}
      iconTone="whatsapp"
      title={locale === 'ar' ? 'إرسال رسالة واتساب لجهة محددة' : 'Send WhatsApp to Specific Contact'}
      subtitle={locale === 'ar'
        ? 'أدخل رقم الهاتف وبيانات المحل لإرسال رسالة العرض تلقائياً'
        : 'Enter phone number and details to dispatch your offer'}
      bodyClassName="ui-stack ui-modal-body--scroll"
      footer={
        <>
          <Button onClick={onClose}>
            {t('action.cancel')}
          </Button>

          <div className="flex-align gap-2">
            {hasApiProvider && (
              <Button
                variant="whatsapp"
                onClick={handleSendViaAPI}
                disabled={!recipientPhone.trim() || !!phoneError || isSending || configLoading}
                loading={isSending}
                icon={<Send size={16} />}
              >
                {isSending
                  ? (locale === 'ar' ? 'جاري الإرسال عبر Green-API...' : 'Sending via Green-API...')
                  : (locale === 'ar' ? 'إرسال عبر Green-API' : 'Send via Green-API')}
              </Button>
            )}

            <Button
              onClick={handleOpenWaMe}
              disabled={!recipientPhone.trim() || !!phoneError}
              icon={<MessageCircle size={16} />}
              className={hasApiProvider ? 'btn-dashed' : undefined}
            >
              {hasApiProvider ? (locale === 'ar' ? 'wa.me (يدوي)' : 'wa.me (manual)') : t('whatsapp.open')}
            </Button>
          </div>
        </>
      }
    >
          {/* Recipient Inputs Grid */}
          <div className="ui-card">
            <div className="ui-grid-2col">
              {/* Phone Input with validation check button */}
              <Field
                icon={<Phone size={13} />}
                label={<>{locale === 'ar' ? 'رقم هاتف المستلم' : 'Recipient Phone'} *</>}
              >
                <div className="flex-align gap-2">
                  <TextInput
                    type="text"
                    className="ui-flex-fill ui-input-phone"
                    placeholder="e.g. 0788779463 or 962788779463"
                    value={recipientPhone}
                    onChange={e => {
                      setRecipientPhone(e.target.value);
                      setCheckResult(null);
                    }}
                  />
                  {hasApiProvider && (
                    <Button
                      size="xs"
                      onClick={handleCheckWhatsApp}
                      disabled={isChecking || !recipientPhone.trim()}
                      title={locale === 'ar' ? 'فحص وجود الواتساب' : 'Check WhatsApp'}
                      loading={isChecking}
                      icon={<ShieldCheck size={13} />}
                    >
                      {locale === 'ar' ? 'فحص' : 'Check'}
                    </Button>
                  )}
                </div>
                {checkResult && (
                  <Banner tone={checkResult.hasWhatsApp ? 'green' : 'red'} icon={checkResult.hasWhatsApp ? <Check size={12} /> : <AlertTriangle size={12} />}>
                    {checkResult.message}
                  </Banner>
                )}
                {recipientPhone.trim() && !phoneError && normalizedPhone && (
                  <div className="ui-phone-note">
                    {locale === 'ar' ? 'سيُرسل إلى: +' : 'Will send to: +'}{normalizedPhone}
                  </div>
                )}
                {phoneError && recipientPhone.trim() && (
                  <span className="ui-field-error">
                    <AlertTriangle size={12} />
                    <span>{phoneError}</span>
                  </span>
                )}
                {configLoading && (
                  <span className="ui-field-hint">
                    {locale === 'ar' ? 'جاري تحميل إعدادات الإرسال...' : 'Loading sender settings...'}
                  </span>
                )}
              </Field>

              {/* Name Input */}
              <Field
                icon={<User size={13} />}
                label={locale === 'ar' ? 'اسم المحل / المستلم' : 'Business / Contact Name'}
              >
                <TextInput
                  type="text"
                  placeholder={locale === 'ar' ? 'مثال: مطعم ورد الشام' : 'e.g. Al-Ameed Coffee'}
                  value={recipientName}
                  onChange={e => setRecipientName(e.target.value)}
                />
              </Field>

              {/* City Input */}
              <Field
                icon={<MapPin size={13} />}
                label={locale === 'ar' ? 'المدينة / المنطقة' : 'City / Region'}
              >
                <TextInput
                  type="text"
                  placeholder={locale === 'ar' ? 'مثال: عمان - خلدا' : 'e.g. Amman - Khalda'}
                  value={recipientCity}
                  onChange={e => setRecipientCity(e.target.value)}
                />
              </Field>

              {/* Category Input */}
              <Field
                icon={<Sparkles size={13} />}
                label={locale === 'ar' ? 'نوع النشاط' : 'Business Category'}
              >
                <TextInput
                  type="text"
                  placeholder={locale === 'ar' ? 'مثال: حلويات ومأكولات' : 'e.g. Sweets & Cafe'}
                  value={recipientCategory}
                  onChange={e => setRecipientCategory(e.target.value)}
                />
              </Field>
            </div>
          </div>

          {/* Preset Templates Selector */}
          <div>
            <div className="flex-align gap-2 ui-mb-2">
              <Layers size={13} />
              <span className="subtext">
                {locale === 'ar' ? 'اختر نموذج الرسالة:' : 'Choose Message Template:'}
              </span>
            </div>
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

          {/* Message Textarea */}
          <div>
            <div className="flex-between ui-mb-2">
              <label className="ui-field-label">
                {locale === 'ar' ? 'نص الرسالة المرسلة:' : 'Message Content:'}
              </label>
              <Button size="xs" onClick={handleCopy} icon={copied ? <Check size={12} /> : <Copy size={12} />}>
                {copied ? t('notify.copied') : t('whatsapp.copy')}
              </Button>
            </div>
            <TextArea
              rows={7}
              value={messageText}
              onChange={e => setMessageText(e.target.value)}
            />
          </div>

          {/* Send Status Banner */}
          {sendResult && (
            <Banner tone={sendResult.success ? 'green' : 'red'} icon={sendResult.success ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}>
              {sendResult.message}
            </Banner>
          )}
    </Modal>
  );
};
