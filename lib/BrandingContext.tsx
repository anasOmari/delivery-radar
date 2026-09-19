'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';

export const DEFAULT_APP_NAME = 'خدمات قطرة الندى للتوصيل';
export const DEFAULT_TAGLINE = 'منصة استخراج العملاء وإدارة المبيعات والتسويق';

interface Branding {
  appName: string;
  tagline: string;
}

interface BrandingContextType extends Branding {
  loading: boolean;
  saveBranding: (next: Branding) => Promise<boolean>;
}

const BrandingContext = createContext<BrandingContextType>({
  appName: DEFAULT_APP_NAME,
  tagline: DEFAULT_TAGLINE,
  loading: true,
  saveBranding: async () => false,
});

export const useBranding = () => useContext(BrandingContext);

const STORAGE_KEY = 'brand_settings';

function readLocal(): Branding | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Branding>;
    if (typeof parsed.appName === 'string' && parsed.appName.trim()) {
      return {
        appName: parsed.appName.trim().slice(0, 80),
        tagline: typeof parsed.tagline === 'string' ? parsed.tagline.slice(0, 160) : DEFAULT_TAGLINE,
      };
    }
  } catch {}
  return null;
}

export const BrandingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [branding, setBranding] = useState<Branding>(() => {
    if (typeof window === 'undefined') return { appName: DEFAULT_APP_NAME, tagline: DEFAULT_TAGLINE };
    return readLocal() ?? { appName: DEFAULT_APP_NAME, tagline: DEFAULT_TAGLINE };
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    // Refresh from Supabase shared settings (admin-controlled)
    (async () => {
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'branding')
          .single();
        if (!error && data?.value && typeof (data.value as Partial<Branding>).appName === 'string' && (data.value as Partial<Branding>).appName!.trim()) {
          const remote: Branding = {
            appName: (data.value as Partial<Branding>).appName!.trim().slice(0, 80),
            tagline: typeof (data.value as Partial<Branding>).tagline === 'string' ? (data.value as Branding).tagline.slice(0, 160) : DEFAULT_TAGLINE,
          };
          if (mounted) {
            setBranding(remote);
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(remote));
            } catch {}
          }
        }
      } catch {}
      finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const saveBranding = useCallback(async (next: Branding) => {
    const clean: Branding = {
      appName: next.appName.trim().slice(0, 80) || DEFAULT_APP_NAME,
      tagline: next.tagline.trim().slice(0, 160),
    };
    setBranding(clean);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
    } catch {}
    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert({ key: 'branding', value: clean, updated_at: new Date().toISOString() }, { onConflict: 'key' });
      return !error;
    } catch {
      return false;
    }
  }, []);

  const value = useMemo(
    () => ({ ...branding, loading, saveBranding }),
    [branding, loading, saveBranding]
  );

  return <BrandingContext.Provider value={value}>{children}</BrandingContext.Provider>;
};
