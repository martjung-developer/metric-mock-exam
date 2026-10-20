// lib/types/student/mock-exams/mock-exams.ts

export type ExamStatus = 'available' | 'coming_soon' | 'completed' | 'in_progress' | 'locked'

import   type { SubmissionStatus } from '@/lib/types/database'
export type { SubmissionStatus }

export const MAX_ATTEMPTS = 3

export interface MockExam {
  id:            string
  title:         string
  shortCode:     string
  programCode?:   string
  category:      string
  categoryProgramId: string | null
  status:        ExamStatus
  questions?:    number
  duration?:     string
  durationMins?: number
  submissionId?: string
  inProgressAttemptNo?: number
  attemptCount:  number
}

export interface Question {
  id:             string
  question_text:  string
  scenario?:      string | null
  section_title?: string | null
  section_number?: number | null
  question_type:  string
  points:         number
  options:        QuestionOption[] | null
  correct_answer: string | null
  image_url:      string | null
  explanation:    string | null
  order_number:   number | null
}

export interface QuestionOption {
  label: string
  text:  string
}

export interface ExamMeta {
  id:               string
  title:            string
  duration_minutes: number
  passing_score:    number
  total_points:     number
}

export type QState = 'unanswered' | 'answered' | 'skipped' | 'flagged' | 'flagged-answered'

export interface AnswerMap { [qId: string]: string }
export interface StateMap  { [qId: string]: QState  }

export interface ExamAttempt {
  id:                  string
  exam_id:             string
  student_id:          string
  status:              SubmissionStatus
  attempt_no:          number
  started_at:          string
  submitted_at:        string | null
  time_spent_seconds:  number | null
  score:               number | null
  percentage:          number | null
  passed:              boolean | null
}

export type CategoryShape = { id: string; name: string; icon: string | null; program_id: string | null }
export type ProgramShape  = { id: string; code: string; name: string } | null

export type ExamRaw = {
  id:               string
  title:            string
  duration_minutes: number
  is_published:     boolean
  exam_type:        string | null
  exam_categories:  CategoryShape | CategoryShape[] | null
  programs:         ProgramShape  | ProgramShape[]  | null
}

// ── Session creation result shapes ───────────────────────────────────────────

export type SessionCreateResult =
  | { kind: 'started';  submissionId: string; startedAt: string; attemptNo: number }
  | { kind: 'resumed';  submissionId: string; startedAt: string; attemptNo: number }
  | { kind: 'locked';   attemptsUsed: number }

export interface AttemptCountMap {
  /** examId → number of released submissions */
  [examId: string]: number
}
