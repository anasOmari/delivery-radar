'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Smartphone, Lock, User, Eye, EyeOff, UserPlus } from 'lucide-react';
import { AuthShell } from '@/components/AuthShell';
import { useAuth, emailValidationError } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';
import { phoneValidationError, normalizePhone } from '@/lib/phone';

export default function SignupPage() {
  const { locale } = useLanguage();
  const ar = locale === 'ar';
  const router = useRouter();
  const { user, loading, signUpWithEmail } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
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
    if (phone.trim()) {
      const phoneErr = phoneValidationError(phone, locale);
      if (phoneErr) return setError(phoneErr);
    }
    if (password.length < 6) {
      return setError(ar ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters');
    }
    if (password !== confirm) {
      return setError(ar ? 'تأكيد كلمة المرور غير متطابق' : 'Password confirmation does not match');
    }
    setSubmitting(true);
    const { error: err } = await signUpWithEmail({
      email,
      password,
      name: name.trim(),
      phone: phone.trim() ? normalizePhone(phone) : undefined,
    });
    setSubmitting(false);
    if (err) return setError(err);
    router.replace('/');
  };

  return (
    <AuthShell
      title={ar ? 'إنشاء حساب جديد' : 'Create account'}
      subtitle={ar ? 'سجّل ببريدك الإلكتروني — سيكون هو اسم المستخدم الخاص بك' : 'Register with your email — it will be your username'}
      footer={
        <span>
          {ar ? 'لديك حساب بالفعل؟ ' : 'Already have an account? '}
          <Link href="/login">{ar ? 'تسجيل الدخول' : 'Log in'}</Link>
        </span>
      }
    >
      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        {error && <div className="notification-banner banner-error" style={{ marginBottom: 0 }}><span>{error}</span></div>}

        <div className="form-group">
          <label className="form-label" htmlFor="signup-name">
            <User size={14} />
            {ar ? 'الاسم (اختياري)' : 'Name (optional)'}
          </label>
          <input
            id="signup-name"
            className="input-field"
            type="text"
            autoComplete="name"
            placeholder={ar ? 'اسمك الكريم' : 'Your name'}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="signup-email">
            <Mail size={14} />
            {ar ? 'البريد الإلكتروني (اسم المستخدم)' : 'Email (username)'}
          </label>
          <input
            id="signup-email"
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
          <label className="form-label" htmlFor="signup-phone">
            <Smartphone size={14} />
            {ar ? 'رقم الهاتف (اختياري)' : 'Phone number (optional)'}
          </label>
          <input
            id="signup-phone"
            className="input-field auth-input-ltr"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            dir="ltr"
            placeholder={ar ? 'مثال: 0791234567' : 'e.g. 0791234567'}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="signup-password">
            <Lock size={14} />
            {ar ? 'كلمة المرور' : 'Password'}
          </label>
          <div className="auth-password-wrap">
            <input
              id="signup-password"
              className="input-field auth-input-ltr"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
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

        <div className="form-group">
          <label className="form-label" htmlFor="signup-confirm">
            <Lock size={14} />
            {ar ? 'تأكيد كلمة المرور' : 'Confirm password'}
          </label>
          <input
            id="signup-confirm"
            className="input-field auth-input-ltr"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            dir="ltr"
            placeholder="••••••••"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>

        <button className="btn btn-search auth-submit" type="submit" disabled={submitting || loading}>
          <UserPlus size={16} />
          {submitting ? (ar ? 'جاري إنشاء الحساب...' : 'Creating account...') : ar ? 'إنشاء الحساب' : 'Sign up'}
        </button>
      </form>
    </AuthShell>
  );
}
