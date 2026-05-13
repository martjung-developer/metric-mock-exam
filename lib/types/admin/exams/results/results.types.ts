// lib/types/admin/exams/results/results.types.ts
// ─────────────────────────────────────────────────────────────────────────────
// All domain shapes for the exam results feature.
// Extended with Attempt / StudentAttemptHistory for the multi-attempt feature.
// ─────────────────────────────────────────────────────────────────────────────

import type { Database } from '@/lib/types/database'

// ── DB row aliases ────────────────────────────────────────────────────────────
type AnalyticsRow  = Database['public']['Tables']['analytics']['Row']

// ── ResultStatus — narrower than SubmissionStatus ────────────────────────────
export type ResultStatus = 'reviewed' | 'released'

// ── Application-level Result (post-transform) ─────────────────────────────────
export interface StudentSummary {
  id:         string
  full_name:  string
  email:      string
  student_id: string | null
}

export interface Result {
  id:                 string
  student:            StudentSummary
  score:              number
  percentage:         number
  passed:             boolean
  submitted_at:       string
  time_spent_seconds: number
  status:             ResultStatus
}

// ── Attempt DTO ───────────────────────────────────────────────────────────────
// Represents one released attempt for a student.
export interface Attempt {
  /** Attempt number: 1, 2, or 3 */
  attempt_no:         number
  submission_id:      string
  score:              number
  percentage:         number
  passed:             boolean
  status:             ResultStatus
  submitted_at:       string
  time_spent_seconds: number
}

// ── ImprovementTrend ──────────────────────────────────────────────────────────
/** Direction of score change between the first and latest attempt. */
export type ImprovementTrend = 'up' | 'down' | 'flat' | 'single'

// ── StudentAttemptHistory DTO ─────────────────────────────────────────────────
// Aggregated view of one student's attempts for a specific exam.
export interface StudentAttemptHistory {
  student:          StudentSummary
  /** Attempts sorted by attempt_no ASC, max 3 entries */
  attempts:         Attempt[]
  /** The attempt with the highest percentage */
  bestAttempt:      Attempt
  /** The attempt with the highest attempt_no */
  latestAttempt:    Attempt
  /** Percentage-point delta from attempt 1 → latest (null if only 1 attempt) */
  improvementDelta: number | null
  improvementTrend: ImprovementTrend
}

// ── Aggregate Analytics ───────────────────────────────────────────────────────
export type AggregateAnalytics = Pick<
  AnalyticsRow,
  'total_attempts' | 'average_score' | 'highest_score' | 'lowest_score' | 'last_attempt_at'
>

// ── Filter state ──────────────────────────────────────────────────────────────
export type PassFilter   = 'all' | 'passed' | 'failed'
export type StatusFilter = ResultStatus | 'all'

export interface ResultFilters {
  search:       string
  passFilter:   PassFilter
  statusFilter: StatusFilter
}

export const INITIAL_FILTERS: ResultFilters = {
  search:       '',
  passFilter:   'all',
  statusFilter: 'all',
}

// ── Derived summary counts ────────────────────────────────────────────────────
export interface ResultSummary {
  total:               number
  passing:             number
  failing:             number
  passRate:            number
  released:            number
  reviewed:            number
  // Multi-attempt stats
  studentsWithMultipleAttempts: number
  averageImprovement:           number | null
  highestImprovement:           number | null
}

// ── Typed application error ───────────────────────────────────────────────────
export type ResultsErrorCode =
  | 'FETCH_SUBMISSIONS_FAILED'
  | 'FETCH_ANALYTICS_FAILED'

export interface ResultsError {
  code:    ResultsErrorCode
  message: string
}
