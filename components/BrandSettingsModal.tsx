'use client';

import React, { useState } from 'react';
import { BadgeCheck, X } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { useBranding, DEFAULT_APP_NAME } from '@/lib/BrandingContext';

interface BrandSettingsModalProps {
  onClose: () => void;
  onSaved?: () => void;
}

export const BrandSettingsModal: React.FC<BrandSettingsModalProps> = ({ onClose, onSaved }) => {
  const { locale } = useLanguage();
  const ar = locale === 'ar';
  const { appName, tagline, saveBranding } = useBranding();

  const [name, setName] = useState(appName);
  const [sub, setSub] = useState(tagline);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSave = async () => {
    if (!name.trim()) {
      setNotice({ type: 'error', message: ar ? 'اسم النظام مطلوب' : 'System name is required' });
      return;
    }
    setSaving(true);
    setNotice(null);
    const shared = await saveBranding({ appName: name, tagline: sub });
    setSaving(false);
    setNotice({
      type: 'success',
      message: shared
        ? ar ? 'تم حفظ اسم النظام ومشاركته على جميع الأجهزة.' : 'System name saved and shared across devices.'
        : ar ? 'تم الحفظ على هذا الجهاز فقط (تعذّر المزامنة مع السيرفر).' : 'Saved on this device only (server sync failed).',
    });
    onSaved?.();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box modal-sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <span className="modal-header-icon">
              <BadgeCheck size={19} />
            </span>
            <div>
              <h3>{ar ? 'اسم النظام' : 'System Name'}</h3>
              <p className="subtext">{ar ? 'يظهر في الترويسة وشاشات الدخول' : 'Shown in the header and auth screens'}</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="close">
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          {notice && (
            <div className={`notification-banner banner-${notice.type}`} style={{ marginBottom: 0 }}>
              <span>{notice.message}</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="brand-name">
              {ar ? 'اسم النظام' : 'System name'}
            </label>
            <input
              id="brand-name"
              className="input-field"
              type="text"
              maxLength={80}
              placeholder={DEFAULT_APP_NAME}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="brand-tagline">
              {ar ? 'السطر التعريفي (اختياري)' : 'Tagline (optional)'}
            </label>
            <input
              id="brand-tagline"
              className="input-field"
              type="text"
              maxLength={160}
              value={sub}
              onChange={(e) => setSub(e.target.value)}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} type="button">
            {ar ? 'إلغاء' : 'Cancel'}
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving} type="button">
            {saving ? (ar ? 'جاري الحفظ...' : 'Saving...') : ar ? 'حفظ' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};
