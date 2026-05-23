// types/admin/exams/exam.types.ts
// ─────────────────────────────────────────────────────────────────────────────
// All domain shapes for the exams feature.
// Derived from Database['public']['Tables'][...]['Row'] — no `any`, no casts.
// ─────────────────────────────────────────────────────────────────────────────

import type { Database } from '@/lib/types/database'
import type { ExamType } from '@/lib/types/database'

// ── Re-export for convenience ─────────────────────────────────────────────────
export type { ExamType }

// ── Raw DB row aliases ────────────────────────────────────────────────────────
export type ExamRow          = Database['public']['Tables']['exams']['Row']
export type ExamUpdateRow    = Database['public']['Tables']['exams']['Update']
export type QuestionRow      = Database['public']['Tables']['questions']['Row']
export type AssignmentRow    = Database['public']['Tables']['exam_assignments']['Row']
export type ProgramRow       = Database['public']['Tables']['programs']['Row']
export type CategoryRow      = Database['public']['Tables']['exam_categories']['Row']

// ── Slim projections (only selected columns) ──────────────────────────────────
export type ProgramOption  = Pick<ProgramRow, 'id' | 'code' | 'name'>
export type CategoryOption = Pick<CategoryRow, 'id' | 'name'>

// ── The raw Supabase join shape returned by the exams query ───────────────────
// Supabase returns joined rows as `T | T[] | null` depending on relationship type.
// We model both sides to narrow safely in transformers.
export type RawCategoryJoin =
  | Pick<CategoryRow, 'id' | 'name' | 'icon'>
  | Pick<CategoryRow, 'id' | 'name' | 'icon'>[]
  | null

export type RawProgramJoin =
  | ProgramOption
  | ProgramOption[]
  | null

// The full raw exam shape from the joined query
export interface RawExamRow {
  id:               string
  title:            string
  description:      string | null
  duration_minutes: number
  total_points:     number
  passing_score:    number
  is_published:     boolean
  approval_status:  string | null
  review_notes:     string | null
  exam_type:        string | null
  created_at:       string
  exam_categories:  RawCategoryJoin
  programs:         RawProgramJoin
}

// ── Application-level Exam shape (post-transform) ─────────────────────────────
export interface Exam {
  id:               string
  title:            string
  description:      string | null
  category:         CategoryOption | null
  program:          ProgramOption  | null
  exam_type:        ExamType
  duration_minutes: number
  total_points:     number
  passing_score:    number
  is_published:     boolean
  approval_status:  string | null
  review_notes:     string | null
  question_count:   number
  assigned_count:   number
  created_at:       string
}

// ── Edit form state ───────────────────────────────────────────────────────────
export interface EditForm {
  title:            string
  description:      string
  category_id:      string
  program_id:       string
  exam_type:        ExamType
  duration_minutes: string   // string for controlled <input type="number">
  total_points:     string
  passing_score:    string
  is_published:     boolean
}

export type EditFormErrors = Partial<Record<keyof EditForm, string>>

// ── Payload sent to Supabase on update ───────────────────────────────────────
// Strictly typed against ExamUpdateRow so the compiler catches stale fields.
export type ExamUpdatePayload = Required<
  Pick<
    ExamUpdateRow,
    | 'title'
    | 'description'
    | 'category_id'
    | 'program_id'
    | 'exam_type'
    | 'duration_minutes'
    | 'total_points'
    | 'passing_score'
    | 'is_published'
    | 'updated_at'
  >
>

// ── Filter state ──────────────────────────────────────────────────────────────
export interface ExamFilters {
  search:    string
  category:  string         // category name or 'All Categories'
  status:    'all' | 'published' | 'draft'
  examType:  ExamType | 'all'
  programId: string         // program id or 'all'
}

export const INITIAL_FILTERS: ExamFilters = {
  search:    '',
  category:  'All Categories',
  status:    'all',
  examType:  'all',
  programId: 'all',
}

// ── Toast ─────────────────────────────────────────────────────────────────────
export interface ToastState {
  message: string
  type:    'success' | 'error'
}
