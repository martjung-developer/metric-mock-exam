// lib/types/admin/students/create/student.types.ts

import type { Database } from '@/lib/types/database'

// ── Re-export DB row helpers for this domain ──────────────────────────────────

export type ProfileRow = Database['public']['Tables']['profiles']['Row']
export type StudentRow = Database['public']['Tables']['students']['Row']

// ── Form state ────────────────────────────────────────────────────────────────

export interface StudentFormData {
  full_name:  string
  email:      string
  password:   string
  student_id: string
  program_id: string
  year_level: string   // kept as string in the form; parsed to number on submit
  school:     string
}

export const EMPTY_STUDENT_FORM: StudentFormData = {
  full_name:  '',
  email:      '',
  password:   '',
  student_id: '',
  program_id: '',
  year_level: '',
  school:     '',
}

// ── Validation errors ─────────────────────────────────────────────────────────

export interface StudentFormErrors {
  full_name?:  string
  email?:      string
  password?:   string
  student_id?: string
  program_id?: string
  year_level?: string
  general?:    string
}

// ── Typed error codes (bonus: structured errors instead of plain strings) ─────

export type StudentErrorCode =
  | 'EMAIL_DUPLICATE'
  | 'AUTH_SIGNUP_FAILED'
  | 'PROFILE_UPSERT_FAILED'
  | 'STUDENT_INSERT_FAILED'
  | 'UNKNOWN'

export interface StudentServiceError {
  code:    StudentErrorCode
  message: string
}

// ── Payload sent to the service layer ────────────────────────────────────────

export interface StudentCreatePayload {
  full_name:  string
  email:      string
  password:   string
  student_id: string | null
  program_id: string | null
  year_level: number | null
  school:     string | null
}

// ── Result returned by createStudent() ───────────────────────────────────────

export type CreateStudentResult =
  | { success: true;  userId: string }
  | { success: false; error: StudentServiceError }