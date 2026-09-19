'use client';

import React, { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/lib/LanguageContext';

function CallbackInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { locale } = useLanguage();
  const ar = locale === 'ar';
  const [exchangeError, setExchangeError] = useState<string | null>(null);
  const ran = useRef(false);

  const providerError = params.get('error_description') || params.get('error');
  const code = params.get('code');

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    if (providerError || !code) return;
    (async () => {
      const { error: err } = await supabase.auth.exchangeCodeForSession(code);
      if (err) {
        setExchangeError(err.message);
      } else {
        router.replace('/');
      }
    })();
  }, [providerError, code, router]);

  const error =
    providerError ?? (!code ? (ar ? 'لم يتم استلام رمز الدخول من Google.' : 'No login code received from Google.') : exchangeError);

  return (
    <main className="auth-page" dir={ar ? 'rtl' : 'ltr'}>
      <div className="auth-card" style={{ alignItems: 'center', textAlign: 'center' }}>
        {error ? (
          <>
            <AlertTriangle size={28} color="var(--status-amber)" />
            <h1 className="auth-title">{ar ? 'تعذّر إكمال الدخول' : 'Could not complete sign-in'}</h1>
            <p className="auth-subtitle">{error}</p>
            <Link href="/login" className="btn btn-primary">
              {ar ? 'العودة لتسجيل الدخول' : 'Back to login'}
            </Link>
          </>
        ) : (
          <>
            <Loader2 size={28} className="spin" color="var(--brand-primary)" />
            <h1 className="auth-title">{ar ? 'جاري إتمام الدخول...' : 'Completing sign-in...'}</h1>
            <p className="auth-subtitle">{ar ? 'لحظات ويتم تحويلك للوحة التحكم' : 'You will be redirected to the dashboard shortly'}</p>
          </>
        )}
      </div>
    </main>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense>
      <CallbackInner />
    </Suspense>
  );
}
