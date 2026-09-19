'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { AuthShell } from '@/components/AuthShell';
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
      title={ar ? 'مرحباً بعودتك' : 'Welcome back'}
      subtitle={ar ? 'ادخل ببريدك الإلكتروني للوصول إلى لوحتك' : 'Sign in with your email to reach your dashboard'}
      footer={
        <span>
          {ar ? 'ليس لديك حساب؟ ' : "Don't have an account? "}
          <Link href="/signup">{ar ? 'إنشاء حساب جديد' : 'Create account'}</Link>
        </span>
      }
    >
      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        {error && <div className="notification-banner banner-error" style={{ marginBottom: 0 }}><span>{error}</span></div>}

        <div className="form-group">
          <label className="form-label" htmlFor="login-email">
            <Mail size={14} />
            {ar ? 'البريد الإلكتروني' : 'Email'}
          </label>
          <input
            id="login-email"
            className="input-field auth-input-ltr"
            type="email"
            inputMode="email"
            autoComplete="username"
            dir="ltr"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="login-password">
            <Lock size={14} />
            {ar ? 'كلمة المرور' : 'Password'}
          </label>
          <div className="auth-password-wrap">
            <input
              id="login-password"
              className="input-field auth-input-ltr"
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
        </div>

        <button className="btn btn-search auth-submit" type="submit" disabled={submitting || loading}>
          {submitting ? (
            <>
              <Loader2 size={17} className="spin" />
              {ar ? 'جاري الدخول...' : 'Signing in...'}
            </>
          ) : (
            <>
              {ar ? 'دخول' : 'Log in'}
              {ar ? <ArrowLeft size={17} /> : <ArrowRight size={17} />}
            </>
          )}
        </button>
      </form>
    </AuthShell>
  );
}
