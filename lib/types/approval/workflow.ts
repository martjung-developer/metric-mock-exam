// lib/types/approval/workflow.ts
// Single source of truth for all approval-workflow types.
// Imported by services, hooks, and components — never redefined elsewhere.

// ── Status enum (mirrors DB enum exactly) ────────────────────────────────────

export const APPROVAL_STATUSES = [
  'draft',
  'pending_review',
  'approved',
  'rejected',
  'published',
  'archived',
] as const

export type ApprovalStatus = typeof APPROVAL_STATUSES[number]

// ── Entity types that participate in the workflow ─────────────────────────────

export type ApprovalEntityType = 'exam' | 'question' | 'question_bank'

// ── Shared approval fields (mixed into entity shapes) ────────────────────────

export interface ApprovalFields {
  approval_status: ApprovalStatus
  submitted_by:    string | null
  submitted_at:    string | null
  approved_by:     string | null
  approved_at:     string | null
  review_notes:    string | null
}

// ── Question Bank ─────────────────────────────────────────────────────────────

export interface QuestionBank extends ApprovalFields {
  id:           string
  title:        string
  description:  string | null
  program_id:   string | null
  exam_id:      string | null
  rejected_at:  string | null
  published_at: string | null
  created_at:   string
  updated_at:   string
  // Joined
  submitterName?: string | null
  programCode?:   string | null
  examTitle?:     string | null
}

// ── Approval Event (audit log entry) ─────────────────────────────────────────

export interface ApprovalEvent {
  id:          string
  entity_type: ApprovalEntityType
  entity_id:   string
  from_status: ApprovalStatus | null
  to_status:   ApprovalStatus
  actor_id:    string
  notes:       string | null
  created_at:  string
  // Joined
  actorName?: string | null
}

// ── Approval action payloads ──────────────────────────────────────────────────

export interface SubmitForReviewPayload {
  entityType: ApprovalEntityType
  entityId:   string
}

export interface ReviewActionPayload {
  entityType: ApprovalEntityType
  entityId:   string
  action:     'approve' | 'reject' | 'publish' | 'archive'
  notes?:     string
}

// ── Pending review summary (for admin dashboard) ──────────────────────────────

export interface PendingReviewItem {
  id:           string
  entityType:   ApprovalEntityType
  title:        string
  submittedBy:  string | null
  submittedByName?: string | null
  submittedAt:  string | null
  programCode:  string | null
  programName?: string | null
  status:       ApprovalStatus
  reviewNotes:  string | null
}

export interface ApprovalReviewQuestion {
  id: string
  questionNumber: number
  scenario: string | null
  stem: string
  choices: { label: string; text: string }[]
  correctAnswer: string | null
  hasParseIssue: boolean
}

export interface ApprovalReviewDetail {
  examId: string
  title: string
  status: ApprovalStatus
  programCode: string | null
  programName: string | null
  submittedAt: string | null
  facultyId: string | null
  facultyName: string | null
  facultyAvatarUrl: string | null
  metadata: {
    durationMinutes: number | null
    passingScore: number | null
    examType: string | null
    category: string | null
    questionCount: number
  }
  questions: ApprovalReviewQuestion[]
}

// ── Faculty submission summary ────────────────────────────────────────────────

export interface FacultySubmissionSummary {
  drafts:        number
  pending:       number
  approved:      number
  rejected:      number
  published:     number
}

// ── Status metadata (labels, colors) ─────────────────────────────────────────

export const STATUS_META: Record<
  ApprovalStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  draft:          { label: 'Draft',          color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' },
  pending_review: { label: 'Pending Review', color: '#b45309', bg: '#fffbeb', border: '#fde68a' },
  approved:       { label: 'Approved',       color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
  rejected:       { label: 'Rejected',       color: '#dc2626', bg: '#fef2f2', border: '#fca5a5' },
  published:      { label: 'Published',      color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' },
  archived:       { label: 'Archived',       color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
}
