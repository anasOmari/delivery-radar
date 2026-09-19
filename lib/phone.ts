'use client';

export function normalizePhone(input: string): string {
  if (!input) return '';
  // Keep digits only, preserve leading + info separately
  const trimmed = input.trim();
  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');
  return hasPlus ? `+${digits}` : digits;
}

export function digitsOnly(phone: string): string {
  return phone.replace(/\D/g, '');
}

export function isValidPhone(input: string): boolean {
  const digits = digitsOnly(input);
  // E.164: 7–15 digits
  return digits.length >= 7 && digits.length <= 15;
}

export function phoneValidationError(input: string, locale: 'ar' | 'en' = 'ar'): string | null {
  const raw = input.trim();
  if (!raw) {
    return locale === 'ar' ? 'رقم الهاتف مطلوب' : 'Mobile number is required';
  }
  const digits = digitsOnly(raw);
  if (!/^[+\d][\d\s-]*$/.test(raw)) {
    return locale === 'ar'
      ? 'رقم الهاتف يجب أن يحتوي على أرقام فقط'
      : 'Mobile number must contain digits only';
  }
  if (digits.length < 7) {
    return locale === 'ar' ? 'رقم الهاتف قصير جداً (7 أرقام على الأقل)' : 'Mobile number is too short (min 7 digits)';
  }
  if (digits.length > 15) {
    return locale === 'ar' ? 'رقم الهاتف طويل جداً (15 رقم كحد أقصى)' : 'Mobile number is too long (max 15 digits)';
  }
  return null;
}

/**
 * Map a mobile number to a synthetic email so Supabase email/password
 * auth can be used with the phone as the username (no SMS provider needed).
 */
export function phoneToEmail(phone: string): string {
  const digits = digitsOnly(phone);
  return `${digits}@phone.leadradar.app`;
}

export function formatPhoneDisplay(phone: string): string {
  const n = normalizePhone(phone);
  return n.startsWith('+') ? n : n;
}
