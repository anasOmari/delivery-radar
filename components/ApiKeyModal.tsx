'use client';

import React, { useState } from 'react';
import { Key, X, CheckCircle, ExternalLink, ShieldCheck, AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

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
    } catch (e: any) {
      setTestResult({ type: 'error', message: 'حدث خطأ في الاتصال بالخادم أثناء الاختبار.' });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container modal-md" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-left">
            <div className="modal-header-icon" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
              <Key size={18} />
            </div>
            <div>
              <h3 className="modal-title">{t('apikey.title')}</h3>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} title={t('action.close')}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Key Input */}
          <div className="modal-form-group">
            <label className="modal-label">
              <ShieldCheck size={14} className="text-primary" />
              <span>{t('apikey.label')}</span>
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type={showKey ? 'text' : 'password'}
                className="input-field"
                style={{ paddingLeft: '40px', direction: 'ltr', fontFamily: 'monospace' }}
                placeholder="AIzaSy..."
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                style={{
                  position: 'absolute',
                  left: '10px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-tertiary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
                title={showKey ? 'إخفاء' : 'إظهار'}
              >
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Test Result Alert */}
          {testResult && (
            <div className={`notification-banner banner-${testResult.type}`} style={{ padding: '10px 14px' }}>
              <div className="flex-align gap-2">
                {testResult.type === 'success' ? (
                  <CheckCircle size={16} className="text-success" />
                ) : (
                  <AlertCircle size={16} className="text-danger" />
                )}
                <span>{testResult.message}</span>
              </div>
            </div>
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
        </div>

        {/* Footer */}
        <div className="modal-footer flex-between">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleTestKey}
            disabled={isTesting || !apiKey.trim()}
          >
            {isTesting ? <Loader2 size={14} className="spin" /> : <ShieldCheck size={14} />}
            <span>{isTesting ? 'جارٍ التحقق...' : 'فحص وتجربة المفتاح'}</span>
          </button>

          <div className="flex-align gap-2">
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
              {t('action.cancel')}
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={handleSave}>
              <CheckCircle size={15} />
              <span>{t('action.save')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
