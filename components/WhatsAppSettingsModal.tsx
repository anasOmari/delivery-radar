'use client';

import React, { useState } from 'react';
import {
  MessageCircle,
  Check,
  AlertTriangle,
  ExternalLink,
  Zap,
  Sparkles,
  FileText,
  Sliders,
  Eye,
  Copy,
  CheckCircle2,
  EyeOff,
  Bot,
  Globe
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
import {
  DEFAULT_BOT_IDENTITY,
  DEFAULT_BOT_SERVICES,
  DEFAULT_BOT_PRICING,
  DEFAULT_BOT_RULES,
  applyBrainDefaults,
} from '@/lib/chatbotConfig';
import { saveWhatsAppConfigToSupabase, getWhatsAppConfigFromSupabase } from '@/lib/supabase';
import { BOT_CONFIG_EVENT, notifyBotConfigChanged } from '@/components/BotToggle';
import { ChatbotModal } from './ChatbotModal';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Field, TextInput, TextArea } from './ui/Field';
import { Banner, StatusPill } from './ui/StatusPill';

interface WhatsAppSettingsModalProps {
  onClose: () => void;
  onSaved?: (updatedConfig: WhatsAppConfig) => void;
}

const SettingsTab: React.FC<{
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: React.ReactNode;
  badge?: React.ReactNode;
}> = ({ active, onClick, icon, label, badge }) => (
  <button
    type="button"
    onClick={onClick}
    className={`whatsapp-tab-btn${active ? ' active' : ''}`}
  >
    {icon}
    <span>{label}</span>
    {badge}
  </button>
);

