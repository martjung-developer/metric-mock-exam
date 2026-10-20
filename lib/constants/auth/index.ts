// lib/constants/auth/index.ts
// ─────────────────────────────────────────────────────────────────────────────
// Shared constants for auth and the OTP / verification flow.
// ─────────────────────────────────────────────────────────────────────────────

/**
export const AUTH_ERRORS = {
  ID_NOT_FOUND:     'No account found for this ID. Check your student/faculty/admin ID.',
  WRONG_PASSWORD:   'Incorrect password.',
  ACCOUNT_DISABLED: 'This account has been deactivated. Contact your administrator.',
  OTP_EXPIRED:      'Verification code has expired. Please request a new one.',
  OTP_INVALID:      'Invalid verification code.',
  NETWORK:          'Network error. Please try again.',
  UNKNOWN:          'An unexpected error occurred.',
} as const

export type AuthErrorKey = keyof typeof AUTH_ERRORS

// ── Redirect destinations after login ────────────────────────────────────────

export const POST_LOGIN: Record<string, string> = {
  student: '/student/dashboard',
  faculty: '/admin/dashboard',
  admin:   '/admin/dashboard',
}
  */

// ── OTP constants ─────────────────────────────────────────────────────────────

/** Number of digits in the OTP. */
export const OTP_LENGTH = 6

/** Seconds the user must wait before requesting a new OTP. */
export const OTP_RESEND_COOLDOWN = 60

/** OTP validity window in milliseconds (10 minutes). */
export const OTP_TTL_MS = 10 * 60 * 1000

/** OTP validity window in seconds (10 minutes) — use for DB/session storage. 
export const OTP_EXPIRY_SECONDS = 600 */

/** Maximum wrong-code attempts before the OTP is invalidated. */
export const OTP_MAX_ATTEMPTS = 5