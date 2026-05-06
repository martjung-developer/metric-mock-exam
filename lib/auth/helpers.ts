// lib/auth/helpers.ts
// Server-side helpers — import only in Server Components / Route Handlers.

import { createClient }    from '@/lib/supabase/server'
import { redirect }        from 'next/navigation'
import type { Profile, StudentProfile, UserRole } from '@/lib/types/auth'
import { getDashboardByRole, canManageContent }   from '@/lib/types/auth'

function isInvalidRefreshTokenError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false
  }
  const message = error.message.toLowerCase()
  return (
    message.includes('invalid refresh token') &&
    message.includes('refresh token not found')
  )
}

// ── Get current user ──────────────────────────────────────────────────────────
export async function getUser() {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) {return null}
    return user
  } catch (error) {
    if (isInvalidRefreshTokenError(error)) {
      return null
    }
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

  if (error || !data) {return null}
  return data as Profile
}

// ── Get student+profile joined row ────────────────────────────────────────────
// Works for both 'student' and 'faculty' roles since both have students rows.
export async function getStudentProfile(userId: string): Promise<StudentProfile | null> {
  const supabase = await createClient()

  type StudentRow = {
    student_id:  string | null
    school:      string | null
    year_level:  number | null
    target_exam: string | null
    program_id:  string | null
    school_id:   string | null
  }

  type ProfileWithStudents = {
    id:         string
    email:      string
    full_name:  string | null
    role:       string
    avatar_url: string | null
    created_at: string
    updated_at: string
    students:   StudentRow | StudentRow[] | null
  }

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

  if (error || !rawData) {return null}

  const data = rawData as unknown as ProfileWithStudents

  const studentRow: StudentRow | null = Array.isArray(data.students)
    ? (data.students[0] ?? null)
    : data.students

  return {
    id:          data.id,
    email:       data.email,
    full_name:   data.full_name,
    role:        data.role as UserRole,
    avatar_url:  data.avatar_url,
    created_at:  data.created_at,
    updated_at:  data.updated_at,
    student_id:  studentRow?.student_id  ?? null,
    school:      studentRow?.school      ?? null,
    year_level:  studentRow?.year_level  ?? null,
    target_exam: studentRow?.target_exam ?? null,
    program_id:  studentRow?.program_id  ?? null,
    school_id:   studentRow?.school_id   ?? null,
  }
}

// ── Require auth ──────────────────────────────────────────────────────────────
export async function requireAuth() {
  const user = await getUser()
  if (!user) {redirect('/login')}
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

// ── Require faculty ───────────────────────────────────────────────────────────
export async function requireFaculty() {
  return requireRole(['faculty', 'admin'])
}

// ── Require admin ─────────────────────────────────────────────────────────────
export async function requireAdmin() {
  return requireRole(['admin'])
}

// ── Require content management access ────────────────────────────────────────
// faculty + admin can manage questions and exams
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
  const user = await getUser()
  if (!user) {return}

  const profile = await getProfile(user.id)
  redirect(getDashboardByRole(profile?.role ?? 'student'))
}
