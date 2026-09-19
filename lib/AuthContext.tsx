'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { normalizePhone, phoneToEmail } from '@/lib/phone';

export interface AuthUser {
  id: string;
  phone: string;
  name?: string | null;
  email?: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signUpWithPhone: (params: { phone: string; password: string; name?: string }) => Promise<{ error: string | null }>;
  signInWithPhone: (params: { phone: string; password: string }) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signUpWithPhone: async () => ({ error: 'not-initialized' }),
  signInWithPhone: async () => ({ error: 'not-initialized' }),
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

function mapSessionToUser(sessionUser: SupabaseUser | null | undefined): AuthUser | null {
  if (!sessionUser) return null;
  const phone: string =
    sessionUser.user_metadata?.phone ||
    sessionUser.user_metadata?.mobile ||
    (typeof sessionUser.email === 'string' && sessionUser.email.endsWith('@phone.leadradar.app')
      ? `+${sessionUser.email.split('@')[0]}`
      : '') ||
    '';
  return {
    id: sessionUser.id,
    phone: normalizePhone(phone),
    name: sessionUser.user_metadata?.name ?? null,
    email: sessionUser.email ?? null,
  };
}

function friendlyError(message: string, locale: string): string {
  const m = message.toLowerCase();
  const ar = locale === 'ar';
  if (m.includes('user already registered') || m.includes('already exists') || m.includes('duplicate')) {
    return ar ? 'رقم الهاتف مسجل مسبقاً. سجّل الدخول بدلاً من ذلك.' : 'This mobile number is already registered. Please log in.';
  }
  if (m.includes('invalid login credentials')) {
    return ar ? 'رقم الهاتف أو كلمة المرور غير صحيحة.' : 'Incorrect mobile number or password.';
  }
  if (m.includes('email not confirmed')) {
    return ar ? 'الحساب يحتاج تأكيد. عطّل تأكيد البريد في Supabase أو أكّد الحساب.' : 'Account needs confirmation. Disable email confirmation in Supabase or confirm the account.';
  }
  if (m.includes('password')) {
    return ar ? 'كلمة المرور غير صالحة (6 أحرف على الأقل).' : 'Invalid password (min 6 characters).';
  }
  return message;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (mounted) setUser(mapSessionToUser(data.session?.user));
      } catch {
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(mapSessionToUser(session?.user));
      setLoading(false);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signUpWithPhone = useCallback(async ({ phone, password, name }: { phone: string; password: string; name?: string }) => {
    const locale = (() => {
      try {
        return (localStorage.getItem('app_locale') as 'ar' | 'en') || 'ar';
      } catch {
        return 'ar' as const;
      }
    })();
    try {
      const normalized = normalizePhone(phone);
      const email = phoneToEmail(normalized);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { phone: normalized, mobile: normalized, name: name || '' } },
      });
      if (error) return { error: friendlyError(error.message, locale) };
      if (data.user) setUser(mapSessionToUser(data.user));
      // If email confirmation is enabled, there will be no session — surface a helpful message
      if (!data.session && data.user && !data.user.confirmed_at) {
        try {
          // Attempt immediate sign-in (works when autoconfirm is on)
          const { data: s2, error: e2 } = await supabase.auth.signInWithPassword({ email, password });
          if (!e2 && s2.user) {
            setUser(mapSessionToUser(s2.user));
            return { error: null };
          }
        } catch {}
        return {
          error:
            locale === 'ar'
              ? 'تم إنشاء الحساب. فعّل الدخول الفوري من Supabase (Auth → Providers → Email → Confirm email OFF) ثم سجّل الدخول.'
              : 'Account created. Turn off email confirmation in Supabase (Auth → Providers → Email) then log in.',
        };
      }
      return { error: null };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'signup-failed';
      return { error: msg };
    }
  }, []);

  const signInWithPhone = useCallback(async ({ phone, password }: { phone: string; password: string }) => {
    const locale = (() => {
      try {
        return (localStorage.getItem('app_locale') as 'ar' | 'en') || 'ar';
      } catch {
        return 'ar' as const;
      }
    })();
    try {
      const normalized = normalizePhone(phone);
      const email = phoneToEmail(normalized);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: friendlyError(error.message, locale) };
      setUser(mapSessionToUser(data.user));
      return { error: null };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'login-failed';
      return { error: msg };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, loading, signUpWithPhone, signInWithPhone, signOut }),
    [user, loading, signUpWithPhone, signInWithPhone, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
