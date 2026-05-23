// lib/types/admin/exams/submissions/submission.types.ts

import type { Database } from '@/lib/types/database'

// ── Re-exported enum ──────────────────────────────────────────────────────────
// FIX B: Pull directly from the database type — no manual union extension.
// database.ts now includes all 5 values: in_progress, submitted, graded,
// reviewed, released. This is the single source of truth.
export type SubmissionStatus = Database['public']['Enums']['submission_status']

export type GradingMode = 'auto' | 'manual'

// ── Raw shape assembled in-memory by submission.service.ts ───────────────────

export interface RawProfileJoin {
  id:        string
  full_name: string | null
  email:     string
}

export interface RawStudentJoin {
  student_id: string | null
  profiles:   RawProfileJoin | RawProfileJoin[] | null
}

export interface SubmissionRaw {
  id:                 string
  student_id:         string | null
  attempt_no:         number | null
  started_at:         string
  submitted_at:       string | null
  time_spent_seconds: number | null
  // FIX B: use the canonical SubmissionStatus type (not raw string)
  status:             SubmissionStatus
  score:              number | null
  percentage:         number | null
  passed:             boolean | null
  students:           RawStudentJoin | RawStudentJoin[] | null
}

// ── UI-facing domain model ────────────────────────────────────────────────────

export interface StudentSummary {
  id:         string
  full_name:  string
  email:      string
  student_id: string | null
}

export interface Submission {
  id:                 string
  student:            StudentSummary
  attempt_no:         number
  started_at:         string
  submitted_at:       string | null
  time_spent_seconds: number | null
  status:             SubmissionStatus
  score:              number | null
  percentage:         number | null
  passed:             boolean | null
}

// ── Service result wrapper ────────────────────────────────────────────────────

export type ServiceResult<T = void> =
  | { data: T;    error: null   }
  | { data: null; error: string }
