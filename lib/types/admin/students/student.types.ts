/**
 * lib/types/admin/students/student.types.ts
 *
 * All student domain types.
 * Derived from Database['public']['Tables'] — zero `any`, zero unsafe casting.
 */

import type { Database } from '@/lib/types/database'

// ── Raw Supabase row aliases ──────────────────────────────────────────────────

export type StudentDBRow  = Database['public']['Tables']['students']['Row']
export type ProfileDBRow  = Database['public']['Tables']['profiles']['Row']

// ── Raw joined query row ──────────────────────────────────────────────────────
//
// ⚠️  Unsafe cast justification (used once in the service layer):
//   Supabase's TypeScript SDK cannot statically resolve nested join shapes
//   from the generated schema type.  `profiles!inner(...)` and `programs(...)`
//   return `Json | null` at compile time.  We define `StudentRaw` to exactly
//   mirror the SELECT columns + joins we request, then cast at the data boundary
//   once.  This is safe as long as the query string matches this interface.

export interface StudentRaw {
  id:          string
  student_id:  string | null
  year_level:  number | null
  program_id:  string | null
  created_at:  string
  profiles: {
    full_name: string | null
    email:     string
    role:      string
  }
  programs: {
    id:   string
    code: string
    name: string
  } | null
}

// ── Display / UI type used throughout components ──────────────────────────────

export interface Students {
  id:           string
  full_name:    string | null
  email:        string
  student_id:   string | null
  year_level:   number | null
  created_at:   string
  program_id:   string | null
  program_code: string | null
  program_name: string | null
}

// ── Avatar colour shape ───────────────────────────────────────────────────────

export interface AvatarColor {
  bg:    string
  color: string
}

// ── Service-layer result shapes ───────────────────────────────────────────────

export interface FetchStudentsResult {
  students: Students[]
  error:    string | null
}

export interface DeleteStudentResult {
  error: string | null
}

// ── Form types ────────────────────────────────────────────────────────────────

export interface StudentFormData {
  student_id: string
  year_level: number
  program_id: string
  full_name: string
  email: string
  school: string
}

export interface StudentFormErrors {
  student_id?: string
  year_level?: string
  program_id?: string
  full_name?: string
  email?: string
  school?: string
}

// ── Empty form constant ───────────────────────────────────────────────────────

export const EMPTY_STUDENT_FORM: StudentFormData = {
  student_id: '',
  year_level: 1,
  program_id: '',
  full_name: '',
  email: '',
  school: '',
}

export type StudentPayload = Database['public']['Tables']['students']['Insert']