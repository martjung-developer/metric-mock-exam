// lib/utils/admin/students/edit/mappers.ts
// ─────────────────────────────────────────────────────────────────────────────
// Pure mapping functions — no side effects, fully unit-testable.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  RawStudentProfileRow,
  RawStudentJoin,
  StudentData,
  EditStudentForm,
} from '@/lib/types/admin/students/edit/student.types'

// ── unwrapStudents ────────────────────────────────────────────────────────────
// Supabase may return the FK join as a single object or an array.
// This narrows safely without any cast.

type StudentJoinItem = NonNullable<
  RawStudentJoin extends (infer U)[] ? U : RawStudentJoin
>

export function unwrapStudentJoin(raw: RawStudentJoin): StudentJoinItem | null {
  if (!raw) {return null}
  if (Array.isArray(raw)) {return raw[0] ?? null}
  return raw
}

// ── mapRawToStudentData ───────────────────────────────────────────────────────
// Maps the raw Supabase profile+students row to the clean StudentData shape.

export function mapRawToStudentData(raw: RawStudentProfileRow): StudentData {
  const st = unwrapStudentJoin(raw.students)
  return {
    full_name:   raw.full_name   ?? '',
    email:       raw.email,
    student_id:  st?.student_id  ?? null,
    year_level:  st?.year_level  ?? null,
    program_id:  st?.program_id  ?? null,
    school:      st?.school      ?? null,
    target_exam: st?.target_exam ?? null,
  }
}

// ── mapStudentToForm ──────────────────────────────────────────────────────────
// Maps StudentData to the EditStudentForm (all strings for controlled inputs).

export function mapStudentToForm(data: StudentData): EditStudentForm {
  return {
    full_name:   data.full_name   ?? '',
    student_id:  data.student_id  ?? '',
    program_id:  data.program_id  ?? '',
    year_level:  data.year_level !== null ? String(data.year_level) : '',
    school:      data.school      ?? '',
    target_exam: data.target_exam ?? '',
  }
}

// ── displayName ───────────────────────────────────────────────────────────────
// Derives the human-readable name for the page header.

export function getDisplayName(raw: RawStudentProfileRow): string {
  return raw.full_name ?? raw.email ?? 'Student'
}
