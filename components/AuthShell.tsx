'use client';

import React from 'react';
import Link from 'next/link';
import { Building2, Globe, MapPin, MessageCircle, CalendarCheck } from 'lucide-react';
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
  const { appName, tagline } = useBranding();
  const ar = locale === 'ar';
  const toggleLanguage = () => {
    const next: Locale = ar ? 'en' : 'ar';
    setLocale(next);
  };

  const features = [
    {
      icon: <MapPin size={18} />,
      title: ar ? 'استخراج العملاء' : 'Lead extraction',
      desc: ar ? 'بيانات المحلات وأرقام الهواتف من خرائط جوجل' : 'Business data & phone numbers from Google Maps',
    },
    {
      icon: <MessageCircle size={18} />,
      title: ar ? 'حملات واتساب' : 'WhatsApp campaigns',
      desc: ar ? 'رسائل جماعية وقوالب جاهزة للخدمات' : 'Bulk messages & ready-made service templates',
    },
    {
      icon: <CalendarCheck size={18} />,
      title: ar ? 'المتابعة والمبيعات' : 'Follow-ups & sales',
      desc: ar ? 'تذكيرات ومراحل إغلاق الصفقات' : 'Reminders & deal-closing pipeline',
    },
  ];

  return (
    <main className="auth-page" dir={ar ? 'rtl' : 'ltr'}>
      <div className="auth-card auth-split">
        <aside className="auth-visual" aria-hidden="true">
          <div className="auth-visual-brand">
            <span className="auth-visual-logo">
              <Building2 size={26} />
            </span>
            <div>
              <div className="auth-visual-name">{appName}</div>
              {tagline ? <div className="auth-visual-tag">{tagline}</div> : null}
            </div>
          </div>

          <ul className="auth-visual-features">
            {features.map((f) => (
              <li key={f.title}>
                <span className="auth-visual-chip">{f.icon}</span>
                <div>
                  <b>{f.title}</b>
                  <small>{f.desc}</small>
                </div>
              </li>
            ))}
          </ul>

          <div className="auth-visual-foot">
            {ar ? 'منصة واحدة للبحث والتواصل والإغلاق' : 'One platform to find, message & close'}
          </div>
        </aside>

        <section className="auth-form-side">
          <div className="auth-topbar">
            <Link href="/" className="auth-brand">
              <span className="brand-logo" style={{ width: 36, height: 36 }}>
                <Building2 size={18} />
              </span>
              <span className="auth-brand-text">{appName}</span>
            </Link>
            <button className="lang-toggle" onClick={toggleLanguage} type="button">
              <Globe size={15} />
              <span>{ar ? 'EN' : 'AR'}</span>
            </button>
          </div>

          <h1 className="auth-title">{title}</h1>
          <p className="auth-subtitle">{subtitle}</p>

          {children}

          {footer && <div className="auth-footer">{footer}</div>}
        </section>
      </div>
    </main>
  );
};
