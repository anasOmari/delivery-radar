'use client';

import React, { useState } from 'react';
import { BadgeCheck } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { useBranding, DEFAULT_APP_NAME } from '@/lib/BrandingContext';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Field, TextInput } from './ui/Field';
import { Banner } from './ui/StatusPill';

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
    <Modal
      onClose={onClose}
      size="sm"
      icon={<BadgeCheck size={19} />}
      iconTone="brand"
      title={ar ? 'اسم النظام' : 'System Name'}
      subtitle={ar ? 'يظهر في الترويسة وشاشات الدخول' : 'Shown in the header and auth screens'}
      footer={
        <>
          <Button onClick={onClose} type="button" variant="secondary">
            {ar ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button onClick={handleSave} disabled={saving} loading={saving} type="button" variant="primary">
            {saving ? (ar ? 'جاري الحفظ...' : 'Saving...') : ar ? 'حفظ' : 'Save'}
          </Button>
        </>
      }
    >
      {notice && (
        <Banner tone={notice.type === 'success' ? 'green' : 'red'}>
          {notice.message}
        </Banner>
      )}

      <Field label={ar ? 'اسم النظام' : 'System name'} htmlFor="brand-name">
        <TextInput
          id="brand-name"
          type="text"
          maxLength={80}
          placeholder={DEFAULT_APP_NAME}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </Field>

      <Field label={ar ? 'السطر التعريفي (اختياري)' : 'Tagline (optional)'} htmlFor="brand-tagline">
        <TextInput
          id="brand-tagline"
          type="text"
          maxLength={160}
          value={sub}
          onChange={(e) => setSub(e.target.value)}
        />
      </Field>
    </Modal>
  );
};
