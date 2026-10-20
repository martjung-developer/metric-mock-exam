// lib/types/student/progress/progress.types.ts
//
// All domain types for the student Progress feature.
// Import from here in services, hooks, and components — never re-declare inline.

import type { Database } from '@/lib/types/database'

// ── Re-export DB row helpers ──────────────────────────────────────────────────

export type SubmissionRow  = Database['public']['Tables']['submissions']['Row']
export type ExamRow        = Database['public']['Tables']['exams']['Row']
export type CategoryRow    = Database['public']['Tables']['exam_categories']['Row']

// ── Progress-specific status (superset of DB SubmissionStatus + 'released') ──
// The DB column only tracks 'in_progress' | 'submitted' | 'graded'.
// 'released' is a UI-level status used by the results/progress feature.

export type ProgressSubmissionStatus = 'in_progress' | 'submitted' | 'graded' | 'released'

// ── Raw shapes returned by Supabase queries ───────────────────────────────────

export interface RawSubmission {
  id:                 string
  exam_id:            string | null
  submitted_at:       string | null
  time_spent_seconds: number | null
  status:             ProgressSubmissionStatus
  percentage:         number | null
  passed:             boolean | null
  created_at:         string
}

export interface RawExam {
  id:          string
  title:       string
  category_id: string | null
}

export interface RawCategory {
  id:   string
  name: string
}

// ── Computed / domain shapes ──────────────────────────────────────────────────

export interface TimelinePoint {
  date:  string
  score: number
}

export interface CategoryAvg {
  label: string
  score: number
}

export interface RecentExamItem {
  id:          string
  title:       string
  category:    string | null
  submittedAt: string | null
  score:       number | null
  passed:      boolean | null
  status:      ProgressSubmissionStatus
}

export interface ProgressMetrics {
  examsTaken:        number
  averageScore:      number
  highestScore:      number
  highestScoreTitle: string
  passRate:          number
  studyStreakDays:   number
  totalStudyHours:   number
  totalPassed:       number
  totalFailed:       number
  pendingCount:      number
  scoreTimeline:     TimelinePoint[]
  categoryAverages:  CategoryAvg[]
  recentItems:       RecentExamItem[]
  hasData:           boolean
}

// ── Service response ──────────────────────────────────────────────────────────

export interface ProgressServiceData {
  submissions: RawSubmission[]
  exams:       RawExam[]
  categories:  RawCategory[]
}

// ── Filter ────────────────────────────────────────────────────────────────────

export type FilterRange = '7d' | '30d' | 'all'

export const FILTER_OPTIONS: { label: string; value: FilterRange }[] = [
  { label: '7 Days',   value: '7d'  },
  { label: '30 Days',  value: '30d' },
  { label: 'All Time', value: 'all' },
]

// ── Constants ─────────────────────────────────────────────────────────────────

export const BAR_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'] as const

export const STUDY_DIST = [
  { label: 'Mock Exams',      pct: 50, color: '#3b82f6' },
  { label: 'Reviewers',       pct: 30, color: '#f59e0b' },
  { label: 'Study Materials', pct: 20, color: '#10b981' },
] as const

export type DonutSlice = { label: string; pct: number; color: string }
