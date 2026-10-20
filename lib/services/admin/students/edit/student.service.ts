// lib/services/admin/students/edit/student.service.ts
// ─────────────────────────────────────────────────────────────────────────────
// All Supabase I/O for student CRUD.
// Rules:
//  • Uses .returns<T>() on every query — no `as`, `any`, or `unknown`.
//  • Returns typed outcome objects (discriminated union) — never throws.
//  • Transformers live in mappers.ts; this layer is pure I/O.
// ─────────────────────────────────────────────────────────────────────────────

import type { SupabaseClient }        from '@supabase/supabase-js'
import type { Database }              from '@/lib/types/database'
import type {
  RawStudentProfileRow,
  ProfileUpdatePayload,
  StudentUpdatePayload,
} from '@/lib/types/admin/students/edit/student.types'

type DB = SupabaseClient<Database>

// ── Outcome types ─────────────────────────────────────────────────────────────

export interface ServiceSuccess<T> { ok: true;  data: T    }
export interface ServiceFailure    { ok: false; message: string }
export type ServiceOutcome<T> = ServiceSuccess<T> | ServiceFailure

// ── getStudentById ────────────────────────────────────────────────────────────

export async function getStudentById(
  supabase:  DB,
  studentId: string,
): Promise<ServiceOutcome<RawStudentProfileRow>> {
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      full_name, email, role,
      students!inner (
        student_id, year_level, program_id, school, target_exam
      )
    `)
    .eq('id', studentId)
    .eq('role', 'student')
    .single()
    .returns<RawStudentProfileRow>()

  if (error || !data) {
    return {
      ok:      false,
      message: error?.message ?? 'Student not found.',
    }
  }

  return { ok: true, data }
}

// ── updateStudentProfile ──────────────────────────────────────────────────────

export async function updateStudentProfile(
  supabase:   DB,
  studentId:  string,
  payload:    ProfileUpdatePayload,
): Promise<ServiceOutcome<null>> {
  const { error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', studentId)

  if (error) {return { ok: false, message: `Failed to update profile: ${error.message}` }}
  return { ok: true, data: null }
}

// ── updateStudentRecord ───────────────────────────────────────────────────────

export async function updateStudentRecord(
  supabase:   DB,
  studentId:  string,
  payload:    StudentUpdatePayload,
): Promise<ServiceOutcome<null>> {
  const { error } = await supabase
    .from('students')
    .update(payload)
    .eq('id', studentId)

  if (error) {return { ok: false, message: `Failed to update student record: ${error.message}` }}
  return { ok: true, data: null }
}