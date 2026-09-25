import { useState } from 'react';

// Keep these rules in sync with zivdah-web/src/utils/authValidation.jsx.
const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;
const MOBILE_RE = /^[6-9]\d{9}$/; // Indian 10-digit mobile
const OTP_RE = /^\d{6}$/;

export type AuthRule = 'email' | 'mobile' | 'currentPassword' | 'otp';

/** Returns an error message for `value` under `rule`, or null when valid. */
export function validateField(rule: AuthRule, value = ''): string | null {
  const v = value.trim();
  switch (rule) {
    case 'email':
      if (!v) return 'Email is required';
      if (v.length > 255 || !EMAIL_RE.test(v)) return 'Enter a valid email address (e.g. name@example.com)';
      return null;
    case 'mobile':
      if (!v) return 'Mobile number is required';
      if (!MOBILE_RE.test(v)) return 'Enter a valid 10-digit mobile number starting with 6-9';
      return null;
    // Login only checks presence: accounts created before the web app's password
    // strength rule may have weaker passwords and must still be able to log in.
    case 'currentPassword':
      if (!value) return 'Password is required';
      return null;
    case 'otp':
      if (!OTP_RE.test(v)) return 'Enter the 6-digit code';
      return null;
  }
}

/** Strips non-digits and caps length — for mobile (10) and OTP (6) inputs. */
export const digitsOnly = (value: string, max: number) => value.replace(/\D/g, '').slice(0, max);

/**
 * Per-field validation state for a form. `rules` maps field name -> rule.
 * Fields validate on blur and on submit; once a field shows an error it
 * re-validates on every change so the message clears as soon as it's fixed.
 */
export function useFieldValidation<F extends string>(rules: Record<F, AuthRule>) {
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<F, string | null>>>({});

  const revalidate = (name: F, value: string) => {
    if (fieldErrors[name]) setFieldErrors((fe) => ({ ...fe, [name]: validateField(rules[name], value) }));
  };

  /** Validates the given fields; returns true when all are valid. */
  const validate = (values: Partial<Record<F, string>>) => {
    const errors: Partial<Record<F, string>> = {};
    for (const name of Object.keys(values) as F[]) {
      const msg = validateField(rules[name], values[name]);
      if (msg) errors[name] = msg;
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /** Props to spread onto an MUI TextField: blur validation + error display. */
  const fieldProps = (name: F) => ({
    onBlur: (e: { target: { value: string } }) =>
      setFieldErrors((fe) => ({ ...fe, [name]: validateField(rules[name], e.target.value) })),
    error: !!fieldErrors[name],
    helperText: fieldErrors[name] || undefined,
  });

  const clearErrors = () => setFieldErrors({});

  return { revalidate, validate, fieldProps, clearErrors };
}
