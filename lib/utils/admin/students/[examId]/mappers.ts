// lib/utils/admin/students/[examId]/mappers.ts
import type { ExamType, SubmissionStatus } from '@/lib/types/database'
import type { StudentProfileRow, StudentProfile, JoinedStudent, JoinedProgram } from '@/lib/types/admin/students/[examId]/student.types'
import type { AssignedExamRow, AssignedExam, JoinedExamForAssignment } from '@/lib/types/admin/students/[examId]/exam.types'
import type { SubmissionRaw, Submission, JoinedExamForSubmission } from '@/lib/types/admin/students/[examId]/submission.types'
import type { NotificationRaw, Notification } from '@/lib/types/admin/students/[examId]/notification.types'

// ── Generic FK unwrapper ──────────────────────────────────────────────────────
function unwrapOne<T>(value: T | T[] | null | undefined): T | null {
  if (value === null || value === undefined) { return null }
  if (Array.isArray(value)) { return value[0] ?? null }
  return value
}

// ── Safe exam type narrowing ──────────────────────────────────────────────────
function safeExamType(raw: string | null | undefined): ExamType {
  return raw === 'practice' ? 'practice' : 'mock'
}

// ── Safe submission status narrowing ─────────────────────────────────────────
// Must match the DB CHECK constraint exactly:
// 'in_progress' | 'submitted' | 'graded' | 'reviewed' | 'released'
const VALID_STATUSES = new Set<SubmissionStatus>([
  'in_progress',
  'submitted',
  'graded',
  'reviewed',
  'released',
])

function safeSubmissionStatus(raw: string | null | undefined): SubmissionStatus {
  if (raw && VALID_STATUSES.has(raw as SubmissionStatus)) {
    return raw as SubmissionStatus
  }
  return 'in_progress'
}

// ── Safe date guard — prevents "Jan 1, 1970" ─────────────────────────────────
const EPOCH_LOWER_BOUND = Date.UTC(2000, 0, 1) // Jan 1 2000 — no real submission predates this

function safeDate(raw: string | null | undefined): string | null {
  if (!raw) { return null }
  const ms = Date.parse(raw)
  if (isNaN(ms) || ms < EPOCH_LOWER_BOUND) { return null }
  return raw
}

// ── Profile mapper ────────────────────────────────────────────────────────────
export function mapProfileRow(row: StudentProfileRow): StudentProfile {
  const student = unwrapOne<JoinedStudent>(row.students)
  const program = student ? unwrapOne<JoinedProgram>(student.programs) : null

  return {
    id:           row.id,
    full_name:    row.full_name   ?? null,
    email:        row.email,
    avatar_url:   row.avatar_url  ?? null,
    student_id:   student?.student_id  ?? null,
    year_level:   student?.year_level  ?? null,
    program_id:   student?.program_id  ?? null,
    program_code: program?.code        ?? null,
    program_name: program?.name        ?? null,
    school:       student?.school      ?? null,
    target_exam:  student?.target_exam ?? null,
    created_at:   row.created_at,
  }
}

// ── Assigned exam mapper ──────────────────────────────────────────────────────
export function mapExamRow(row: AssignedExamRow): AssignedExam {
  const exam = unwrapOne<JoinedExamForAssignment>(row.exams)

  return {
    id:          row.id,
    exam_id:     row.exam_id ?? '',
    exam_title:  exam?.title     ?? 'Untitled',
    exam_type:   safeExamType(exam?.exam_type),
    is_active:   row.is_active,
    assigned_at: row.assigned_at,
    deadline:    row.deadline ?? null,
  }
}

// ── Submission mapper ─────────────────────────────────────────────────────────
export function mapSubmissionRow(row: SubmissionRaw): Submission {
  const exam = unwrapOne<JoinedExamForSubmission>(row.exams)

  return {
    id:           row.id,
    exam_title:   exam?.title    ?? 'Untitled',
    exam_type:    safeExamType(exam?.exam_type),
    status:       safeSubmissionStatus(row.status),
    score:        row.score      ?? null,   // ← now mapped
    percentage:   row.percentage ?? null,
    passed:       row.passed     ?? null,
    submitted_at: safeDate(row.submitted_at), // ← guards epoch-zero
  }
}

// ── Notification mapper ───────────────────────────────────────────────────────
export function mapNotificationRow(row: NotificationRaw): Notification {
  return {
    id:         row.id,
    title:      row.title   ?? null,
    message:    row.message ?? null,
    type:       row.type    ?? null,
    is_read:    row.is_read,
    created_at: row.created_at,
  }
}
