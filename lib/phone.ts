/** Phone helpers — pure functions, safe for client & server. */

export function normalizePhone(input: string): string {
  if (!input) return '';
  // Keep digits only, preserve leading + info separately
  const trimmed = input.trim();
  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');
  return hasPlus ? `+${digits}` : digits;
}

export function digitsOnly(phone: string): string {
  return (phone || '').replace(/\D/g, '');
}

export function isValidPhone(input: string): boolean {
  const digits = digitsOnly(input);
  // E.164: 7–15 digits
  return digits.length >= 7 && digits.length <= 15;
}

export function phoneValidationError(input: string, locale: 'ar' | 'en' = 'ar'): string | null {
  const raw = (input || '').trim();
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
 * Normalize any user-entered phone to international digits (no +, no spaces)
 * suitable for Green-API chatId / wa.me links.
 *
 * Jordan-aware (default country 962):
 *  - "0788779463" (10 digits, leading 0) -> "962788779463"
 *  - "788779463"  (9 digits, starts with 7) -> "962788779463"
 *  - "065551234"  (landline with 0) -> "96265551234"
 *  - "00962788779463" / "+962788779463" / "962788779463" -> "962788779463"
 * Non-Jordanian numbers that already carry a country code are returned as-is
 * (digits only, leading 00 stripped).
 */
export function normalizeToInternational(input: string, defaultCountryCode = '962'): string {
  if (!input) return '';
  let digits = digitsOnly(input);
  if (!digits) return '';

  // Strip international prefix 00 (e.g. 00962... -> 962...)
  if (digits.startsWith('00')) {
    digits = digits.substring(2);
  }

  // Already international with Jordan code
  if (digits.startsWith(defaultCountryCode)) {
    return digits;
  }

  // Jordan local mobile: 07XXXXXXXX (10 digits)
  if (/^0?7[789]\d{7}$/.test(digits)) {
    const local = digits.startsWith('0') ? digits.substring(1) : digits;
    return `${defaultCountryCode}${local}`;
  }

  // Jordan local mobile without leading 0: 7XXXXXXXX (9 digits)
  if (/^7[789]\d{6}$/.test(digits)) {
    return `${defaultCountryCode}${digits}`;
  }

  // Jordan landline / other local with leading 0 (e.g. 06XXXXXXX)
  if (digits.startsWith('0') && (digits.length === 9 || digits.length === 10)) {
    return `${defaultCountryCode}${digits.substring(1)}`;
  }

  // Anything else: return digits as-is (already international / other country)
  return digits;
}

/** Green-API chatId helper: "962788779463" -> "962788779463@c.us" */
export function toGreenApiChatId(input: string): string {
  return `${normalizeToInternational(input)}@c.us`;
}
