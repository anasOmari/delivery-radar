'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { normalizePhone } from '@/lib/phone';

export interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
  phone?: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signUpWithEmail: (params: { email: string; password: string; name?: string; phone?: string }) => Promise<{ error: string | null }>;
  signInWithEmail: (params: { email: string; password: string }) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signUpWithEmail: async () => ({ error: 'not-initialized' }),
  signInWithEmail: async () => ({ error: 'not-initialized' }),
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function emailValidationError(input: string, locale: 'ar' | 'en' = 'ar'): string | null {
  const value = input.trim();
  if (!value) {
    return locale === 'ar' ? 'البريد الإلكتروني مطلوب' : 'Email is required';
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
    return locale === 'ar' ? 'صيغة البريد الإلكتروني غير صحيحة' : 'Invalid email format';
  }
  return null;
}

function mapSessionToUser(sessionUser: SupabaseUser | null | undefined): AuthUser | null {
  if (!sessionUser || !sessionUser.email) return null;
  return {
    id: sessionUser.id,
    email: sessionUser.email,
    name: sessionUser.user_metadata?.name ?? null,
    phone: sessionUser.user_metadata?.phone ?? sessionUser.user_metadata?.mobile ?? null,
  };
}

function friendlyError(message: string, locale: string): string {
  const m = message.toLowerCase();
  const ar = locale === 'ar';
  if (m.includes('user already registered') || m.includes('already exists') || m.includes('duplicate')) {
    return ar ? 'هذا البريد مسجل مسبقاً. سجّل الدخول بدلاً من ذلك.' : 'This email is already registered. Please log in.';
  }
  if (m.includes('invalid login credentials')) {
    return ar ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' : 'Incorrect email or password.';
  }
  if (m.includes('email not confirmed')) {
    return ar ? 'تحقق من بريدك واضغط رابط التفعيل، ثم سجّل الدخول.' : 'Check your inbox for the confirmation link, then log in.';
  }
  if (m.includes('password')) {
    return ar ? 'كلمة المرور غير صالحة (6 أحرف على الأقل).' : 'Invalid password (min 6 characters).';
  }
  return message;
}

function currentLocale(): 'ar' | 'en' {
  try {
    return (localStorage.getItem('app_locale') as 'ar' | 'en') || 'ar';
  } catch {
    return 'ar';
  }
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

  const signUpWithEmail = useCallback(async ({ email, password, name, phone }: { email: string; password: string; name?: string; phone?: string }) => {
    const locale = currentLocale();
    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanPhone = phone ? normalizePhone(phone) : '';
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: { data: { name: name?.trim() || '', phone: cleanPhone, mobile: cleanPhone } },
      });
      if (error) return { error: friendlyError(error.message, locale) };
      if (data.session) {
        setUser(mapSessionToUser(data.session.user));
        return { error: null };
      }
      // Email confirmation enabled: no session until the user clicks the link.
      setUser(null);
      await supabase.auth.signOut().catch(() => {});
      return {
        error:
          locale === 'ar'
            ? 'تم إنشاء الحساب. تحقق من بريدك واضغط رابط التفعيل ثم سجّل الدخول.'
            : 'Account created. Check your inbox for the confirmation link, then log in.',
      };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'signup-failed';
      return { error: msg };
    }
  }, []);

  const signInWithEmail = useCallback(async ({ email, password }: { email: string; password: string }) => {
    const locale = currentLocale();
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
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
    () => ({ user, loading, signUpWithEmail, signInWithEmail, signOut }),
    [user, loading, signUpWithEmail, signInWithEmail, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
