// lib/utils/auth/otp-store.ts
// ─────────────────────────────────────────────────────────────────────────────
// Server-side in-memory OTP store.
//
// ⚠️  This module runs ONLY in the Node.js runtime (API routes / Server Actions).
//     It must NEVER be imported from client components.
//
// Each entry stores:
//   hash      — bcrypt hash of the 6-digit code
//   expiresAt — timestamp after which the entry is invalid
//   attempts  — number of wrong-code submissions so far
//
// In production with multiple instances, replace with Redis or a DB table.
// ─────────────────────────────────────────────────────────────────────────────

import { OTP_TTL_MS, OTP_MAX_ATTEMPTS } from '@/lib/constants/auth'

interface OtpEntry {
  hash:      string   // bcrypt hash of the OTP
  expiresAt: number   // Unix ms
  attempts:  number
}

// Module-level map — persists for the lifetime of the Node process.
const store = new Map<string, OtpEntry>()

/** Normalise email so casing/whitespace differences don't create duplicate entries. */
function key(email: string): string {
  return email.toLowerCase().trim()
}

/**
 * Store a bcrypt-hashed OTP for `email`.
 * Calling this again for the same email replaces any existing entry.
 */
export function storeOtp(email: string, hash: string): void {
  store.set(key(email), {
    hash,
    expiresAt: Date.now() + OTP_TTL_MS,
    attempts:  0,
  })
}

export type ConsumeOtpResult = 'valid' | 'invalid' | 'expired' | 'too_many_attempts'

/**
 * Verify a submitted OTP token against the stored hash.
 *
 * @param email    The email the OTP was sent to.
 * @param verifyFn A synchronous function that compares the raw token to the
 *                 stored hash — e.g. `(hash) => bcrypt.compareSync(token, hash)`.
 *                 Keeping the comparison outside this module avoids importing
 *                 bcrypt (a native module) into client bundles accidentally.
 *
 * On success the entry is deleted (one-time use).
 * On failure the attempt counter is incremented; entry is deleted on lockout.
 */
export function consumeOtp(
  email:    string,
  verifyFn: (hash: string) => boolean,
): ConsumeOtpResult {
  const k     = key(email)
  const entry = store.get(k)

  if (!entry)                            {return 'invalid'}
  if (Date.now() > entry.expiresAt)    { store.delete(k); return 'expired'           }
  if (entry.attempts >= OTP_MAX_ATTEMPTS) { store.delete(k); return 'too_many_attempts' }

  if (verifyFn(entry.hash)) {
    store.delete(k)
    return 'valid'
  }

  // Increment attempt count and persist
  store.set(k, { ...entry, attempts: entry.attempts + 1 })
  return 'invalid'
}

/**
 * Remove a stored OTP entry — useful for cleanup in tests or on explicit cancel.
 */
export function clearOtp(email: string): void {
  store.delete(key(email))
}