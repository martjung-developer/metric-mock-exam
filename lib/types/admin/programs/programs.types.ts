/**
 * types/admin/programs/programs.types.ts
 *
 * All domain types for the Programs admin page.
 * Sourced from Database['public']['Tables'] — no `any`, no unsafe casting.
 */

import type { Database } from '@/lib/types/database'

// ── Raw Supabase row aliases ──────────────────────────────────────────────────

export type ProgramRow = Database['public']['Tables']['programs']['Row']
export type ExamRow    = Database['public']['Tables']['exams']['Row']
type SchoolJoin = {
  code: string
  name: string
  full_name: string
}

export type ProgramRowWithSchool = ProgramRow & {
  school?: SchoolJoin | SchoolJoin[] | null
  schools?: SchoolJoin | SchoolJoin[] | null
}

// ── Subset of ExamRow used in program lists ───────────────────────────────────

export type ProgramExamSummary = Pick<
  ExamRow,
  'id' | 'title' | 'is_published' | 'exam_type'
>

// ── Student as it surfaces after the join ────────────────────────────────────
// Derived from `students` joined with `profiles` (inner join).
// We only carry the fields we render.

export interface StudentRow {
  id:         string
  full_name:  string | null
  email:      string
  year_level: number | null
}

// ── Internal shape returned by the students query before mapping ─────────────
// Represents the raw Supabase join result for students ⟶ profiles.
// Kept here so the service layer is fully typed without `any`.

export interface RawStudentJoin {
  id:         string
  program_id: string | null
  year_level: number | null
  profiles: {
    id:        string
    full_name: string | null
    email:     string
  }
}

// ── Internal shape returned by the exams query before mapping ────────────────

export type RawExamRow = ProgramExamSummary & { program_id: string | null }

// ── Joined / display type used throughout the UI ─────────────────────────────

export interface ProgramDisplay extends ProgramRow {
  studentCount: number
  examCount:    number
  students:     StudentRow[]
  exams:        ProgramExamSummary[]
  school_code: string | null
  school_name: string | null
  school_full_name: string | null
  departmentCode: string
}

// ── Filter / search state ─────────────────────────────────────────────────────

export interface ProgramFilters {
  search:    string
  filterDeg: string   // 'all' | any degree_type string
  department: string  // 'all' | department code
}

// ── Derived statistics shown in the stat strip ───────────────────────────────

export interface ProgramStats {
  total:    number
  students: number
  exams:    number
  active:   number   // programs with at least one student
}

// ── Inline description-edit state ────────────────────────────────────────────

export type EditingId = string | null   // prog.id  |  `modal-${prog.id}`  |  null

export interface DescriptionEditState {
  editingId:     EditingId
  editDesc:      string
  savingDesc:    boolean
  saveDescError: string
  saveDescOk:    boolean
}

// ── Service-layer return shapes ───────────────────────────────────────────────

export interface FetchAllProgramDataResult {
  programs: ProgramRowWithSchool[]
  students: RawStudentJoin[]
  exams:    RawExamRow[]
  error:    string | null
}

export interface UpdateDescriptionResult {
  error: string | null
}
