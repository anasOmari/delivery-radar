'use client';

import React, { useState } from 'react';
import { Key, CheckCircle, ExternalLink, ShieldCheck, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Field, TextInput } from './ui/Field';
import { Banner } from './ui/StatusPill';

interface ApiKeyModalProps {
  currentApiKey: string;
  onSave: (key: string) => void;
  onClose: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  currentApiKey,
  onSave,
  onClose
}) => {
  const { t } = useLanguage();
  const [apiKey, setApiKey] = useState(currentApiKey);
  const [showKey, setShowKey] = useState(false);
  const [testResult, setTestResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const handleSave = () => {
    onSave(apiKey.trim());
    onClose();
  };

  const handleTestKey = async () => {
    if (!apiKey.trim()) {
      setTestResult({ type: 'error', message: 'يرجى إدخال مفتاح API أولاً لتجربته.' });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await fetch(`/api/places?query=مطاعم&city=عمان`, {
        headers: {
          'x-google-api-key': apiKey.trim()
        }
      });
      const data = await res.json();

      if (data.mode === 'live_google_api' && data.success) {
        setTestResult({
          type: 'success',
          message: `🟢 الاتصال ناجح ومفتاح Google Places API يعمل بكفاءة! تم التحقق من الحساب بنجاح.`
        });
      } else {
        setTestResult({
          type: 'error',
          message: data.message || 'فشل الاتصال: تأكد من تفعيل Places API وربط الفوترة (Billing) في Google Cloud.'
        });
      }
    } catch {
      setTestResult({ type: 'error', message: 'حدث خطأ في الاتصال بالخادم أثناء الاختبار.' });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Modal
      onClose={onClose}
      size="md"
      icon={<Key size={18} />}
      iconTone="amber"
      title={t('apikey.title')}
      footer={
        <div className="flex-between ui-flex-fill">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            loading={isTesting}
            icon={!isTesting ? <ShieldCheck size={14} /> : undefined}
            onClick={handleTestKey}
            disabled={isTesting || !apiKey.trim()}
          >
            {isTesting ? 'جارٍ التحقق...' : 'فحص وتجربة المفتاح'}
          </Button>

          <div className="flex-align gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={onClose}>
              {t('action.cancel')}
            </Button>
            <Button type="button" variant="primary" size="sm" icon={<CheckCircle size={15} />} onClick={handleSave}>
              {t('action.save')}
            </Button>
          </div>
        </div>
      }
    >
      {/* Key Input */}
      <Field label={t('apikey.label')} icon={<ShieldCheck size={14} />} htmlFor="apikey-input">
        <div className="flex-align gap-2">
          <TextInput
            id="apikey-input"
            type={showKey ? 'text' : 'password'}
            className="ui-input-phone ui-flex-fill"
            placeholder="AIzaSy..."
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setShowKey(!showKey)}
            title={showKey ? 'إخفاء' : 'إظهار'}
          >
            {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
          </Button>
        </div>
      </Field>

      {/* Test Result Alert */}
      {testResult && (
        <Banner
          tone={testResult.type === 'success' ? 'green' : 'red'}
          icon={testResult.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
        >
          {testResult.message}
        </Banner>
      )}

      {/* Instructions Card */}
      <div className="api-instructions-card">
        <div className="instructions-header">
          <h4 className="instructions-title">خطوات استخراج وتفعيل المفتاح مجاناً:</h4>
          <a
            href="https://console.cloud.google.com/"
            target="_blank"
            rel="noreferrer"
            className="console-link flex-align gap-1"
          >
            <span>Google Cloud Console</span>
            <ExternalLink size={12} />
          </a>
        </div>
        <ol className="instructions-list">
          <li>سجّل الدخول إلى <strong>Google Cloud Console</strong> وأنشئ مشروعاً جديداً.</li>
          <li>انتقل إلى <strong>APIs & Services</strong> وفعّل <strong>Places API (New)</strong>.</li>
          <li>انتقل إلى <strong>Credentials</strong> واضغط <strong>Create Credentials ➡️ API Key</strong>.</li>
          <li>انسخ المفتاح والصقه هنا في الحقل أعلاه واضغط حفظ.</li>
        </ol>
        <p className="instructions-note">
          🔒 ملاحظة: المفتاح يحفظ محلياً في متصفحك فقط ولا يتم إرساله لأي خوادم خارجية حفاظاً على خصوصيتك.
        </p>
      </div>
    </Modal>
  );
};
