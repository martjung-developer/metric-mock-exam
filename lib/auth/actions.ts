// app/lib/auth/actions.ts
'use server'

import type { AuthError } from '@supabase/supabase-js'
import { redirect }       from 'next/navigation'
import { createClient }   from '@/lib/supabase/server'
import type { SignupRole, UserRole } from '@/lib/types/auth'
import { getDashboardByRole }        from '@/lib/types/auth'

export type AuthResult =
  | { success: true;  redirectTo: string }
  | { success: false; error: string }

function normalizeRole(role: string): UserRole {
  if (role === 'faculty') { return 'faculty' }
  if (role === 'student') { return 'student' }
  if (role === 'admin')   { return 'admin' }
  return 'student'
}

export async function signUp(
  fullName:   string,
  email:      string,
  password:   string,
  signupRole: SignupRole,
): Promise<AuthResult> {
  const supabase       = await createClient()
  const normalizedRole = normalizeRole(signupRole)

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role:      normalizedRole,
      },
    },
  })

  if (error) { return { success: false, error: formatError(error) } }
  return { success: true, redirectTo: getDashboardByRole(normalizedRole) }
}

export async function signIn(
  email:    string,
  password: string,
): Promise<AuthResult> {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) { return { success: false, error: formatError(error) } }

  const rawRole = (data.user?.user_metadata?.['role'] ?? 'student') as string
  const role    = normalizeRole(rawRole)

  return { success: true, redirectTo: getDashboardByRole(role) }
}

export async function signOut(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function resendVerification(email: string): Promise<AuthResult> {
  const supabase = await createClient()
  const { error } = await supabase.auth.resend({ type: 'signup', email })
  if (error) { return { success: false, error: formatError(error) } }
  return { success: true, redirectTo: '/verify-email' }
}

export async function verifyOtp(
  email: string,
  token: string,
): Promise<AuthResult> {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.verifyOtp({
    email, token, type: 'signup',
  })

  if (error) { return { success: false, error: formatError(error) } }

  const role = normalizeRole(data.user?.user_metadata?.['role'] ?? 'student')

  // Only students get a row in the students table via this path.
  // (The primary student insert path is the create-profile API route called
  //  from signUpStudent in the client service.)
  if (role === 'student' && data.user) {
    const { error: insertError } = await supabase
      .from('students')
      .insert({ id: data.user.id })

    // Ignore duplicate-key errors (row already exists from create-profile call)
    if (insertError && !insertError.message.includes('duplicate')) {
      return { success: false, error: insertError.message }
    }
  }

  return { success: true, redirectTo: getDashboardByRole(role) }
}

function formatError(error: AuthError): string {
  switch (error.message) {
    case 'Invalid login credentials':
      return 'Incorrect email or password. Please try again.'
    case 'Email not confirmed':
      return 'Please verify your email before logging in.'
    case 'User already registered':
      return 'An account with this email already exists.'
    case 'Password should be at least 6 characters.':
      return 'Password must be at least 6 characters.'
    case 'Email rate limit exceeded':
      return 'Too many attempts. Please wait a few minutes and try again.'
    case 'Token has expired or is invalid':
      return 'Your verification code has expired. Please request a new one.'
    default:
      return error.message ?? 'Something went wrong. Please try again.'
  }
}