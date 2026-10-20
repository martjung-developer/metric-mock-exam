// lib/types/student/results/results.types.ts
import type { Database } from '@/lib/types/database'

// ── DB-derived row aliases ────────────────────────────────────────────────────
type SubmissionRow = Database['public']['Tables']['submissions']['Row']
type ExamRow = Database['public']['Tables']['exams']['Row']
type ExamCategoryRow = Database['public']['Tables']['exam_categories']['Row']

// ── Raw Supabase join shape (submissions + exams + exam_categories) ───────────
export type RawResultRow = Pick<
  SubmissionRow,
  'id' | 'exam_id' | 'score' | 'percentage' | 'passed' | 'status' | 'time_spent_seconds' | 'submitted_at' | 'started_at'
> & {
  exams: (Pick<ExamRow, 'title' | 'total_points' | 'exam_type' | 'duration_minutes'> & {
    exam_categories: Pick<ExamCategoryRow, 'name'> | null
  }) | null
}

export type RawPendingRow = Pick<
  SubmissionRow,
  'id' | 'submitted_at' | 'status'
> & {
  exams: Pick<ExamRow, 'title'> | null
}

// ── App-level domain types ────────────────────────────────────────────────────
export interface ResultRow {
  id:                 string
  exam_id:            string
  exam_title:         string
  exam_type:          'mock' | 'practice'
  category:           string
  score:              number | null
  total_points:       number
  percentage:         number | null
  passed:             boolean | null
  status:             string
  time_spent_seconds: number | null
  submitted_at:       string | null
  started_at:         string | null
  duration_minutes:   number | null
}

export interface PendingRow {
  id:           string
  exam_title:   string
  submitted_at: string | null
  status:       string
}

export interface SummaryStats {
  totalExams:       number
  passed:           number
  averageScore:     number | null
  highestScore:     number | null
  totalTimeMinutes: number
  totalTimeSeconds?: number | null
  validTimeCount?:   number
}

// ── Filter types ──────────────────────────────────────────────────────────────
export type ExamTypeFilter = 'all' | 'mock' | 'practice'
export type StatusFilter = 'all' | 'passed' | 'failed'

export interface ResultsFilters {
  tab:            ExamTypeFilter
  search:         string
  statusFilter:   StatusFilter
  categoryFilter: string
  page:           number
}