export const WhatsAppSettingsModal: React.FC<WhatsAppSettingsModalProps> = ({ onClose, onSaved }) => {
  const { t, locale } = useLanguage();
  const [config, setConfig] = useState<WhatsAppConfig>(() => applyBrainDefaults(getWhatsAppConfig()));
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
          setConfig((prev) => (applyBrainDefaults({
            ...prev,
            ...dbConfig,
            provider: dbConfig.provider || 'greenapi',
          }) as WhatsAppConfig));
          saveWhatsAppConfig(dbConfig);
          return;
        }
      } catch {}

      try {
        const r = await fetch('/api/whatsapp/config');
        const data = await r.json();
        if (data?.config?.greenapi?.idInstance) {
          setConfig((prev) => (applyBrainDefaults({
            ...prev,
            ...data.config,
            provider: data.config.provider || 'greenapi',
          }) as WhatsAppConfig));
        }
      } catch {}
    }
    loadConfig();
  }, []);

  // Stay in sync with the header kill-switch (and any other config writer).
  React.useEffect(() => {
    const refresh = () => setConfig(applyBrainDefaults(getWhatsAppConfig()));
    window.addEventListener(BOT_CONFIG_EVENT, refresh);
    return () => window.removeEventListener(BOT_CONFIG_EVENT, refresh);
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
    try {
      const saved = await saveWhatsAppConfigToSupabase(config);
      if (!saved) throw new Error('Could not save to database');
      const response = await fetch('/api/whatsapp/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (!response.ok) throw new Error('Could not save server settings');
      saveWhatsAppConfig(config);
      notifyBotConfigChanged();
      setSaveFeedback(true);
    } catch (e) {
      console.warn('Config save error:', e);
      setTestResult({ success: false, message: locale === 'ar' ? 'تعذر حفظ إعدادات البوت. حاول مرة أخرى.' : 'Could not save bot settings. Try again.' });
      return;
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
    return <ChatbotModal onClose={() => setShowSimulator(false)} configOverride={config} />;
  }

  return (
    <Modal
      onClose={onClose}
      size="xl"
      icon={<MessageCircle size={20} />}
      iconTone="whatsapp"
      title={locale === 'ar' ? 'إعدادات الرسائل و Green-API والشات بوت' : 'Message Settings, Green-API & Chatbot'}
      subtitle={locale === 'ar'
        ? 'تهيئة الإرسال التلقائي للرسائل والردود الذكية الفورية عبر الواتساب'
        : 'Configure auto-messaging credentials, templates, and AI chatbot auto-replies'}
      footer={
        <div className="flex-between ui-flex-fill">
          <div>
            {config.provider !== 'none' && activeTab === 'provider' && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleTest}
                disabled={isTesting}
                loading={isTesting}
                icon={!isTesting ? <Check size={15} /> : undefined}
              >
                {isTesting ? t('apikey.testing') : (locale === 'ar' ? 'اختبار الربط مع Green-API' : 'Test Connection')}
              </Button>
            )}
          </div>

          <div className="flex-align gap-2">
            <Button variant="secondary" onClick={onClose}>
              {t('action.cancel')}
            </Button>
            <Button
              variant="whatsapp"
              onClick={handleSave}
              icon={<Check size={16} />}
            >
              {saveFeedback ? (locale === 'ar' ? 'تم الحفظ!' : 'Saved!') : t('action.save')}
            </Button>
          </div>
        </div>
      }
    >
      {/* Tab Navigation */}
      <div className="whatsapp-tab-group">
        <SettingsTab
          active={activeTab === 'provider'}
          onClick={() => setActiveTab('provider')}
          icon={<Zap size={15} />}
          label={t('whatsapp.tab_connection')}
          badge={config.provider === 'greenapi' ? (
            <StatusPill tone="whatsapp">Active</StatusPill>
          ) : undefined}
        />

        <SettingsTab
          active={activeTab === 'message'}
          onClick={() => setActiveTab('message')}
          icon={<FileText size={15} />}
          label={t('whatsapp.tab_message')}
        />

        <SettingsTab
          active={activeTab === 'chatbot'}
          onClick={() => setActiveTab('chatbot')}
          icon={<Bot size={15} />}
          label={locale === 'ar' ? 'الشات بوت الذكي 🤖' : 'Smart AI Chatbot 🤖'}
        />

        <SettingsTab
          active={activeTab === 'automation'}
          onClick={() => setActiveTab('automation')}
          icon={<Sliders size={15} />}
          label={t('whatsapp.tab_options')}
        />
      </div>

      {/* TAB 1: PROVIDER CONFIGURATION */}
      {activeTab === 'provider' && (
        <div className="ui-stack">
          <div>
            <label className="input-label ui-mb-2">
              <Zap size={15} />
              <span>{locale === 'ar' ? 'اختر بوابة إرسال الواتساب' : 'Select WhatsApp Gateway'}</span>
            </label>
            <div className="ui-grid-2col">
              {providers.map(p => {
                const info = PROVIDER_INFO[p];
                const isSelected = config.provider === p;

                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handleProviderChange(p)}
                    className={`target-option${isSelected ? ' active' : ''}`}
                  >
                    {isSelected && <CheckCircle2 size={16} />}
                    <div className="ui-flex-fill">
                      <div className="flex-align gap-2">
                        <strong>{info.name}</strong>
                        {info.recommended && (
                          <StatusPill tone="whatsapp">⭐ {locale === 'ar' ? 'موصى به' : 'Recommended'}</StatusPill>
                        )}
                      </div>
                      <span className="subtext">{info.description}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Green-API Specific Configuration Box */}
          {config.provider === 'greenapi' && (
            <div className="studio-card">
              <div className="flex-between">
                <div className="flex-align gap-2">
                  <span>🟢</span>
                  <div>
                    <h4 className="create-card-title">
                      {locale === 'ar' ? 'بيانات الربط مع حساب Green-API' : 'Green-API Instance Credentials'}
                    </h4>
                    <span className="subtext">
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
                >
                  <ExternalLink size={12} />
                  <span>{locale === 'ar' ? 'لوحة تحكم Green-API' : 'Green-API Console'}</span>
                </a>
              </div>

              <div className="ui-grid-2col">
                <Field
                  label={locale === 'ar' ? 'معرف الحساب (idInstance)' : 'Instance ID (idInstance)'}
                  htmlFor="wa-id-instance"
                >
                  <TextInput
                    id="wa-id-instance"
                    type="text"
                    className="ui-input-phone"
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
                  />
                </Field>

                <Field
                  label={locale === 'ar' ? 'رمز الوصول (apiTokenInstance)' : 'API Token (apiTokenInstance)'}
                  htmlFor="wa-api-token"
                >
                  <div className="flex-align gap-2">
                    <TextInput
                      id="wa-api-token"
                      type={showToken ? 'text' : 'password'}
                      className="ui-input-phone ui-flex-fill"
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
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowToken(!showToken)}
                    >
                      {showToken ? <EyeOff size={15} /> : <Eye size={15} />}
                    </Button>
                  </div>
                </Field>
              </div>

              <Field
                label={locale === 'ar' ? 'رابط السيرفر (apiUrl) - اختياري' : 'Server API URL (apiUrl) - Optional'}
                htmlFor="wa-api-url"
              >
                <TextInput
                  id="wa-api-url"
                  type="text"
                  className="ui-input-phone"
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
                />
              </Field>
            </div>
          )}

          {/* Test Result Message */}
          {testResult && (
            <Banner
              tone={testResult.success ? 'green' : 'red'}
              icon={testResult.success ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
            >
              {testResult.message}
            </Banner>
          )}
        </div>
      )}

      {/* TAB 2: AUTO MESSAGE TEMPLATE CUSTOMIZATION */}
      {activeTab === 'message' && (
        <div className="ui-stack">
          <div>
            <div className="flex-between ui-mb-2">
              <div>
                <h4 className="create-card-title">
                  {locale === 'ar' ? 'نص رسالة الإرسال التلقائي للعملاء' : 'Default Lead Auto-Message Template'}
                </h4>
                <p className="subtext">
                  {locale === 'ar'
                    ? 'هذا النص سيتم اعتماده وإرساله تلقائياً للعميل عند الضغط على زر "أرسل رسالة"'
                    : 'This message template will be automatically sent when clicking "Send Message"'}
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="xs"
                onClick={handleResetTemplate}
                title={locale === 'ar' ? 'استعادة النص الافتراضي' : 'Reset default'}
              >
                {locale === 'ar' ? 'استعادة الافتراضي' : 'Reset Default'}
              </Button>
            </div>

            {/* Variable Tags Chips */}
            <div className="ui-mb-2">
              <span className="subtext">
                {locale === 'ar' ? 'انقر لإدراج متغير ذكي داخل الرسالة:' : 'Click to insert dynamic variable:'}
              </span>
              <div className="template-chips">
                {dynamicTags.map(item => (
                  <button
                    key={item.tag}
                    type="button"
                    onClick={() => handleInsertTag(item.tag)}
                    className="preset-chip"
                  >
                    <Sparkles size={11} />
                    <span>{`{${item.tag}}`}</span>
                    <span className="subtext">({item.label})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Textarea */}
            <TextArea
              rows={8}
              value={config.autoMessageTemplate || DEFAULT_AUTO_MESSAGE_TEMPLATE}
              onChange={e => setConfig(prev => ({ ...prev, autoMessageTemplate: e.target.value }))}
            />
          </div>

          {/* Live Preview Card */}
          <div className="ui-card">
            <div className="flex-align gap-2 ui-mb-2">
              <Eye size={14} />
              <strong>
                {locale === 'ar' ? 'معاينة الرسالة الحية كما ستصل للعميل:' : 'Live Message Preview:'}
              </strong>
            </div>
            <div className="import-guide-box">
              {renderPreviewMessage(config.autoMessageTemplate)}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SMART CHATBOT CONFIGURATION */}
      {activeTab === 'chatbot' && (
        <div className="ui-stack">
          {/* Simulator Action Banner */}
          <div className="ui-card">
            <div className="flex-between">
              <div className="flex-align gap-2">
                <div className="list-icon-badge">
                  <Bot size={20} />
                </div>
                <div>
                  <h4 className="create-card-title">
                    {locale === 'ar' ? 'تجربة محاكي الشات بوت الذكي مباشرة' : 'Live Chatbot Simulator'}
                  </h4>
                  <span className="subtext">
                    {locale === 'ar' ? 'تحدث مع البوت لتجربة ردوده على طلبات الكباتن والأسعار' : 'Test how the bot replies to customer questions'}
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant="whatsapp"
                size="sm"
                icon={<Bot size={15} />}
                onClick={() => setShowSimulator(true)}
              >
                {locale === 'ar' ? 'فتح المحاكي الحي' : 'Open Simulator'}
              </Button>
            </div>
          </div>

          {/* Chatbot Toggle & Settings */}
          <div className="studio-card">
            <div className="flex-between">
              <div>
                <strong>
                  {locale === 'ar' ? 'تفعيل الرد التلقائي للشات بوت (Auto-Reply)' : 'Enable Chatbot Auto-Reply'}
                </strong>
                <span className="ui-field-hint">
                  {locale === 'ar'
                    ? 'يقوم بالرد الفوري والذكي على أي عميل يتواصل معكم على رقم الواتساب 24/7'
                    : 'Automatically replies to incoming customer WhatsApp messages 24/7'}
                </span>
              </div>
              <input
                type="checkbox"
                className="ui-checkbox"
                checked={config.chatbotEnabled !== false}
                onChange={e => setConfig(prev => ({ ...prev, chatbotEnabled: e.target.checked }))}
              />
            </div>

            <Field
              label={locale === 'ar' ? 'رقم هاتف الإدارة / التحويل المباشر' : 'Management Phone for Escalations'}
              hint={locale === 'ar'
                ? 'الرقم الذي سيقوم البوت بإعطائه للعميل عندما يطلب التحدث مع مسؤول أو عقد شراكة'
                : 'Phone number provided when customer asks to speak with human manager'}
              htmlFor="wa-manager-phone"
            >
              <TextInput
                id="wa-manager-phone"
                type="text"
                className="ui-input-phone"
                placeholder="0788779463"
                value={config.managerPhone || '0788779463'}
                onChange={e => setConfig(prev => ({ ...prev, managerPhone: e.target.value }))}
              />
            </Field>

            <Field
              label={locale === 'ar' ? 'مفتاح الذكاء الاصطناعي (Google Gemini AI Key)' : 'Google Gemini AI Key (Optional)'}
              hint={locale === 'ar'
                ? '💡 عند إدخال المفتاح، يتحول الشات بوت تلقائياً إلى ذكاء اصطناعي تفاعلي كامل يفهم أي سؤال بلهجة أردنية طبيعية وسياق دقيق!'
                : 'When provided, powers the chatbot with Google Gemini for full conversational intelligence in natural Arabic.'}
              htmlFor="wa-ai-key"
            >
              <TextInput
                id="wa-ai-key"
                type="password"
                className="ui-input-phone"
                placeholder="AIzaSy..."
                value={config.aiApiKey || ''}
                onChange={e => setConfig(prev => ({ ...prev, aiApiKey: e.target.value }))}
              />
            </Field>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="console-link flex-align gap-1"
            >
              <span>{locale === 'ar' ? 'احصل على مفتاح مجاني' : 'Get Free Key'}</span>
              <ExternalLink size={11} />
            </a>
          </div>

          {/* AI Knowledge Base & Custom Training Card */}
          <div className="studio-card">
            <div className="flex-align gap-2">
              <Sparkles size={18} />
              <div>
                <h4 className="create-card-title">
                  {locale === 'ar' ? '🧠 تدريب وتعريف الذكاء الاصطناعي (AI Knowledge Base)' : 'AI Knowledge Base & Prompt Training'}
                </h4>
                <span className="subtext">
                  {locale === 'ar'
                    ? 'تخصيص معلومات المشروع، الخدمات، والأسعار التي يجيب بها الذكاء الاصطناعي مباشرة من الموقع'
                    : 'Control project identity, services, and pricing taught to the AI'}
                </span>
              </div>
            </div>

            {/* Business Identity */}
            <Field
              label={locale === 'ar' ? 'اسم وهوية المشروع الرسمية' : 'Business Identity'}
              htmlFor="wa-business-identity"
            >
              <TextArea
                id="wa-business-identity"
                rows={4}
                placeholder="نظام استقبال طلبات رسمي لشركة قطرة الندى..."
                value={config.businessName || DEFAULT_BOT_IDENTITY}
                onChange={e => setConfig(prev => ({ ...prev, businessName: e.target.value }))}
              />
            </Field>

            {/* Services Knowledge */}
            <Field
              label={locale === 'ar' ? 'الخدمات المتاحة وتفاصيلها (يقرأها الذكاء الاصطناعي ويجيب بها)' : 'Available Services & Offerings'}
              htmlFor="wa-services"
            >
              <TextArea
                id="wa-services"
                rows={4}
                placeholder="1. توصيل وجبات وأطعمة للمطاعم ساخنة وسريعة.&#10;2. شحن وتوصيل فوري لطرود المتاجر والأونلاين.&#10;3. عقود نقل وتوصيل موظفين وكوادر شركات.&#10;4. مشاوير ركاب خاصة VIP."
                value={config.servicesText || DEFAULT_BOT_SERVICES}
                onChange={e => setConfig(prev => ({ ...prev, servicesText: e.target.value }))}
              />
            </Field>

            {/* Pricing Knowledge */}
            <Field
              label={locale === 'ar' ? 'تعديلات الأسعار والعروض الخاصة' : 'Pricing Details & Special Offers'}
              htmlFor="wa-pricing"
            >
              <TextArea
                id="wa-pricing"
                rows={4}
                placeholder="توصيل داخلي: 2 د.أ | عمّان: 3 د.أ | المحافظات (إربد، العقبة، الزرقاء): 5 د.أ | خصم خاص للمطاعم بأكثر من 20 طلب يومياً."
                value={config.pricingText || DEFAULT_BOT_PRICING}
                onChange={e => setConfig(prev => ({ ...prev, pricingText: e.target.value }))}
              />
            </Field>

            {/* Custom Instructions / Tone */}
            <Field
              label={locale === 'ar' ? 'توجيهات مخصصة لأسلوب رد الذكاء الاصطناعي (Custom System Prompt)' : 'Custom System Prompt & Persona'}
              hint={locale === 'ar'
                ? '💡 يمكنك كتابة أي معلومات أو عروض جديدة هنا وسيبدأ الذكاء الاصطناعي باستخدامها فوراً في كل ردوده على الواتساب!'
                : 'Any rules or knowledge added here are immediately injected into the AI for live customer replies.'}
              htmlFor="wa-custom-rules"
            >
              <TextArea
                id="wa-custom-rules"
                rows={5}
                placeholder="تحدث بلهجة أردنية ودودة ومحترمة. ركز دائماً على ميزة الدفع كاش مسبقاً لصاحب المحل، وإذا طلب العميل كابتن اطلب منه موقعه ورقم المستلم فوراً..."
                value={config.customRules || config.customSystemPrompt || DEFAULT_BOT_RULES}
                onChange={e => setConfig(prev => ({ ...prev, customRules: e.target.value, customSystemPrompt: e.target.value }))}
              />
            </Field>
          </div>

          {/* Green-API Webhook Instructions Box */}
          <div className="ui-card">
            <div className="flex-align gap-2 ui-mb-2">
              <Globe size={16} />
              <strong>
                {locale === 'ar' ? 'رابط الـ Webhook للربط مع Green-API:' : 'Webhook URL for Green-API:'}
              </strong>
            </div>

            <div className="flex-align gap-2 ui-mb-2">
              <TextInput
                type="text"
                readOnly
                className="ui-input-phone ui-flex-fill"
                value={webhookUrl}
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                icon={copiedWebhook ? <Check size={14} /> : <Copy size={14} />}
                onClick={handleCopyWebhook}
              >
                {copiedWebhook ? (locale === 'ar' ? 'تم النسخ!' : 'Copied!') : (locale === 'ar' ? 'نسخ الرابط' : 'Copy')}
              </Button>
            </div>

            <div className="import-guide-box">
              <strong>{locale === 'ar' ? 'كيف تفعل الـ Webhook في Green-API؟' : 'How to activate in Green-API:'}</strong>
              <ol>
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
        <div className="ui-stack">
          <div className="studio-card">
            <h4 className="create-card-title">
              {locale === 'ar' ? 'خيارات وسرعة الإرسال التلقائي' : 'Automation & Dispatch Rules'}
            </h4>

            {/* Direct 1-Click Send */}
            <div className="flex-between">
              <div>
                <strong>
                  {locale === 'ar' ? 'إرسال مباشر بنقرة واحدة (1-Click Send)' : '1-Click Direct Send'}
                </strong>
                <span className="ui-field-hint">
                  {locale === 'ar'
                    ? 'إرسال الرسالة فوراً عبر Green-API عند الضغط على زر الواتساب في الجدول دون فتح نافذة المعاينة'
                    : 'Instantly send via Green-API on button click without opening popup modal'}
                </span>
              </div>
              <input
                type="checkbox"
                className="ui-checkbox"
                checked={Boolean(config.autoSendDirectly)}
                onChange={e => setConfig(prev => ({ ...prev, autoSendDirectly: e.target.checked }))}
              />
            </div>

            {/* Delay between messages */}
            <div>
              <div className="flex-between ui-mb-2">
                <strong>
                  {locale === 'ar' ? 'الفارق الزمني بين الرسائل في الحملات' : 'Delay Between Messages'}
                </strong>
                <StatusPill tone="whatsapp">
                  {config.sendDelaySeconds || 2} {locale === 'ar' ? 'ثواني' : 'seconds'}
                </StatusPill>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={config.sendDelaySeconds || 2}
                onChange={e => setConfig(prev => ({ ...prev, sendDelaySeconds: Number(e.target.value) }))}
              />
              <span className="ui-field-hint">
                {locale === 'ar'
                  ? 'يوصى بفاصل 2-3 ثوان لتفادي الحظر وحماية رقم الواتساب'
                  : '2-3 seconds recommended for safe delivery'}
              </span>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};
