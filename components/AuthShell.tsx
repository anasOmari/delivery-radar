'use client';

import React from 'react';
import Link from 'next/link';
import { Building2, Globe } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { useBranding } from '@/lib/BrandingContext';
import { Locale } from '@/lib/i18n';

export const AuthShell: React.FC<{
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}> = ({ title, subtitle, children, footer }) => {
  const { locale, setLocale } = useLanguage();
  const { appName } = useBranding();
  const toggleLanguage = () => {
    const next: Locale = locale === 'ar' ? 'en' : 'ar';
    setLocale(next);
  };

  return (
    <main className="auth-page" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <div className="auth-card">
        <div className="auth-topbar">
          <Link href="/" className="auth-brand">
            <span className="brand-logo" style={{ width: 38, height: 38 }}>
              <Building2 size={19} />
            </span>
            <span className="auth-brand-text">
              {appName}
            </span>
          </Link>
          <button className="lang-toggle" onClick={toggleLanguage} type="button">
            <Globe size={15} />
            <span>{locale === 'ar' ? 'EN' : 'AR'}</span>
          </button>
        </div>

        <h1 className="auth-title">{title}</h1>
        <p className="auth-subtitle">{subtitle}</p>

        {children}

        {footer && <div className="auth-footer">{footer}</div>}
      </div>
    </main>
  );
};
