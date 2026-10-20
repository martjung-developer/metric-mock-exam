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
  emailConfirmationRequired?: boolean
}

type ResolveUserResult = {
  found: boolean
  email?: string
  error?: string
}

type YearLevel = number | string
import type { Database } from '@/lib/types/database'

type ProfileRow = Database['public']['Tables']['profiles']['Row']
type SignupProgram = Pick<
  Database['public']['Tables']['programs']['Row'],
  'id' | 'code' | 'name' | 'full_name' | 'major' | 'years' | 'school_id'
>

function savePendingSignup(data: Record<string, unknown>) {
  if (typeof window === 'undefined') { return }
  const value = JSON.stringify(data)
  localStorage.setItem('signup_data', value)
  document.cookie = `pending_signup=${encodeURIComponent(value)}; path=/; max-age=86400; samesite=lax`
}

function clearPendingSignup() {
  if (typeof window === 'undefined') { return }
  localStorage.removeItem('signup_data')
  document.cookie = 'pending_signup=; path=/; max-age=0; samesite=lax'
}

// ── resolveUserById ───────────────────────────────────────────────────────────

export async function resolveUserById(rawId: string): Promise<ResolveUserResult> {
  try {
    const res = await fetch('/api/auth/resolve-user-by-id', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id: normaliseId(rawId) }),
    })

    const payload = (await res.json()) as ResolveUserResult
    if (!res.ok) {
      return { found: false, error: payload.error ?? `Server error: ${res.status}` }
    }

    return payload
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

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
  if (sessionError || !sessionData.session) {
    return { success: false, error: 'Could not confirm your session. Please try again.' }
  }

  return { success: true, redirectTo: getDashboardByRole(profile.role) }
}

// ── signUpStudent ─────────────────────────────────────────────────────────────

export async function signUpStudent(
  studentId:   string,
  fullName:    string,
  email:       string,
  password:    string,
  program:     SignupProgram,
  yearLevel:   YearLevel,
  phone?:      string,
): Promise<AuthResult> {
  const supabase = createClient()
  const pendingSignup = {
    studentId: normaliseId(studentId),
    fullName: fullName.trim(),
    userEmail: email,
    programId: program.id,
    programCode: program.code,
    schoolId: program.school_id,
    yearLevel: Number(yearLevel),
    phone: phone?.trim() ?? '',
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name:    fullName.trim(),
        role:         'student' as const,
      },
      emailRedirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`,
    },
  })

  if (error)      { return { success: false, error: error.message } }
  if (!data.user) { return { success: false, error: 'Account creation failed. Please try again.' } }
  savePendingSignup(pendingSignup)
  if (!data.session) {
    return { success: true, emailConfirmationRequired: true }
  }

  // Create student profile row via service-role API route
  // Errors here are non-fatal — the user can still log in and we retry on
  // first dashboard load. Warn but do not surface to the user.
  try {
    const res = await fetch('/api/auth/create-profile', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        ...pendingSignup,
        userId: data.user.id,
      }),
    })

    if (!res.ok) {
      const payload = (await res.json()) as { error?: string }
      console.error('[signUpStudent] create-profile non-ok:', payload.error)
      return {
        success: false,
        error: payload.error ?? 'Account created but profile setup failed. Please contact support.',
      }
    }
    clearPendingSignup()
  } catch (err) {
    console.error('[signUpStudent] create-profile network error:', err)
    return {
      success: false,
      error: 'Account created but profile setup failed. Please contact support.',
    }
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
  if (typeof window !== 'undefined') {
    window.location.href = '/api/auth/signout'
  }
}

// ── sendOtp ───────────────────────────────────────────────────────────────────

export async function sendOtp(email: string): Promise<AuthResult> {
  const supabase = createClient()
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
  })
  if (error) {
    return { success: false, error: error.message }
  }
  return { success: true }
}

// ── verifyOtp ─────────────────────────────────────────────────────────────────

export async function verifyOtp(email: string, token: string): Promise<AuthResult> {
  const supabase = createClient()
  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'signup',
  })
  if (error) {
    return { success: false, error: error.message }
  }
  return { success: true }
}