// lib/utils/auth/index.ts
// ─────────────────────────────────────────────────────────────────────────────
// Pure utility functions for auth — no side effects, no Supabase calls.
//
// ID FORMAT RULES (source of truth)
// ──────────────────────────────────
// Student IDs:  YY-NNNN-NNN           e.g. 23-0249-605   (2-4-3 digits)
// Admin IDs:    <PREFIX>-<5 digits>   e.g. SBIT-16113
// Faculty IDs:  <PREFIX>-<6 digits>   e.g. SSLATE-582391
//
// Role is determined SOLELY by digit count after the hyphen.
// Department prefix names (SBIT, SSLATE, ADM, …) never determine role.
// ─────────────────────────────────────────────────────────────────────────────

import type { UserRole, ProgramCode, YearLevel } from '@/lib/types/auth/'
import { PROGRAMS, YEAR_LEVEL_OPTIONS } from '@/lib/types/auth/'

// ── ID patterns ───────────────────────────────────────────────────────────────

/** Student: exactly  YY-NNNN-NNN  (2-4-3 numeric groups) */
const STUDENT_ID_RE = /^\d{2}-\d{4}-\d{3}$/

/** Staff (admin or faculty): one or more uppercase letters, hyphen, then digits */
const STAFF_ID_RE = /^([A-Z]+)-(\d+)$/

// ── Internal helper ───────────────────────────────────────────────────────────

/**
 * Parses a normalised (trimmed, uppercased) string as a staff ID.
 * Returns { prefix, digits } when it matches, or null otherwise.
 */
function parseStaffId(norm: string): { prefix: string; digits: string } | null {
  const match = STAFF_ID_RE.exec(norm)
  if (!match) { return null }
  return { prefix: match[1], digits: match[2] }
}

// ── detectRoleFromId ──────────────────────────────────────────────────────────
/**
 * Returns the role implied by the ID format, or null when the format is
 * unrecognised.
 *
 * Mapping:
 *   Student format (YY-NNNN-NNN)           → 'student'
 *   Staff with exactly 5 trailing digits   → 'admin'
 *   Staff with exactly 6 trailing digits   → 'faculty'
 *   Anything else                          → null
 *
 * NOTE: Department prefix names are intentionally ignored.  SBIT-16113 and
 * SSLATE-16113 are both admin IDs; SBIT-582391 and SSLATE-582391 are both
 * faculty IDs.  The database (resolveUserById) is the final authority.
 */
export function detectRoleFromId(id: string): UserRole | null {
  const norm = id.trim().toUpperCase()
  if (!norm) { return null }

  if (STUDENT_ID_RE.test(norm)) { return 'student' }

  const staff = parseStaffId(norm)
  if (!staff) { return null }

  if (staff.digits.length === 5) { return 'admin' }
  if (staff.digits.length === 6) { return 'faculty' }

  return null   // e.g. 4 digits, 7 digits — not a valid staff ID
}

/**
 * Returns just the department prefix for a staff ID (e.g. "SSLATE"),
 * or null when the ID is not a staff ID.
 * Used by the login UI to show "Detected: Staff (SSLATE)" before the server
 * resolves the actual role.
 */
export function getStaffPrefix(id: string): string | null {
  const norm = id.trim().toUpperCase()
  const staff = parseStaffId(norm)
  return staff ? staff.prefix : null
}

// ── ID normalisation ──────────────────────────────────────────────────────────

export function normaliseId(raw: string): string {
  return raw.trim().toUpperCase()
}

// ── Role detection (legacy alias — delegates to detectRoleFromId) ─────────────

export function getRoleFromId(rawId: string): UserRole | null {
  return detectRoleFromId(normaliseId(rawId))
}

// ── Student ID validation (signup — strict format) ────────────────────────────

export function validateStudentIdInput(id: string): string | null {
  const norm = id.trim()
  if (!norm) { return 'Student ID is required.' }

  if (STAFF_ID_RE.test(norm.toUpperCase())) {
    return 'This ID belongs to a staff account. Student registration only.'
  }

  if (!STUDENT_ID_RE.test(norm)) {
    return 'Format: YY-NNNN-NNN  (e.g. 23-0249-605)'
  }
  return null
}

