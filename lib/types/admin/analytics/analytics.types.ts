// lib/types/admin/analytics/analytics.types.ts
// All interfaces for the Admin Analytics Dashboard.
// Uses Supabase-generated row types 

import type { Database } from '@/lib/types/database'

// ── Supabase Row Aliases ────────────────────────────────────────────────────

export type SubmissionRow = Database['public']['Tables']['submissions']['Row']
export type ExamRow       = Database['public']['Tables']['exams']['Row']
export type ProfileRow    = Database['public']['Tables']['profiles']['Row']
export type StudentRow    = Database['public']['Tables']['students']['Row']
export type ProgramRow    = Database['public']['Tables']['programs']['Row']

// ── Partial projection types (fetched via .select()) ───────────────────────
// These represent the exact columns selected in each query.
// Using Pick<Row, ...> ensures we stay in sync with the generated schema.

export type SubmissionProjection = Pick<
  SubmissionRow,
  'id' | 'student_id' | 'exam_id' | 'status' | 'time_spent_seconds'
>

export type ReleasedSubmissionProjection = Pick<
  SubmissionRow,
  'id' | 'student_id' | 'exam_id' | 'percentage' | 'passed' | 'time_spent_seconds'
>

export type ExamProjection = Pick<ExamRow, 'id' | 'title' | 'program_id'>

export type ProfileProjection = Pick<ProfileRow, 'id' | 'full_name'>

export type ProgramProjection = Pick<ProgramRow, 'id' | 'name'>

export type ProgramFilterOption = Pick<ProgramRow, 'id' | 'code' | 'name'>

// ── UI-Level Data Types ─────────────────────────────────────────────────────

export interface OverviewStats {
  totalStudents:    number
  totalExams:       number
  totalAttempts:    number
  releasedAttempts: number
  averageScore:     number
}

export interface ProgramPerf {
  program_id: string
  name:       string
  avg_score:  number
}

export interface ExamPerf {
  exam_id:   string
  title:     string
  avg_score: number
  pass_rate: number
}

export interface TopStudent {
  student_id:     string
  full_name:      string
  average_score:  number
  total_attempts: number
}

export interface AtRiskStudent {
  student_id:     string
  full_name:      string
  average_score:  number
  total_attempts: number
}

export interface EngagementStats {
  totalAttempts:         number
  releasedAttempts:      number
  totalTimeMinutes:      number
  avgTimePerAttempt:     number
  avgAttemptsPerStudent: number
}

// ── Hook Return Shape ───────────────────────────────────────────────────────

export interface AnalyticsData {
  overview:      OverviewStats    | null
  programPerf:   ProgramPerf[]
  examPerf:      ExamPerf[]
  topStudents:   TopStudent[]
  atRisk:        AtRiskStudent[]
  engagement:    EngagementStats  | null
  programs:      ProgramFilterOption[]
}

export interface UseAnalyticsReturn {
  data:               AnalyticsData
  loading:            boolean
  error:              string | null
  refreshed:          Date   | null
  selectedProgram:    string
  setSelectedProgram: (id: string) => void
  refresh:            () => void
}

// ── Internal aggregation helpers (service-layer only) ──────────────────────

export interface ScoreBucket {
  sum:    number
  count:  number
}

export interface ExamBucket extends ScoreBucket {
  passed: number
}

export interface StudentBucket {
  sumScore: number
  count:    number
  attempts: number
}