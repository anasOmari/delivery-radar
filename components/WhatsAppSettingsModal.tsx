'use client';

import React, { useState } from 'react';
import {
  MessageCircle,
  Check,
  AlertTriangle,
  ExternalLink,
  Shield,
  Zap,
  Sparkles,
  FileText,
  Sliders,
  Eye,
  Copy,
  CheckCircle2,
  Info,
  Clock,
  Send,
  EyeOff,
  Bot,
  Globe,
  Phone
} from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import {
  WhatsAppConfig,
  WhatsAppProvider,
  PROVIDER_INFO,
  DEFAULT_AUTO_MESSAGE_TEMPLATE,
  getWhatsAppConfig,
  saveWhatsAppConfig,
} from '@/lib/whatsappProviders';
import { saveWhatsAppConfigToSupabase, getWhatsAppConfigFromSupabase } from '@/lib/supabase';
import { ChatbotModal } from './ChatbotModal';

interface WhatsAppSettingsModalProps {
  onClose: () => void;
  onSaved?: (updatedConfig: WhatsAppConfig) => void;
}

export const WhatsAppSettingsModal: React.FC<WhatsAppSettingsModalProps> = ({ onClose, onSaved }) => {
  const { t, locale } = useLanguage();
  const [config, setConfig] = useState<WhatsAppConfig>(getWhatsAppConfig());
  const [activeTab, setActiveTab] = useState<'provider' | 'message' | 'automation' | 'chatbot'>('provider');
  const [isTesting, setIsTesting] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saveFeedback, setSaveFeedback] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [showSimulator, setShowSimulator] = useState(false);

  // Sync Supabase & server config on mount
  React.useEffect(() => {
    async function loadConfig() {
      try {
        const dbConfig = await getWhatsAppConfigFromSupabase();
        if (dbConfig && dbConfig.greenapi?.idInstance) {
          setConfig((prev) => ({
            ...prev,
            ...dbConfig,
            provider: dbConfig.provider || 'greenapi',
          }));
          saveWhatsAppConfig(dbConfig);
          return;
        }
      } catch {}

      try {
        const r = await fetch('/api/whatsapp/config');
        const data = await r.json();
        if (data?.config?.greenapi?.idInstance) {
          setConfig((prev) => ({
            ...prev,
            ...data.config,
            provider: data.config.provider || 'greenapi',
          }));
        }
      } catch {}
    }
    loadConfig();
  }, []);

  // Dynamic sample preview lead
  const sampleLead = {
    name: locale === 'ar' ? 'مطعم ورد الشام' : 'Rose of Damascus Bistro',
    city: locale === 'ar' ? 'عمان - الجبيهة' : 'Amman - Jubaiha',
    category: locale === 'ar' ? 'مطاعم ومأكولات' : 'Restaurants & Dining',
    rating: '4.9',
    phone: '+962788779463',
    website: 'https://example.com',
  };

  const webhookUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/whatsapp/webhook`
    : 'https://your-domain.com/api/whatsapp/webhook';

  const renderPreviewMessage = (template?: string) => {
    const raw = template || config.autoMessageTemplate || DEFAULT_AUTO_MESSAGE_TEMPLATE;
    return raw
      .replace(/{name}/g, sampleLead.name)
      .replace(/{city}/g, sampleLead.city)
      .replace(/{category}/g, sampleLead.category)
      .replace(/{rating}/g, sampleLead.rating)
      .replace(/{phone}/g, sampleLead.phone)
      .replace(/{website}/g, sampleLead.website);
  };

  const handleProviderChange = (provider: WhatsAppProvider) => {
    setConfig(prev => ({
      ...prev,
      provider,
      greenapi: prev.greenapi || { idInstance: '', apiTokenInstance: '', apiUrl: '' }
    }));
    setTestResult(null);
  };

  const handleInsertTag = (tag: string) => {
    setConfig(prev => {
      const current = prev.autoMessageTemplate || DEFAULT_AUTO_MESSAGE_TEMPLATE;
      return {
        ...prev,
        autoMessageTemplate: current + ` {${tag}} `
      };
    });
  };

  const handleResetTemplate = () => {
    setConfig(prev => ({
      ...prev,
      autoMessageTemplate: DEFAULT_AUTO_MESSAGE_TEMPLATE
    }));
  };

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  const handleSave = async () => {
    saveWhatsAppConfig(config);
    setSaveFeedback(true);
    try {
      await saveWhatsAppConfigToSupabase(config);
      await fetch('/api/whatsapp/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
    } catch (e) {
      console.warn('Config save error:', e);
    }
    if (onSaved) onSaved(config);
    setTimeout(() => {
      onClose();
    }, 400);
  };

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config, action: 'validate' }),
      });
      const data = await res.json();

      if (data.success) {
        setTestResult({
          success: true,
          message: locale === 'ar'
            ? '✅ تم التحقق والاتصال بـ Green-API بنجاح! الحساب جاهز للإرسال الآلي.'
            : '✅ Connected to Green-API successfully! Instance is authorized.',
        });
      } else {
        setTestResult({
          success: false,
          message: locale === 'ar'
            ? '❌ تعذر الاتصال بـ Green-API. يرجى التأكد من صحة idInstance و apiTokenInstance وحالة الحساب في Green-API.'
            : '❌ Connection failed. Please check idInstance, apiTokenInstance, and authorization in Green-API.',
        });
      }
    } catch {
      setTestResult({
        success: false,
        message: locale === 'ar' ? '❌ خطأ أثناء الاتصال بالخادم.' : '❌ Server communication error.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const providers: WhatsAppProvider[] = ['greenapi', 'whapi', 'wati', 'twilio', 'none'];

  const dynamicTags = [
    { tag: 'name', label: locale === 'ar' ? 'اسم المحل' : 'Business Name' },
    { tag: 'city', label: locale === 'ar' ? 'المدينة / المنطقة' : 'City / Area' },
    { tag: 'category', label: locale === 'ar' ? 'نوع النشاط' : 'Category' },
    { tag: 'rating', label: locale === 'ar' ? 'التقييم' : 'Rating' },
    { tag: 'phone', label: locale === 'ar' ? 'رقم الهاتف' : 'Phone' },
  ];

  if (showSimulator) {
    return <ChatbotModal onClose={() => setShowSimulator(false)} />;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-box modal-lg"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '800px', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}
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
              <MessageCircle size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
                {locale === 'ar' ? 'إعدادات الرسائل و Green-API والشات بوت' : 'Message Settings, Green-API & Chatbot'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
                {locale === 'ar'
                  ? 'تهيئة الإرسال التلقائي للرسائل والردود الذكية الفورية عبر الواتساب'
                  : 'Configure auto-messaging credentials, templates, and AI chatbot auto-replies'}
              </p>
            </div>
          </div>
          <button className="btn-close" onClick={onClose}>&times;</button>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border-default)',
            background: 'var(--bg-surface-elevated, #1a1a24)',
            padding: '0 20px',
            gap: '8px',
            overflowX: 'auto',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('provider')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '12px 14px',
              border: 'none',
              background: 'none',
              borderBottom: activeTab === 'provider' ? '3px solid #25D366' : '3px solid transparent',
              color: activeTab === 'provider' ? 'var(--text-primary)' : 'var(--text-tertiary)',
              fontWeight: activeTab === 'provider' ? 700 : 500,
              fontSize: '0.86rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
            }}
          >
            <Zap size={15} style={{ color: activeTab === 'provider' ? 'var(--whatsapp-color)' : 'inherit' }} />
            <span>{t('whatsapp.tab_connection')}</span>
            {config.provider === 'greenapi' && (
              <span
                style={{
                  fontSize: '0.68rem',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  background: 'rgba(37, 211, 102, 0.2)',
                  color: 'var(--whatsapp-color)',
                  fontWeight: 700,
                }}
              >
                Active
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('message')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '12px 14px',
              border: 'none',
              background: 'none',
              borderBottom: activeTab === 'message' ? '3px solid #25D366' : '3px solid transparent',
              color: activeTab === 'message' ? 'var(--text-primary)' : 'var(--text-tertiary)',
              fontWeight: activeTab === 'message' ? 700 : 500,
              fontSize: '0.86rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
            }}
          >
            <FileText size={15} style={{ color: activeTab === 'message' ? 'var(--whatsapp-color)' : 'inherit' }} />
            <span>{t('whatsapp.tab_message')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('chatbot')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '12px 14px',
              border: 'none',
              background: 'none',
              borderBottom: activeTab === 'chatbot' ? '3px solid #25D366' : '3px solid transparent',
              color: activeTab === 'chatbot' ? 'var(--text-primary)' : 'var(--text-tertiary)',
              fontWeight: activeTab === 'chatbot' ? 700 : 500,
              fontSize: '0.86rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
            }}
          >
            <Bot size={15} style={{ color: activeTab === 'chatbot' ? 'var(--whatsapp-color)' : 'inherit' }} />
            <span>{locale === 'ar' ? 'الشات بوت الذكي (AI Chatbot) 🤖' : 'Smart AI Chatbot 🤖'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('automation')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '12px 14px',
              border: 'none',
              background: 'none',
              borderBottom: activeTab === 'automation' ? '3px solid #25D366' : '3px solid transparent',
              color: activeTab === 'automation' ? 'var(--text-primary)' : 'var(--text-tertiary)',
              fontWeight: activeTab === 'automation' ? 700 : 500,
              fontSize: '0.86rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
            }}
          >
            <Sliders size={15} style={{ color: activeTab === 'automation' ? 'var(--whatsapp-color)' : 'inherit' }} />
            <span>{t('whatsapp.tab_options')}</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ overflowY: 'auto', padding: '20px', flex: 1 }}>
          
          {/* TAB 1: PROVIDER CONFIGURATION */}
          {activeTab === 'provider' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label className="input-label" style={{ marginBottom: '10px', display: 'block' }}>
                  <Zap size={15} />
                  <span>{locale === 'ar' ? 'اختر بوابة إرسال الواتساب' : 'Select WhatsApp Gateway'}</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                  {providers.map(p => {
                    const info = PROVIDER_INFO[p];
                    const isSelected = config.provider === p;
                    const isGreen = p === 'greenapi';

                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => handleProviderChange(p)}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-start',
                          gap: '6px',
                          padding: '12px 14px',
                          borderRadius: 'var(--radius-md)',
                          border: isSelected
                            ? isGreen ? '2px solid #25D366' : '2px solid var(--brand-primary)'
                            : '1px solid var(--border-default)',
                          background: isSelected
                            ? isGreen ? 'rgba(37, 211, 102, 0.08)' : 'var(--brand-primary-subtle)'
                            : 'var(--bg-surface-elevated)',
                          cursor: 'pointer',
                          textAlign: locale === 'ar' ? 'right' : 'left',
                          position: 'relative',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                          <div className="flex-align gap-2">
                            <div
                              style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: isSelected ? (isGreen ? 'var(--whatsapp-color)' : 'var(--brand-primary)') : 'var(--border-default)',
                              }}
                            />
                            <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                              {info.name}
                            </span>
                          </div>
                          {info.recommended && (
                            <span
                              style={{
                                fontSize: '0.65rem',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                background: 'rgba(37, 211, 102, 0.2)',
                                color: 'var(--whatsapp-color)',
                                fontWeight: 700,
                              }}
                            >
                              ⭐ {locale === 'ar' ? 'موصى به' : 'Recommended'}
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '0.74rem', color: 'var(--text-tertiary)', lineHeight: 1.35 }}>
                          {info.description}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Green-API Specific Configuration Box */}
              {config.provider === 'greenapi' && (
                <div
                  className="studio-card"
                  style={{
                    border: '1px solid rgba(37, 211, 102, 0.3)',
                    background: 'rgba(37, 211, 102, 0.03)',
                    padding: '18px',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <div className="flex-align gap-2">
                      <span style={{ fontSize: '1.2rem' }}>🟢</span>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {locale === 'ar' ? 'بيانات الربط مع حساب Green-API' : 'Green-API Instance Credentials'}
                        </h4>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {locale === 'ar'
                            ? 'أدخل بيانات الحساب المستخرجة من لوحة Green-API Console'
                            : 'Enter credentials from your Green-API Console'}
                        </span>
                      </div>
                    </div>
                    <a
                      href="https://console.green-api.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary btn-xs"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                    >
                      <ExternalLink size={12} />
                      <span>{locale === 'ar' ? 'لوحة تحكم Green-API' : 'Green-API Console'}</span>
                    </a>
                  </div>

                  <div className="grid-2-clean" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '12px' }}>
                    <div className="studio-field">
                      <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                        {locale === 'ar' ? 'معرف الحساب (idInstance)' : 'Instance ID (idInstance)'} *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 710722741021"
                        value={config.greenapi?.idInstance || ''}
                        onChange={e => setConfig(prev => ({
                          ...prev,
                          greenapi: {
                            ...prev.greenapi,
                            idInstance: e.target.value,
                            apiTokenInstance: prev.greenapi?.apiTokenInstance || '',
                            apiUrl: prev.greenapi?.apiUrl || '',
                          }
                        }))}
                        style={{ width: '100%', padding: '9px 12px', fontFamily: 'monospace' }}
                      />
                    </div>

                    <div className="studio-field">
                      <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                        {locale === 'ar' ? 'رمز الوصول (apiTokenInstance)' : 'API Token (apiTokenInstance)'} *
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showToken ? 'text' : 'password'}
                          placeholder="e.g. 9b12cf9a80..."
                          value={config.greenapi?.apiTokenInstance || ''}
                          onChange={e => setConfig(prev => ({
                            ...prev,
                            greenapi: {
                              ...prev.greenapi,
                              apiTokenInstance: e.target.value,
                              idInstance: prev.greenapi?.idInstance || '',
                              apiUrl: prev.greenapi?.apiUrl || '',
                            }
                          }))}
                          style={{ width: '100%', padding: '9px 36px 9px 12px', fontFamily: 'monospace' }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowToken(!showToken)}
                          style={{
                            position: 'absolute',
                            right: locale === 'ar' ? 'auto' : '8px',
                            left: locale === 'ar' ? '8px' : 'auto',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-tertiary)',
                            cursor: 'pointer',
                          }}
                        >
                          {showToken ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="studio-field" style={{ marginTop: '12px' }}>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                      {locale === 'ar' ? 'رابط السيرفر (apiUrl) - اختياري' : 'Server API URL (apiUrl) - Optional'}
                    </label>
                    <input
                      type="text"
                      placeholder="https://7107.api.greenapi.com (أو اتركه فارغاً)"
                      value={config.greenapi?.apiUrl || ''}
                      onChange={e => setConfig(prev => ({
                        ...prev,
                        greenapi: {
                          ...prev.greenapi,
                          apiUrl: e.target.value,
                          idInstance: prev.greenapi?.idInstance || '',
                          apiTokenInstance: prev.greenapi?.apiTokenInstance || '',
                        }
                      }))}
                      style={{ width: '100%', padding: '9px 12px', fontFamily: 'monospace' }}
                    />
                  </div>
                </div>
              )}

              {/* Test Result Message */}
              {testResult && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    background: testResult.success ? 'var(--status-green-bg, rgba(34, 197, 94, 0.1))' : 'var(--status-red-bg, rgba(239, 68, 68, 0.1))',
                    border: `1px solid ${testResult.success ? 'var(--status-green-border, #16a34a)' : 'var(--status-red-border, #dc2626)'}`,
                    color: testResult.success ? 'var(--status-green, #16a34a)' : 'var(--status-red, #dc2626)',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                  }}
                >
                  {testResult.success ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                  <span>{testResult.message}</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: AUTO MESSAGE TEMPLATE CUSTOMIZATION */}
          {activeTab === 'message' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {locale === 'ar' ? 'نص رسالة الإرسال التلقائي للعملاء' : 'Default Lead Auto-Message Template'}
                    </h4>
                    <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
                      {locale === 'ar'
                        ? 'هذا النص سيتم اعتماده وإرساله تلقائياً للعميل عند الضغط على زر "أرسل رسالة"'
                        : 'This message template will be automatically sent when clicking "Send Message"'}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-xs"
                    onClick={handleResetTemplate}
                    title={locale === 'ar' ? 'استعادة النص الافتراضي' : 'Reset default'}
                  >
                    {locale === 'ar' ? 'استعادة الافتراضي' : 'Reset Default'}
                  </button>
                </div>

                {/* Variable Tags Chips */}
                <div style={{ marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                    {locale === 'ar' ? 'انقر لإدراج متغير ذكي داخل الرسالة:' : 'Click to insert dynamic variable:'}
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {dynamicTags.map(item => (
                      <button
                        key={item.tag}
                        type="button"
                        onClick={() => handleInsertTag(item.tag)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 10px',
                          borderRadius: '16px',
                          background: 'var(--bg-surface-elevated, #242436)',
                          border: '1px solid var(--border-default)',
                          color: 'var(--text-primary)',
                          fontSize: '0.78rem',
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                      >
                        <Sparkles size={11} style={{ color: 'var(--whatsapp-color)' }} />
                        <span style={{ fontWeight: 600 }}>{`{${item.tag}}`}</span>
                        <span style={{ color: 'var(--text-tertiary)', fontSize: '0.72rem' }}>({item.label})</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Textarea */}
                <textarea
                  className="textarea-field"
                  rows={8}
                  value={config.autoMessageTemplate || DEFAULT_AUTO_MESSAGE_TEMPLATE}
                  onChange={e => setConfig(prev => ({ ...prev, autoMessageTemplate: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-default)',
                    background: 'var(--bg-surface)',
                    color: 'var(--text-primary)',
                    fontSize: '0.88rem',
                    lineHeight: 1.6,
                  }}
                />
              </div>

              {/* Live Preview Card */}
              <div
                style={{
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <Eye size={14} style={{ color: 'var(--whatsapp-color)' }} />
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {locale === 'ar' ? 'معاينة الرسالة الحية كما ستصل للعميل:' : 'Live Message Preview:'}
                  </span>
                </div>
                <div
                  style={{
                    background: 'rgba(37, 211, 102, 0.06)',
                    border: '1px dashed rgba(37, 211, 102, 0.3)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '12px 14px',
                    fontSize: '0.84rem',
                    whiteSpace: 'pre-wrap',
                    color: 'var(--text-primary)',
                    lineHeight: 1.6,
                  }}
                >
                  {renderPreviewMessage(config.autoMessageTemplate)}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SMART CHATBOT CONFIGURATION */}
          {activeTab === 'chatbot' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Simulator Action Banner */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 18px',
                  borderRadius: 'var(--radius-md)',
                  background: 'linear-gradient(135deg, rgba(37, 211, 102, 0.12), rgba(18, 140, 126, 0.08))',
                  border: '1px solid rgba(37, 211, 102, 0.3)',
                }}
              >
                <div className="flex-align gap-2">
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: 'var(--whatsapp-button)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Bot size={20} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {locale === 'ar' ? 'تجربة محاكي الشات بوت الذكي مباشرة' : 'Live Chatbot Simulator'}
                    </h4>
                    <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                      {locale === 'ar' ? 'تحدث مع البوت لتجربة ردوده على طلبات الكباتن والأسعار' : 'Test how the bot replies to customer questions'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-whatsapp btn-sm"
                  onClick={() => setShowSimulator(true)}
                  style={{ background: 'var(--whatsapp-button)', color: '#fff', fontWeight: 700, gap: '6px' }}
                >
                  <Bot size={15} />
                  <span>{locale === 'ar' ? 'فتح المحاكي الحي' : 'Open Simulator'}</span>
                </button>
              </div>

              {/* Chatbot Toggle & Settings */}
              <div className="studio-card">
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingBottom: '12px',
                    borderBottom: '1px solid var(--border-default)',
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '0.88rem', display: 'block', color: 'var(--text-primary)' }}>
                      {locale === 'ar' ? 'تفعيل الرد التلقائي للشات بوت (Auto-Reply)' : 'Enable Chatbot Auto-Reply'}
                    </strong>
                    <span style={{ fontSize: '0.76rem', color: 'var(--text-tertiary)' }}>
                      {locale === 'ar'
                        ? 'يقوم بالرد الفوري والذكي على أي عميل يتواصل معكم على رقم الواتساب 24/7'
                        : 'Automatically replies to incoming customer WhatsApp messages 24/7'}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.chatbotEnabled !== false}
                    onChange={e => setConfig(prev => ({ ...prev, chatbotEnabled: e.target.checked }))}
                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                  />
                </div>

                <div className="studio-field" style={{ marginTop: '14px' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    {locale === 'ar' ? 'رقم هاتف الإدارة / التحويل المباشر' : 'Management Phone for Escalations'}
                  </label>
                  <input
                    type="text"
                    placeholder="0788779463"
                    value={config.managerPhone || '0788779463'}
                    onChange={e => setConfig(prev => ({ ...prev, managerPhone: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', fontFamily: 'monospace' }}
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: '2px', display: 'block' }}>
                    {locale === 'ar'
                      ? 'الرقم الذي سيقوم البوت بإعطائه للعميل عندما يطلب التحدث مع مسؤول أو عقد شراكة'
                      : 'Phone number provided when customer asks to speak with human manager'}
                  </span>
                </div>

                <div className="studio-field" style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid var(--border-default)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <label style={{ fontSize: '0.82rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', color: '#10B981' }}>
                      <Sparkles size={15} />
                      <span>{locale === 'ar' ? 'مفتاح الذكاء الاصطناعي (Google Gemini AI Key)' : 'Google Gemini AI Key (Optional)'}</span>
                    </label>
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '0.72rem', color: '#3B82F6', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}
                    >
                      <span>{locale === 'ar' ? 'احصل على مفتاح مجاني' : 'Get Free Key'}</span>
                      <ExternalLink size={11} />
                    </a>
                  </div>
                  <input
                    type="password"
                    placeholder="AIzaSy..."
                    value={config.aiApiKey || ''}
                    onChange={e => setConfig(prev => ({ ...prev, aiApiKey: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', fontFamily: 'monospace', borderRadius: 'var(--radius-sm)' }}
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '3px', display: 'block' }}>
                    {locale === 'ar'
                      ? '💡 عند إدخال المفتاح، يتحول الشات بوت تلقائياً إلى ذكاء اصطناعي تفاعلي كامل يفهم أي سؤال بلهجة أردنية طبيعية وسياق دقيق!'
                      : 'When provided, powers the chatbot with Google Gemini for full conversational intelligence in natural Arabic.'}
                  </span>
                </div>
              </div>

              {/* AI Knowledge Base & Custom Training Card */}
              <div className="studio-card" style={{ marginTop: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <Sparkles size={18} style={{ color: '#F59E0B' }} />
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {locale === 'ar' ? '🧠 تدريب وتعريف الذكاء الاصطناعي (AI Knowledge Base)' : 'AI Knowledge Base & Prompt Training'}
                    </h4>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-tertiary)' }}>
                      {locale === 'ar'
                        ? 'تخصيص معلومات المشروع، الخدمات، والأسعار التي يجيب بها الذكاء الاصطناعي مباشرة من الموقع'
                        : 'Control project identity, services, and pricing taught to the AI'}
                    </span>
                  </div>
                </div>

                {/* Business Identity */}
                <div className="studio-field" style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    {locale === 'ar' ? 'اسم وهوية المشروع الرسمية' : 'Business Identity'}
                  </label>
                  <input
                    type="text"
                    placeholder="خدمات قطرة الندى للتوصيل والنقل السريع"
                    value={config.businessName || ''}
                    onChange={e => setConfig(prev => ({ ...prev, businessName: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px' }}
                  />
                </div>

                {/* Services Knowledge */}
                <div className="studio-field" style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    {locale === 'ar' ? 'الخدمات المتاحة وتفاصيلها (يقرأها الذكاء الاصطناعي ويجيب بها)' : 'Available Services & Offerings'}
                  </label>
                  <textarea
                    rows={3}
                    placeholder="1. توصيل وجبات وأطعمة للمطاعم ساخنة وسريعة.&#10;2. شحن وتوصيل فوري لطرود المتاجر والأونلاين.&#10;3. عقود نقل وتوصيل موظفين وكوادر شركات.&#10;4. مشاوير ركاب خاصة VIP."
                    value={config.servicesText || ''}
                    onChange={e => setConfig(prev => ({ ...prev, servicesText: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', fontSize: '0.82rem', lineHeight: '1.4' }}
                  />
                </div>

                {/* Pricing Knowledge */}
                <div className="studio-field" style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    {locale === 'ar' ? 'تعديلات الأسعار والعروض الخاصة' : 'Pricing Details & Special Offers'}
                  </label>
                  <textarea
                    rows={2}
                    placeholder="توصيل داخلي: 2 د.أ | عمّان: 3 د.أ | المحافظات (إربد، العقبة، الزرقاء): 5 د.أ | خصم خاص للمطاعم بأكثر من 20 طلب يومياً."
                    value={config.pricingText || ''}
                    onChange={e => setConfig(prev => ({ ...prev, pricingText: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', fontSize: '0.82rem' }}
                  />
                </div>

                {/* Custom Instructions / Tone */}
                <div className="studio-field">
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    {locale === 'ar' ? 'توجيهات مخصصة لأسلوب رد الذكاء الاصطناعي (Custom System Prompt)' : 'Custom System Prompt & Persona'}
                  </label>
                  <textarea
                    rows={3}
                    placeholder="تحدث بلهجة أردنية ودودة ومحترمة. ركز دائماً على ميزة الدفع كاش مسبقاً لصاحب المحل، وإذا طلب العميل كابتن اطلب منه موقعه ورقم المستلم فوراً..."
                    value={config.customRules || config.customSystemPrompt || ''}
                    onChange={e => setConfig(prev => ({ ...prev, customRules: e.target.value, customSystemPrompt: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', fontSize: '0.82rem' }}
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '3px', display: 'block' }}>
                    {locale === 'ar'
                      ? '💡 يمكنك كتابة أي معلومات أو عروض جديدة هنا وسيبدأ الذكاء الاصطناعي باستخدامها فوراً في كل ردوده على الواتساب!'
                      : 'Any rules or knowledge added here are immediately injected into the AI for live customer replies.'}
                  </span>
                </div>
              </div>

              {/* Green-API Webhook Instructions Box */}
              <div
                style={{
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                  <Globe size={16} style={{ color: 'var(--whatsapp-color)' }} />
                  <strong style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                    {locale === 'ar' ? 'رابط الـ Webhook للربط مع Green-API:' : 'Webhook URL for Green-API:'}
                  </strong>
                </div>

                <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
                  <input
                    type="text"
                    readOnly
                    value={webhookUrl}
                    style={{
                      flex: 1,
                      padding: '9px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-default)',
                      background: 'var(--bg-surface)',
                      color: 'var(--text-primary)',
                      fontFamily: 'monospace',
                      fontSize: '0.84rem',
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleCopyWebhook}
                    style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    {copiedWebhook ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                    <span>{copiedWebhook ? (locale === 'ar' ? 'تم النسخ!' : 'Copied!') : (locale === 'ar' ? 'نسخ الرابط' : 'Copy')}</span>
                  </button>
                </div>

                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.78rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.5,
                  }}
                >
                  <strong>{locale === 'ar' ? 'كيف تفعل الـ Webhook في Green-API؟' : 'How to activate in Green-API:'}</strong>
                  <ol style={{ margin: '6px 0 0', paddingInlineStart: '18px' }}>
                    <li>{locale === 'ar' ? 'ادخل إلى لوحة تحكم Green-API وافتح حسابك (Instance).' : 'Open your Green-API Console instance.'}</li>
                    <li>{locale === 'ar' ? 'انزل لقسم Webhook Settings وضع الرابط أعلاه في خانة Webhook URL.' : 'Go to Webhooks and paste the URL above.'}</li>
                    <li>{locale === 'ar' ? 'تأكد من تفعيل خيار incomingMessageReceived ليتم إرسال ردود العملاء فوراً إلى نظامنا.' : 'Enable incomingMessageReceived toggle.'}</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: AUTOMATION & PREFERENCES */}
          {activeTab === 'automation' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="studio-card">
                <h4 style={{ margin: '0 0 10px', fontSize: '0.92rem', fontWeight: 700 }}>
                  {locale === 'ar' ? 'خيارات وسرعة الإرسال التلقائي' : 'Automation & Dispatch Rules'}
                </h4>

                {/* Direct 1-Click Send */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 0',
                    borderBottom: '1px solid var(--border-default)',
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '0.86rem', display: 'block', color: 'var(--text-primary)' }}>
                      {locale === 'ar' ? 'إرسال مباشر بنقرة واحدة (1-Click Send)' : '1-Click Direct Send'}
                    </strong>
                    <span style={{ fontSize: '0.76rem', color: 'var(--text-tertiary)' }}>
                      {locale === 'ar'
                        ? 'إرسال الرسالة فوراً عبر Green-API عند الضغط على زر الواتساب في الجدول دون فتح نافذة المعاينة'
                        : 'Instantly send via Green-API on button click without opening popup modal'}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={Boolean(config.autoSendDirectly)}
                    onChange={e => setConfig(prev => ({ ...prev, autoSendDirectly: e.target.checked }))}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                </div>

                {/* Delay between messages */}
                <div style={{ padding: '12px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <strong style={{ fontSize: '0.86rem', color: 'var(--text-primary)' }}>
                      {locale === 'ar' ? 'الفارق الزمني بين الرسائل في الحملات' : 'Delay Between Messages'}
                    </strong>
                    <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--whatsapp-color)' }}>
                      {config.sendDelaySeconds || 2} {locale === 'ar' ? 'ثواني' : 'seconds'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={config.sendDelaySeconds || 2}
                    onChange={e => setConfig(prev => ({ ...prev, sendDelaySeconds: Number(e.target.value) }))}
                    style={{ width: '100%', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', display: 'block', marginTop: '4px' }}>
                    {locale === 'ar'
                      ? 'يوصى بفاصل 2-3 ثوان لتفادي الحظر وحماية رقم الواتساب'
                      : '2-3 seconds recommended for safe delivery'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer flex-between" style={{ padding: '14px 20px', borderTop: '1px solid var(--border-default)' }}>
          <div>
            {config.provider !== 'none' && activeTab === 'provider' && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleTest}
                disabled={isTesting}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                {isTesting ? (
                  <span className="spin" style={{ display: 'inline-block' }}>&#8635;</span>
                ) : (
                  <Check size={15} style={{ color: 'var(--whatsapp-color)' }} />
                )}
                <span>{isTesting ? t('apikey.testing') : (locale === 'ar' ? 'اختبار الربط مع Green-API' : 'Test Connection')}</span>
              </button>
            )}
          </div>

          <div className="flex-align gap-2">
            <button className="btn btn-secondary" onClick={onClose}>
              {t('action.cancel')}
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSave}
              style={{
                background: 'var(--whatsapp-button)',
                color: '#fff',
                borderColor: 'var(--whatsapp-button)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: 700,
              }}
            >
              <Check size={16} />
              <span>{saveFeedback ? (locale === 'ar' ? 'تم الحفظ!' : 'Saved!') : t('action.save')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
