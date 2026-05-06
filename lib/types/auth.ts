// lib/types/auth.ts

// Keep faculty in the type since your DB CHECK constraint still has it
export type UserRole = 'student' | 'admin' | 'faculty'

export interface Profile {
  id:         string
  email:      string
  full_name:  string | null
  role:       UserRole
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface StudentProfile extends Profile {
  student_id:  string | null
  school:      string | null
  year_level:  number | null
  target_exam: string | null
  program_id:  string | null
  school_id:   string | null
}

export interface AuthUser {
  id:      string
  email:   string | undefined
  profile: Profile | null
}

// ── Role helpers ─────────────────────────────────────────

export const isAdmin   = (role: UserRole) => role === 'admin'
export const isStudent = (role: UserRole) => role === 'student'
export const isFaculty = (role: UserRole) => role === 'faculty'

export const canTakeExams      = (role: UserRole) => role === 'student'
export const canManageContent  = (role: UserRole) => role === 'admin' || role === 'faculty'

export function getDashboardByRole(role: UserRole): string {
  if (role === 'student') {return '/student/dashboard'}
  if (role === 'faculty') {return '/faculty/dashboard'}
  return '/admin/dashboard'
}

// ── Signup roles (UI only) ───────────────────────────────
// Faculty is the signup label, but stored as 'admin' in DB

export type SignupRole = 'student' | 'faculty' | 'admin'

export const SIGNUP_ROLES: {
  value:       SignupRole
  label:       string
  description: string
}[] = [
  {
    value:       'student',
    label:       'Student',
    description: 'Taking mock board exams to prepare for PRC licensure',
  },
  {
    value:       'faculty',
    label:       'Faculty',
    description: 'Managing question banks and review materials',
  },
  {
    value:       'admin',
    label:       'Admin',
    description: 'Managing school-level operations and user administration',
  },
]
