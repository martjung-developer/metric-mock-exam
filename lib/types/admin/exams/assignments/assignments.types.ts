/* lib/types/admin/exams/assignments/assignments.types.ts */

import type { Database } from '@/lib/types/database'

// ── Raw Supabase row aliases ──────────────────────────────────────────────────

export type ExamAssignmentRow = Database['public']['Tables']['exam_assignments']['Row']
export type ProfileRow        = Database['public']['Tables']['profiles']['Row']
export type StudentDBRow      = Database['public']['Tables']['students']['Row']
export type SubmissionRow     = Database['public']['Tables']['submissions']['Row']
export type ProgramDBRow      = Database['public']['Tables']['programs']['Row']

// ── Scoped subsets used after projection ─────────────────────────────────────

/** Only the columns we SELECT from `submissions` */
export type SubmissionProjection = Pick<
  SubmissionRow,
  'student_id' | 'status' | 'score' | 'percentage'
>

/** Only the columns we SELECT from `profiles` */
export type ProfileProjection = Pick<ProfileRow, 'id' | 'full_name' | 'email'>

/** Only the columns we SELECT from `students` */
export type StudentProjection = Pick<StudentDBRow, 'id' | 'student_id'>

/** Only the columns we SELECT from `programs` */
export type ProgramProjection = Pick<ProgramDBRow, 'id' | 'code' | 'name'>

// ── Joined raw shape from Supabase `exam_assignments` query ──────────────────
//
// ⚠️  Unsafe cast justification (in service layer):
//   Supabase infers foreign-key join results as `Json | null` or a union of
//   row | row[] because it cannot statically narrow the join shape from
//   the schema type alone.  We define `AssignmentQueryRow` to exactly mirror
//   the columns + join we request, then cast once at the boundary.  This is
//   safe as long as the SELECT string matches this interface.

export interface AssignmentQueryRow {
  id:          string
  student_id:  string | null
  program_id:  string | null
  assigned_at: string
  deadline:    string | null
  is_active:   boolean
  programs:    ProgramProjection | ProgramProjection[] | null
}

// ── Student join row (students + profiles!inner join) ────────────────────────

export interface StudentJoinRow {
  id:          string
  student_id:  string | null
  programs:    { code: string } | { code: string }[] | null
}

// ── Display / UI types ────────────────────────────────────────────────────────

/**
 * Canonical submission display statuses — a superset of the DB enum
 * that adds `not_started` for assignments with no submission yet.
 */
export type DisplaySubmissionStatus =
  | 'not_started'
  | 'in_progress'
  | 'submitted'
  | 'graded'

export interface AssignedStudent {
  id:         string
  full_name:  string
  email:      string
  student_id: string | null
}

/** The fully merged assignment shape used throughout the UI */
export interface Assignment {
  id:                string
  student:           AssignedStudent
  program_name:      string | null
  assignment_source: 'program' | 'manual'
  assigned_at:       string
  deadline:          string | null
  is_active:         boolean
  submission_status: DisplaySubmissionStatus
  score:             number | null
  percentage:        number | null
}

/** Program option shown in the assign-by-program dropdown */
export interface Program {
  id:   string
  code: string
  name: string
}

/** Student result returned from the search typeahead */
export interface StudentSearchResult {
  id:           string
  full_name:    string
  email:        string
  student_id:   string | null
  program_code: string | null
}

// ── Filter state ──────────────────────────────────────────────────────────────

export interface AssignmentFiltersState {
  search:       string
  statusFilter: DisplaySubmissionStatus | 'all'
}

// ── Service-layer return shapes ───────────────────────────────────────────────

export interface FetchAssignmentsResult {
  assignments: Assignment[]
  programs:    Program[]
  error:       string | null
}

export interface AssignStudentsPayload {
  examId:     string
  studentIds: string[]
  deadline:   string | null
}

export interface AssignProgramPayload {
  examId:     string
  programId:  string
  deadline:   string | null
  yearLevel?: number | null
}

export interface MutationResult {
  error: string | null
}

// ── Submission priority map type ──────────────────────────────────────────────

export type SubmissionStatusPriority = Record<string, number>
