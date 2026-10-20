// lib/types/admin/students/edit/student.types.ts
// ─────────────────────────────────────────────────────────────────────────────
// Domain types for the student edit feature.
// Every field maps directly to Database['public']['Tables'][...]['Row'].
// No `any`, no `unknown`, no casts.
// ─────────────────────────────────────────────────────────────────────────────

import type { Database } from '@/lib/types/database'

// ── DB row aliases ────────────────────────────────────────────────────────────
export type ProfileRow = Database['public']['Tables']['profiles']['Row']
export type StudentRow = Database['public']['Tables']['students']['Row']

// ── Raw Supabase join shape ───────────────────────────────────────────────────
// Supabase returns the students!inner join as a single object (one-to-one FK).
// We type both sides: scalar and array, so the unwrapper can handle either.
export type RawStudentJoin =
  | Pick<StudentRow, 'student_id' | 'year_level' | 'program_id' | 'school' | 'target_exam'>
  | Pick<StudentRow, 'student_id' | 'year_level' | 'program_id' | 'school' | 'target_exam'>[]
  | null

export interface RawStudentProfileRow {
  full_name:  ProfileRow['full_name']   // string | null
  email:      ProfileRow['email']       // string
  role:       ProfileRow['role']        // UserRole
  students:   RawStudentJoin
}

// ── Application-level StudentData (post-transform) ────────────────────────────
export interface StudentData {
  full_name:   string
  email:       string
  student_id:  string | null
  year_level:  number | null
  program_id:  string | null
  school:      string | null
  target_exam: string | null
}

// ── Edit form (all strings — controlled <input> / <select>) ──────────────────
export interface EditStudentForm {
  full_name:   string
  student_id:  string
  program_id:  string
  year_level:  string
  school:      string
  target_exam: string
}

export type EditStudentFormErrors = Partial<Record<keyof EditStudentForm, string>> & {
  general?: string
}

// ── Profile update payload ────────────────────────────────────────────────────
// Strictly typed against ProfileRow['Update'] so stale fields cause compile errors.
export type ProfileUpdatePayload = Pick<
  Database['public']['Tables']['profiles']['Update'],
  'full_name'
>

// ── Student record update payload ─────────────────────────────────────────────
export type StudentUpdatePayload = Pick<
  Database['public']['Tables']['students']['Update'],
  'student_id' | 'program_id' | 'year_level' | 'school' | 'target_exam'
>