// ── Login ID validation ───────────────────────────────────────────────────────
/**
 * Lenient check: must match a recognised pattern.
 * For staff IDs, digit count must be exactly 5 (admin) or 6 (faculty).
 */
export function validateLoginId(id: string): string | null {
  if (!id.trim()) { return 'Please enter your ID.' }

  const norm = id.trim()

  if (STUDENT_ID_RE.test(norm)) { return null }   // valid student ID

  const staff = parseStaffId(norm.toUpperCase())
  if (staff) {
    if (staff.digits.length === 5 || staff.digits.length === 6) {
      return null   // valid admin (5) or faculty (6) ID
    }
    return `Staff IDs must have 5 digits (admin) or 6 digits (faculty). "${norm}" has ${staff.digits.length}.`
  }

  return 'Enter a valid Student ID (e.g. 23-0249-605) or Staff ID (e.g. SBIT-16113 or SSLATE-582391).'
}

// ── Staff ID format validators (admin dashboard use) ─────────────────────────

export function validateAdminId(id: string): string | null {
  const staff = parseStaffId(id.trim().toUpperCase())
  if (!staff) { return 'Invalid admin ID format.' }
  if (staff.digits.length !== 5) {
    return `Admin IDs require exactly 5 digits. Got ${staff.digits.length}.`
  }
  return null
}

export function validateFacultyId(id: string): string | null {
  const staff = parseStaffId(id.trim().toUpperCase())
  if (!staff) { return 'Invalid faculty ID format.' }
  if (staff.digits.length !== 6) {
    return `Faculty IDs require exactly 6 digits. Got ${staff.digits.length}.`
  }
  return null
}

// ── Phone validation (optional field) ────────────────────────────────────────

export function validatePhone(phone: string): string | null {
  const trimmed = phone.trim()
  if (!trimmed) { return null }
  if (!/^(\+?63|0)9\d{9}$/.test(trimmed)) {
    return 'Enter a valid PH mobile number: 09XXXXXXXXX or +639XXXXXXXXX'
  }
  return null
}

// ── Full name validation ──────────────────────────────────────────────────────

export function validateFullName(name: string): string | null {
  const trimmed = name.trim()
  if (!trimmed)           { return 'Full name is required.' }
  if (trimmed.length < 2) { return 'Full name must be at least 2 characters.' }
  if (!/\S+\s+\S+/.test(trimmed)) { return 'Please enter your first and last name.' }
  return null
}

// ── Email validation ──────────────────────────────────────────────────────────

export function validateEmail(email: string): string | null {
  if (!email.trim()) { return 'Email is required.' }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { return 'Enter a valid email address.' }
  return null
}

// ── Year level validation ─────────────────────────────────────────────────────

export function validateYearLevel(level: YearLevel | null): string | null {
  if (level === null) { return 'Please select your year level.' }
  return null
}

// ── Password strength ─────────────────────────────────────────────────────────

export type PasswordStrength = 'weak' | 'fair' | 'good' | 'strong'

export function getPasswordStrength(pw: string): PasswordStrength | null {
  if (!pw)           { return null }
  if (pw.length < 6) { return 'weak' }
  if (pw.length < 10) { return 'fair' }
  if (/[A-Z]/.test(pw) && /[0-9]/.test(pw)) { return 'strong' }
  return 'good'
}

// ── Program helpers ───────────────────────────────────────────────────────────

export function isProgramCode(value: string): value is ProgramCode {
  return PROGRAMS.some((p) => p.value === value)
}

export function getProgramLabel(code: ProgramCode): string {
  return PROGRAMS.find((p) => p.value === code)?.label ?? code
}

// ── Year level helpers ────────────────────────────────────────────────────────

export function getYearLabel(level: YearLevel | null): string {
  if (level === null) { return '—' }
  return YEAR_LEVEL_OPTIONS.find((y) => y.value === level)?.label ?? String(level)
}

// ── OTP formatting ────────────────────────────────────────────────────────────

export function formatOtpDisplay(code: string[]): string {
  return code.join('')
}

// ── Error extraction ──────────────────────────────────────────────────────────

export function extractErrorMessage(err: unknown): string {
  if (err instanceof Error) { return err.message }
  if (typeof err === 'string') { return err }
  return 'An unexpected error occurred.'
}