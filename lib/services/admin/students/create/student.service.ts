// lib/services/admin/students/create/student.service.ts
//
// All auth and database operations for creating a student account.
//
// Intentional design choices:
//   • Auth (signUp) and DB writes are clearly separated functions.
//   • Each function either returns a typed result or throws a StudentServiceError.
//   • No UI logic, no state, no React — purely async functions.
//   • The profile upsert is safe if the DB trigger already created the row.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database }       from '@/lib/types/database'
import type {
  StudentCreatePayload,
  CreateStudentResult,
  StudentServiceError,
} from '@/lib/types/admin/students/create/student.types'

type SupabaseDB = SupabaseClient<Database>

// ── Error factory ─────────────────────────────────────────────────────────────

function makeError(
  code:    StudentServiceError['code'],
  message: string,
): StudentServiceError {
  return { code, message }
}

// ── Email uniqueness check ────────────────────────────────────────────────────

/**
 * Returns true when a profile row with the given email already exists.
 * Throws a StudentServiceError only on unexpected Supabase failures.
 */
export async function checkEmailExists(
  supabase: SupabaseDB,
  email:    string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  if (error) {throw makeError('UNKNOWN', error.message)}
  return data !== null
}

// ── Auth sign-up ──────────────────────────────────────────────────────────────

/**
 * Creates a new Supabase auth user via signUp.
 * The DB trigger `handle_new_user` may auto-create the profile row.
 *
 * NOTE: In production, prefer a server action with the service_role key so you
 * can bypass email confirmation. Client-side signUp works for dev/testing.
 *
 * Returns the new user's UUID on success.
 * Throws a StudentServiceError on failure.
 */
export async function createAuthUser(
  supabase:  SupabaseDB,
  email:     string,
  password:  string,
  fullName:  string,
): Promise<string> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role:      'student',
      },
    },
  })

  if (error || !data.user) {
    throw makeError(
      'AUTH_SIGNUP_FAILED',
      error?.message ?? 'Failed to create user account.',
    )
  }

  return data.user.id
}

// ── Profile upsert ────────────────────────────────────────────────────────────

/**
 * Upserts the profile row.
 * Safe to call even if the DB trigger already created the profile —
 * upsert will update the row to ensure full_name and role are correct.
 */
export async function upsertProfile(
  supabase:  SupabaseDB,
  userId:    string,
  email:     string,
  fullName:  string,
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .upsert({
      id:        userId,
      email,
      full_name: fullName,
      role:      'student',
    })

  if (error) {
    throw makeError('PROFILE_UPSERT_FAILED', error.message)
  }
}

// ── Student record insert ─────────────────────────────────────────────────────

/**
 * Inserts the student record.
 * Called after the auth user + profile are confirmed to exist.
 */
export async function createStudentRecord(
  supabase: SupabaseDB,
  userId:   string,
  payload:  Pick<StudentCreatePayload, 'student_id' | 'program_id' | 'year_level' | 'school'>,
): Promise<void> {
  const { error } = await supabase
    .from('students')
    .insert({
      id:         userId,
      student_id: payload.student_id,
      program_id: payload.program_id,
      year_level: payload.year_level,
      school:     payload.school,
    })

  if (error) {
    throw makeError('STUDENT_INSERT_FAILED', error.message)
  }
}

// ── Orchestrated create ───────────────────────────────────────────────────────

/**
 * Full student creation flow:
 *   1. Check for duplicate email
 *   2. Create auth user (signUp)
 *   3. Upsert profile
 *   4. Insert student record
 *
 * Returns a discriminated union so the hook can branch without try/catch.
 * Profile upsert errors are non-fatal (logged as warnings) since a partial
 * state is recoverable; student record failure IS fatal and is returned.
 */
export async function createStudent(
  supabase: SupabaseDB,
  payload:  StudentCreatePayload,
): Promise<CreateStudentResult> {
  try {
    // 1. Duplicate email check
    const exists = await checkEmailExists(supabase, payload.email)
    if (exists) {
      return {
        success: false,
        error:   makeError('EMAIL_DUPLICATE', 'A user with this email already exists.'),
      }
    }

    // 2. Auth user
    const userId = await createAuthUser(
      supabase,
      payload.email,
      payload.password,
      payload.full_name,
    )

    // 3. Profile upsert (non-fatal if trigger already created it)
    try {
      await upsertProfile(supabase, userId, payload.email, payload.full_name)
    } catch (profileErr) {
      // Log but don't abort — the auth user exists; profile may still be OK
      console.warn('Profile upsert warning:', profileErr)
    }

    // 4. Student record (fatal if this fails)
    await createStudentRecord(supabase, userId, {
      student_id: payload.student_id,
      program_id: payload.program_id,
      year_level: payload.year_level,
      school:     payload.school,
    })

    return { success: true, userId }

  } catch (err) {
    const typed = err as StudentServiceError
    return {
      success: false,
      error: {
        code:    typed.code    ?? 'UNKNOWN',
        message: typed.message ?? 'An unexpected error occurred.',
      },
    }
  }
}