'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Smartphone, Lock, User, Eye, EyeOff, UserPlus } from 'lucide-react';
import { AuthShell } from '@/components/AuthShell';
import { Button, Field, TextInput, Banner } from '@/components/ui';
import { OAuthButtons } from '@/components/OAuthButtons';
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
        {error && <Banner tone="red"><span role="alert">{error}</span></Banner>}

        <Field label={ar ? 'الاسم (اختياري)' : 'Name (optional)'} icon={<User size={14} />} htmlFor="signup-name">
          <TextInput
            id="signup-name"
            type="text"
            autoComplete="name"
            placeholder={ar ? 'اسمك الكريم' : 'Your name'}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>

        <Field label={ar ? 'البريد الإلكتروني (اسم المستخدم)' : 'Email (username)'} icon={<Mail size={14} />} htmlFor="signup-email">
          <TextInput
            id="signup-email"
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

        <Field label={ar ? 'رقم الهاتف (اختياري)' : 'Phone number (optional)'} icon={<Smartphone size={14} />} htmlFor="signup-phone">
          <TextInput
            id="signup-phone"
            className="auth-input-ltr"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            dir="ltr"
            placeholder={ar ? 'مثال: 0791234567' : 'e.g. 0791234567'}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </Field>

        <Field label={ar ? 'كلمة المرور' : 'Password'} icon={<Lock size={14} />} htmlFor="signup-password">
          <div className="auth-password-wrap">
            <TextInput
              id="signup-password"
              className="auth-input-ltr"
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
        </Field>

        <Field label={ar ? 'تأكيد كلمة المرور' : 'Confirm password'} icon={<Lock size={14} />} htmlFor="signup-confirm">
          <TextInput
            id="signup-confirm"
            className="auth-input-ltr"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            dir="ltr"
            placeholder="••••••••"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </Field>

        <Button type="submit" variant="primary" className="btn-search auth-submit" loading={submitting} disabled={submitting || loading} icon={<UserPlus size={16} />}>
          {submitting ? (ar ? 'جاري إنشاء الحساب...' : 'Creating account...') : ar ? 'إنشاء الحساب' : 'Sign up'}
        </Button>
      </form>
      <OAuthButtons onError={setError} />
    </AuthShell>
  );
}
