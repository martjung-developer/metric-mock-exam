// lib/types/student/dashboard/dashboard.types.ts

export type DashboardSubmissionStatus =
  | 'submitted'  
  | 'graded'     
  | 'reviewed'   
  | 'released'   

// ── Raw DB row shapes (post-select, pre-transform) ────────────────────────────

export interface SubmissionRow {
  id:           string
  exam_id:      string | null
  status:       DashboardSubmissionStatus
  percentage:   number | null
  passed:       boolean | null
  submitted_at: string | null
  attempt_no:   number
}

export interface ExamRow {
  id:        string
  title:     string
  exam_type: 'mock' | 'practice'
}

export interface AssignmentRow {
  id:          string
  exam_id:     string
  is_active:   boolean
  deadline:    string | null
  assigned_at: string
}

export interface PracticeCompletionRow {
  exam_id:      string
  completed_at: string
}

// ── UI-facing types (post-transform) ─────────────────────────────────────────

export interface DashboardStats {
  examsTaken:    number   
  pendingCount:  number   
  gradedCount:   number   
  bestScore:     number | null  
  reviewersDone: number   
  streak:        number   
}

export interface DashboardProgress {
  mockPct:     number   
  practicePct: number   
  materialsPct: number  
}

export interface RecentActivityItem {
  id:           string
  examTitle:    string
  examType:     'mock' | 'practice'
  submittedAt:  string | null
  status:       DashboardSubmissionStatus
  percentage:   number | null 
  passed:       boolean | null 
}

export interface AssignedExamItem {
  id:         string
  examId:     string
  examTitle:  string
  deadline:   string | null
  assignedAt: string
}

// ── Aggregated dashboard data ─────────────────────────────────────────────────

export interface DashboardData {
  stats:          DashboardStats
  progress:       DashboardProgress
  recentActivity: RecentActivityItem[]
  assignedExams:  AssignedExamItem[]
}

// ── Hook return shape ─────────────────────────────────────────────────────────

export interface UseDashboardReturn {
  data:    DashboardData
  loading: boolean
  error:   string | null
  refresh: () => Promise<void>
}

// ── Empty/default values ──────────────────────────────────────────────────────

export const EMPTY_STATS: DashboardStats = {
  examsTaken:    0,
  pendingCount:  0,
  gradedCount:   0,
  bestScore:     null,
  reviewersDone: 0,
  streak:        0,
}

export const EMPTY_PROGRESS: DashboardProgress = {
  mockPct:      0,
  practicePct:  0,
  materialsPct: 0,
}

export const EMPTY_DASHBOARD: DashboardData = {
  stats:          EMPTY_STATS,
  progress:       EMPTY_PROGRESS,
  recentActivity: [],
  assignedExams:  [],
}

// ── Progress targets ──────────────────────────────────────────────────────────

export const MOCK_TARGET     = 20
export const PRACTICE_TARGET = 30