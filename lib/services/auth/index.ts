// lib/services/auth/index.ts
// ─────────────────────────────────────────────────────────────────────────────
// Client-side auth service layer.
//
// signInWithId flow:
//   1. POST /api/auth/resolve-user-by-id  → get email from ID
//   2. supabase.auth.signInWithPassword   → create session
//   3. profiles.role                      → canonical role
//   4. getDashboardByRole                 → redirect path
//
// signUpStudent flow:
//   1. supabase.auth.signUp               → create auth user
//   2. POST /api/auth/create-profile      → insert students row (service role)
//
// Social auth delegates entirely to Supabase OAuth.
// ─────────────────────────────────────────────────────────────────────────────
import { createClient }       from '@/lib/supabase/client'
import { normaliseId }        from '@/lib/utils/auth'
import { getDashboardByRole } from '@/lib/auth/routing'
type AuthResult = {
  success: boolean
  error?: string
  redirectTo?: string
}

type ResolveUserResult = {
  found: boolean
  email?: string
  error?: string
}

type ProgramCode = string
type YearLevel = number | string
import type { Database } from '@/lib/types/database'

type ProfileRow = Database['public']['Tables']['profiles']['Row']

// ── resolveUserById ───────────────────────────────────────────────────────────

export async function resolveUserById(rawId: string): Promise<ResolveUserResult> {
  try {
    const res = await fetch('/api/auth/resolve-user-by-id', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id: normaliseId(rawId) }),
    })

    if (!res.ok) {
      return { found: false, error: `Server error: ${res.status}` }
    }

    return (await res.json()) as ResolveUserResult
  } catch {
    return { found: false, error: 'Network error. Please try again.' }
  }
}

// ── signInWithId ──────────────────────────────────────────────────────────────

export async function signInWithId(
  rawId:    string,
  password: string,
): Promise<AuthResult> {
  const normalizedId = normaliseId(rawId)
  const resolved     = await resolveUserById(normalizedId)

  if (!resolved.found || !resolved.email) {
    return { success: false, error: resolved.error ?? 'ID not found.' }
  }

  const supabase = createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email:    resolved.email,
    password,
  })

  if (error || !data.user) {
    const msg = error?.message ?? ''
    return {
      success: false,
      error: msg.toLowerCase().includes('invalid login credentials')
        ? 'Incorrect password.'
        : (msg || 'Sign-in failed.'),
    }
  }

  // Single minimal query — no select("*")
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single() as { data: Pick<ProfileRow, 'role'> | null; error: unknown }

  if (profileError || !profile) {
    return { success: false, error: 'Could not resolve your account role.' }
  }

  return { success: true, redirectTo: getDashboardByRole(profile.role) }
}

// ── signUpStudent ─────────────────────────────────────────────────────────────

export async function signUpStudent(
  studentId:   string,
  fullName:    string,
  email:       string,
  password:    string,
  programCode: ProgramCode,
  yearLevel:   YearLevel,
  phone?:      string,
): Promise<AuthResult> {
  const supabase = createClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        student_id:   normaliseId(studentId),
        full_name:    fullName.trim(),
        role:         'student' as const,
        program_code: programCode,
        year_level:   yearLevel,
        phone:        phone?.trim() ?? '',
      },
      emailRedirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`,
    },
  })

  if (error)      { return { success: false, error: error.message } }
  if (!data.user) { return { success: false, error: 'Account creation failed. Please try again.' } }

  // Create student profile row via service-role API route
  // Errors here are non-fatal — the user can still log in and we retry on
  // first dashboard load. Warn but do not surface to the user.
  try {
    const res = await fetch('/api/auth/create-profile', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        studentId:   normaliseId(studentId),
        fullName:    fullName.trim(),
        programCode,
        yearLevel:   String(yearLevel),
        phone:       phone?.trim() ?? '',
      }),
    })

    if (!res.ok) {
      const payload = (await res.json()) as { error?: string }
      console.warn('[signUpStudent] create-profile non-ok:', payload.error)
    }
  } catch (err) {
    console.warn('[signUpStudent] create-profile network error:', err)
  }

  return { success: true }
}

// ── signInWithGoogle ──────────────────────────────────────────────────────────

export async function signInWithGoogle(): Promise<AuthResult> {
  const supabase = createClient()
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: typeof window !== 'undefined'
        ? `${window.location.origin}/auth/callback`
        : '/auth/callback',
    },
  })
  if (error) { return { success: false, error: error.message } }
  return { success: true, redirectTo: '/auth/callback' }
}

// ── signInWithFacebook ────────────────────────────────────────────────────────

export async function signInWithFacebook(): Promise<AuthResult> {
  const supabase = createClient()
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'facebook',
    options: {
      redirectTo: typeof window !== 'undefined'
        ? `${window.location.origin}/auth/callback`
        : '/auth/callback',
    },
  })
  if (error) { return { success: false, error: error.message } }
  return { success: true, redirectTo: '/auth/callback' }
}

// ── signOut ───────────────────────────────────────────────────────────────────

export async function signOut(): Promise<void> {
  const supabase = createClient()
  await supabase.auth.signOut()
}