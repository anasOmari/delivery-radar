'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, ArrowRight } from 'lucide-react';
import { AuthShell } from '@/components/AuthShell';
import { Button, Field, TextInput, Banner } from '@/components/ui';
import { OAuthButtons } from '@/components/OAuthButtons';
import { useAuth, emailValidationError } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';

export default function LoginPage() {
  const { locale } = useLanguage();
  const ar = locale === 'ar';
  const router = useRouter();
  const { user, loading, signInWithEmail } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace('/');
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const emailErr = emailValidationError(email, locale);
    if (emailErr) return setError(emailErr);
    if (!password) return setError(ar ? 'كلمة المرور مطلوبة' : 'Password is required');
    setSubmitting(true);
    const { error: err } = await signInWithEmail({ email, password });
    setSubmitting(false);
    if (err) return setError(err);
    router.replace('/');
  };

  return (
    <AuthShell
      title={ar ? 'تسجيل الدخول' : 'Log in'}
      subtitle={ar ? 'ادخل ببريدك الإلكتروني وكلمة المرور' : 'Sign in with your email and password'}
      footer={
        <span>
          {ar ? 'ليس لديك حساب؟ ' : "Don't have an account? "}
          <Link href="/signup">{ar ? 'إنشاء حساب جديد' : 'Create account'}</Link>
        </span>
      }
    >
      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        {error && <Banner tone="red"><span role="alert">{error}</span></Banner>}

        <Field label={ar ? 'البريد الإلكتروني' : 'Email'} icon={<Mail size={14} />} htmlFor="login-email">
          <TextInput
            id="login-email"
            className="auth-input-ltr"
            type="email"
            inputMode="email"
            autoComplete="username"
            dir="ltr"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>

        <Field label={ar ? 'كلمة المرور' : 'Password'} icon={<Lock size={14} />} htmlFor="login-password">
          <div className="auth-password-wrap">
            <TextInput
              id="login-password"
              className="auth-input-ltr"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              dir="ltr"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="auth-eye-btn"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'hide' : 'show'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </Field>

        <Button type="submit" variant="primary" className="btn-search auth-submit" loading={submitting} disabled={submitting || loading}>
          {submitting ? (
            <>{ar ? 'جاري الدخول...' : 'Signing in...'}</>
          ) : (
            <>
              {ar ? 'دخول' : 'Log in'}
              {ar ? <ArrowLeft size={17} /> : <ArrowRight size={17} />}
            </>
          )}
        </Button>
      </form>
      <OAuthButtons onError={setError} />
    </AuthShell>
  );
}
