// lib/services/auth/index.ts
// ─────────────────────────────────────────────────────────────────────────────
// Client-side auth service.
// signInWithId now uses detectRoleFromId as a local fast-path for the redirect
// URL, while the server-resolved role from the DB remains the source of truth
// for Supabase auth. The two should always agree.
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from '@/lib/supabase/client'
import { normaliseId } from '@/lib/utils/auth/'
import { getDashboardByRole } from '@/lib/auth/routing'
import type {
  AuthResult,
  ResolveUserResult,
  SendOtpResult,
  VerifyOtpResult,
  ProgramCode,
  YearLevel,
} from '@/lib/types/auth/'

// ── resolveUserById ───────────────────────────────────────────────────────────

export async function resolveUserById(rawId: string): Promise<ResolveUserResult> {
  try {
    const res = await fetch('/api/auth/resolve-user-by-id', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id: normaliseId(rawId) }),
    })
    return (await res.json()) as ResolveUserResult
  } catch {
    return { found: false, error: 'Network error. Please try again.' }
  }
}

// ── signInWithId ──────────────────────────────────────────────────────────────
/**
 * 1. Resolve the ID → email via the server API (uses service role key safely).
 * 2. Sign in with email + password via Supabase.
 * 3. Resolve canonical role from profiles.role and redirect.
 */
export async function signInWithId(rawId: string, password: string): Promise<AuthResult> {
  const normalizedId = normaliseId(rawId)

  const resolved = await resolveUserById(normalizedId)

  if (!resolved.found) {
    return { success: false, error: resolved.error }
  }

  const supabase = createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email: resolved.email,
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

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single()

  if (profileError || !profile) {
    return { success: false, error: 'Could not resolve your account role.' }
  }

  const redirectTo = getDashboardByRole(profile.role)

  return { success: true, redirectTo }
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

    const result = (await res.json()) as { success: boolean; error?: string }

    if (!result.success) {
      console.warn('[signUpStudent] create-profile warning:', result.error)
    }
  } catch (err) {
    console.warn('[signUpStudent] create-profile network error:', err)
  }

  return { success: true, redirectTo: '/signup-success' }
}

// ── signInWithGoogle ──────────────────────────────────────────────────────────

export async function signInWithGoogle(): Promise<AuthResult> {
  const supabase = createClient()
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options:  {
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
    options:  {
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

// ── sendOtp / verifyOtp ───────────────────────────────────────────────────────
// Kept for future use. NOT called in the current email-only flow.

export async function sendOtp(email: string): Promise<SendOtpResult> {
  try {
    const res = await fetch('/api/auth/send-otp', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email }),
    })
    return (await res.json()) as SendOtpResult
  } catch {
    return { sent: false, error: 'Network error. Please try again.' }
  }
}

export async function verifyOtp(email: string, token: string): Promise<VerifyOtpResult> {
  try {
    const res = await fetch('/api/auth/verify-otp', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, token }),
    })
    return (await res.json()) as VerifyOtpResult
  } catch {
    return { verified: false, error: 'Network error. Please try again.' }
  }
}
