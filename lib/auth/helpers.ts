// lib/auth/helpers.ts
// Server-side helpers — import only in Server Components / Route Handlers.

import { createClient }    from '@/lib/supabase/server'
import { redirect }        from 'next/navigation'
import type { Profile, StudentProfile, UserRole } from '@/lib/types/auth'
import { getDashboardByRole, canManageContent }   from '@/lib/types/auth'

// ── Stale-token detection ─────────────────────────────────────────────────────

function isInvalidRefreshTokenError(error: unknown): boolean {
  if (!(error instanceof Error)) { return false }
  const msg = error.message.toLowerCase()
  return msg.includes('invalid refresh token') || msg.includes('refresh token not found')
}

// ── Get current user ──────────────────────────────────────────────────────────

export async function getUser() {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) { return null }
    return user
  } catch (error) {
    if (isInvalidRefreshTokenError(error)) { return null }
    throw error
  }
}

// ── Get profile row ───────────────────────────────────────────────────────────

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, avatar_url, created_at, updated_at')
    .eq('id', userId)
    .single()

  if (error || !data) { return null }

  return {
    id:         data.id,
    email:      data.email,
    full_name:  data.full_name ?? null,
    role:       data.role as UserRole,
    avatar_url: data.avatar_url ?? null,
    created_at: data.created_at ?? '',
    updated_at: data.updated_at ?? '',
  }
}

// ── Get student + profile joined row ─────────────────────────────────────────

export async function getStudentProfile(userId: string): Promise<StudentProfile | null> {
  const supabase = await createClient()

  const { data: rawData, error } = await supabase
    .from('profiles')
    .select(`
      id, email, full_name, role, avatar_url, created_at, updated_at,
      students (
        student_id, school, year_level, target_exam, program_id, school_id
      )
    `)
    .eq('id', userId)
    .single()

  if (error || !rawData) { return null }

  // students can be returned as array (one-to-many join) or null
  const studentsRaw = rawData.students
  const studentRow = Array.isArray(studentsRaw)
    ? (studentsRaw[0] ?? null)
    : (studentsRaw ?? null)

  type StudentRow = typeof studentRow & {
    student_id:  string | null
    school:      string | null
    year_level:  number | null
    target_exam: string | null
    program_id:  string | null
    school_id:   string | null
  }

  const s = studentRow as StudentRow | null

  return {
    id:          rawData.id,
    email:       rawData.email,
    full_name:   rawData.full_name ?? null,
    role:        rawData.role as UserRole,
    avatar_url:  rawData.avatar_url ?? null,
    created_at:  rawData.created_at ?? '',
    updated_at:  rawData.updated_at ?? '',
    student_id:  s?.student_id  ?? null,
    school:      s?.school      ?? null,
    year_level:  s?.year_level  ?? null,
    target_exam: s?.target_exam ?? null,
    program_id:  s?.program_id  ?? null,
    school_id:   s?.school_id   ?? null,
  }
}

// ── Require auth ──────────────────────────────────────────────────────────────

export async function requireAuth() {
  const user = await getUser()
  if (!user) { redirect('/login') }
  return user
}

// ── Require role ──────────────────────────────────────────────────────────────

export async function requireRole(allowedRoles: UserRole[]) {
  const user    = await requireAuth()
  const profile = await getProfile(user.id)

  if (!profile || !allowedRoles.includes(profile.role)) {
    redirect('/unauthorized')
  }

  return { user, profile }
}

// ── Require faculty (faculty + admin) ─────────────────────────────────────────

export async function requireFaculty() {
  return requireRole(['faculty', 'admin'])
}

// ── Require admin ─────────────────────────────────────────────────────────────

export async function requireAdmin() {
  return requireRole(['admin'])
}

// ── Require content management access ────────────────────────────────────────

export async function requireContentAccess() {
  const user    = await requireAuth()
  const profile = await getProfile(user.id)

  if (!profile || !canManageContent(profile.role)) {
    redirect('/unauthorized')
  }

  return { user, profile }
}

// ── Redirect already-authenticated users ─────────────────────────────────────

export async function redirectIfAuthenticated() {
  const supabase = await createClient()
  let signOutRedirect = false
  let userId: string | null = null

  try {
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error) {
      if (isInvalidRefreshTokenError(error)) {
        signOutRedirect = true
      }
      return
    }

    userId = user?.id ?? null
  } catch (error) {
    if (isInvalidRefreshTokenError(error)) {
      signOutRedirect = true
    }
  }

  if (signOutRedirect) {
    redirect('/api/auth/signout')
  }

  if (!userId) { return }

  const profile = await getProfile(userId)
  redirect(getDashboardByRole(profile?.role ?? 'student'))
}
