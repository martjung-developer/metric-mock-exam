// lib/types/admin/exams/detail/exam.types.ts
// All types for the Admin Exam Detail page.
// Derived from Supabase-generated Database types where applicable.

import type { Database } from '@/lib/types/database'
import type { ExamType }  from '@/lib/types/database'

// ── Supabase Row Aliases ────────────────────────────────────────────────────

export type ExamRow         = Database['public']['Tables']['exams']['Row']
export type ExamUpdate      = Database['public']['Tables']['exams']['Update']
export type CategoryRow     = Database['public']['Tables']['exam_categories']['Row']
export type ProgramRow      = Database['public']['Tables']['programs']['Row']
export type QuestionRow     = Database['public']['Tables']['questions']['Row']
export type AssignmentRow   = Database['public']['Tables']['exam_assignments']['Row']
export type SubmissionRow   = Database['public']['Tables']['submissions']['Row']

// ── Projections (match .select() columns exactly) ───────────────────────────

export type CategoryOption = Pick<CategoryRow, 'id' | 'name'>
export type ProgramOption  = Pick<ProgramRow,  'id' | 'code' | 'name'>

// ── Raw Supabase join shape (from .select() with relations) ─────────────────
// Supabase returns joined rows as an object or an array — we handle both.

export interface ExamCategoryJoin {
  id:   string
  name: string
  icon: string | null
}

export interface ExamProgramJoin {
  id:   string
  code: string
  name: string
}

// The raw shape returned by our .select() query with relations.
// We keep this as a plain interface matching the DB columns + join shapes.
// No `unknown` or `any` — the join fields are typed as single objects
// because we use .single() on the query.
export interface ExamDetailRaw {
  id:               string
  title:            string
  description:      string | null
  duration_minutes: number
  total_points:     number
  passing_score:    number
  is_published:     boolean
  exam_type:        string | null   // DB stores as string; we narrow via safeExamType()
  created_at:       string
  updated_at:       string
  approval_status:  string | null
  review_notes:     string | null
  // Supabase may return these as a single object or wrapped array depending on
  // the join cardinality and client version. Mappers handle both shapes.
  exam_categories:  ExamCategoryJoin | ExamCategoryJoin[] | null
  programs:         ExamProgramJoin  | ExamProgramJoin[]  | null
}

// ── UI-Level Exam Shape ─────────────────────────────────────────────────────

export interface ExamDetail {
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
  question_count:   number
  assigned_count:   number
  submission_count: number
  avg_score:        number | null
  created_at:       string
  updated_at:       string
  approval_status:  string | null
  review_notes:     string | null
}

// ── Edit Form ───────────────────────────────────────────────────────────────
// All numeric fields are kept as strings (controlled inputs).
// Parsed to numbers in the service layer before the Supabase update.

export interface EditForm {
  title:            string
  description:      string
  category_id:      string
  program_id:       string
  exam_type:        ExamType
  duration_minutes: string
  total_points:     string
  passing_score:    string
  is_published:     boolean
}

// Validation errors — only errored fields are present.
export type EditFormErrors = Partial<Record<keyof EditForm, string>>

// ── Exam Stats (from parallel count queries) ────────────────────────────────

export interface ExamStats {
  question_count:   number
  assigned_count:   number
  submission_count: number
  avg_score:        number | null
}

// ── Toast ───────────────────────────────────────────────────────────────────

export interface ToastState {
  message: string
  type:    'success' | 'error'
}

// ── Hook Return Shapes ──────────────────────────────────────────────────────

export interface UseExamDetailReturn {
  exam:        ExamDetail | null
  categories:  CategoryOption[]
  programs:    ProgramOption[]
  loading:     boolean
  error:       string | null
  setExam:     (updater: (prev: ExamDetail | null) => ExamDetail | null) => void
}

export interface UseEditExamReturn {
  showEdit:     boolean
  editForm:     EditForm | null
  editErrors:   EditFormErrors
  editSaving:   boolean
  toast:        ToastState | null
  openEdit:     () => void
  closeEdit:    () => void
  setEditField: <K extends keyof EditForm>(field: K, value: EditForm[K]) => void
  saveEdit:     () => Promise<void>
  clearToast:   () => void
}
