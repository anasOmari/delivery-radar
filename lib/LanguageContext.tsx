'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Locale, translations } from '@/lib/i18n';

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
  dir: 'ltr' | 'rtl';
}

function getInitialLocale(): Locale {
  if (typeof window === 'undefined') return 'ar';
  try {
    return (localStorage.getItem('app_locale') as Locale) || 'ar';
  } catch {
    return 'ar';
  }
}

function getInitialDir(locale: Locale): 'ltr' | 'rtl' {
  return locale === 'ar' ? 'rtl' : 'ltr';
}

const LanguageContext = createContext<LanguageContextType>({
  locale: 'ar',
  setLocale: () => {},
  t: (key: string) => key,
  dir: 'rtl',
});

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('lang', newLocale);
      document.documentElement.setAttribute('dir', newLocale === 'ar' ? 'rtl' : 'ltr');
    }
    try {
      localStorage.setItem('app_locale', newLocale);
    } catch {}
  }, []);

  const t = useCallback((key: string): string => {
    return translations[locale]?.[key] || translations.ar[key] || key;
  }, [locale]);

  const dir = getInitialDir(locale);

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
};
