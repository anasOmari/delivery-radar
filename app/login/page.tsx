'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Smartphone, Lock, Eye, EyeOff, LogIn } from 'lucide-react';
import { AuthShell } from '@/components/AuthShell';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';
import { phoneValidationError, normalizePhone } from '@/lib/phone';

export default function LoginPage() {
  const { locale } = useLanguage();
  const ar = locale === 'ar';
  const router = useRouter();
  const { user, loading, signInWithPhone } = useAuth();

  const [phone, setPhone] = useState('');
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
    const phoneErr = phoneValidationError(phone, locale);
    if (phoneErr) return setError(phoneErr);
    if (!password) return setError(ar ? 'كلمة المرور مطلوبة' : 'Password is required');
    setSubmitting(true);
    const { error: err } = await signInWithPhone({ phone: normalizePhone(phone), password });
    setSubmitting(false);
    if (err) return setError(err);
    router.replace('/');
  };

  return (
    <AuthShell
      title={ar ? 'تسجيل الدخول' : 'Log in'}
      subtitle={ar ? 'ادخل برقم هاتفك المحمول وكلمة المرور' : 'Sign in with your mobile number and password'}
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
          <label className="form-label" htmlFor="login-phone">
            <Smartphone size={14} />
            {ar ? 'رقم الهاتف المحمول (اسم المستخدم)' : 'Mobile number (username)'}
          </label>
          <input
            id="login-phone"
            className="input-field auth-input-ltr"
            type="tel"
            inputMode="tel"
            autoComplete="username"
            dir="ltr"
            placeholder={ar ? 'مثال: 0791234567' : 'e.g. 0791234567'}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
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
          <LogIn size={16} />
          {submitting ? (ar ? 'جاري الدخول...' : 'Signing in...') : ar ? 'دخول' : 'Log in'}
        </button>
      </form>
    </AuthShell>
  );
}
