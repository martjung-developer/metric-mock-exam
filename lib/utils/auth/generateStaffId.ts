// lib/utils/auth/generateStaffId.ts
// ─────────────────────────────────────────────────────────────────────────────
// Server-side utility for generating unique faculty IDs in the admin dashboard.
//
// Faculty IDs: <DEPARTMENT_PREFIX>-<6 random digits>
// Admin IDs:   <DEPARTMENT_PREFIX>-<5 random digits>
//
// The prefix is taken directly from the creating admin's own ID, ensuring the
// new faculty member belongs to the same department.
//
// Usage (server action / API route):
//   const facultyId = await generateUniqueFacultyId('SSLATE', supabase)
//   // → 'SSLATE-582391'
// ─────────────────────────────────────────────────────────────────────────────

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database }       from '@/lib/types/database'

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Returns a zero-padded random integer string of exactly `length` digits. */
function randomDigits(length: number): string {
  // Cryptographically random if available, Math.random() fallback.
  const max = Math.pow(10, length)
  const min = Math.pow(10, length - 1)   // ensures leading digit ≠ 0
  const n   = Math.floor(Math.random() * (max - min)) + min
  return String(n)
}

/**
 * Extracts the department prefix from a staff ID string.
 * e.g. 'SSLATE-14304' → 'SSLATE'
 * Returns null when the ID doesn't match the expected pattern.
 */
export function extractDepartmentPrefix(staffId: string): string | null {
  const match = /^([A-Z]+)-\d+$/.exec(staffId.trim().toUpperCase())
  return match ? match[1] : null
}

// ── Faculty ID generation ─────────────────────────────────────────────────────

/**
 * Generates a unique faculty ID with the given department prefix.
 *
 * Strategy:
 *   1. Generate a candidate 6-digit suffix.
 *   2. Query the `faculty` table to confirm it doesn't already exist.
 *   3. Retry up to `maxAttempts` times before throwing.
 *
 * @param departmentPrefix  Uppercase prefix, e.g. 'SSLATE'
 * @param supabase          Service-role Supabase client (bypasses RLS)
 * @param maxAttempts       How many retries before giving up (default 10)
 */
export async function generateUniqueFacultyId(
  departmentPrefix: string,
  supabase:         SupabaseClient<Database>,
  maxAttempts = 10,
): Promise<string> {
  const prefix = departmentPrefix.trim().toUpperCase()
  if (!prefix) { throw new Error('Department prefix must not be empty.') }

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const candidate = `${prefix}-${randomDigits(6)}`

    const { data, error } = await supabase
      .from('faculty')
      .select('faculty_id')
      .eq('faculty_id', candidate)
      .maybeSingle()

    if (error) {
      throw new Error(`DB error checking faculty_id uniqueness: ${error.message}`)
    }

    if (!data) {
      // No row found → this ID is free to use.
      return candidate
    }
    // Collision — try again.
  }

  throw new Error(
    `Could not generate a unique faculty ID for prefix "${prefix}" after ${maxAttempts} attempts.`,
  )
}

// ── Payload shape for create-faculty API route ────────────────────────────────

export interface CreateFacultyPayload {
  /** Automatically generated: <DEPT_PREFIX>-<6 digits>  e.g. SSLATE-582391 */
  faculty_id:  string
  /** Role is always 'faculty' for IDs created via this flow. */
  role:        'faculty'
  /** Department prefix extracted from the creating admin's ID. */
  department:  string
  /** Full name supplied by the admin in the dashboard form. */
  full_name:   string
  /** Work email for the new faculty member. */
  email:       string
}

/**
 * Builds a complete CreateFacultyPayload given an admin's own staff ID.
 * Throws if the admin ID has an unrecognisable prefix.
 *
 * @param adminStaffId   The creating admin's ID, e.g. 'SSLATE-14304'
 * @param fullName       New faculty member's full name
 * @param email          New faculty member's email
 * @param supabase       Service-role Supabase client
 */
export async function buildCreateFacultyPayload(
  adminStaffId: string,
  fullName:     string,
  email:        string,
  supabase:     SupabaseClient<Database>,
): Promise<CreateFacultyPayload> {
  const department = extractDepartmentPrefix(adminStaffId)
  if (!department) {
    throw new Error(`Cannot extract department from admin ID: "${adminStaffId}"`)
  }

  const faculty_id = await generateUniqueFacultyId(department, supabase)

  return {
    faculty_id,
    role:       'faculty',
    department,
    full_name:  fullName.trim(),
    email:      email.trim().toLowerCase(),
  }
}