// lib/utils/admin/submissions/mappers.ts
// ─────────────────────────────────────────────────────────────────────────────
// FIX C: mapSubmission now:
//   1. Uses a strict coerceStatus() guard so 'reviewed' and 'released' rows
//      are never silently dropped or misrepresented.
//   2. Correctly unwraps the RawStudentJoin shape produced by the two-step
//      service fetch (profiles nested inside students).
//   3. Passes all required Submission fields through — no field is silently
//      omitted when the DB row is partially null.
//
// mapAnswer is unchanged — documented here for completeness.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  SubmissionRaw,
  Submission,
  SubmissionStatus,
  RawProfileJoin,
  RawStudentJoin,
} from '@/lib/types/admin/exams/submissions/submission.types'
import type {
  AnswerRaw,
  AnswerDetail,
} from '@/lib/types/admin/exams/submissions/answer.types'
import type { QuestionType } from '@/lib/types/database'

// ── Answer key raw shape (used by service + answer-key hook) ──────────────────
export interface AnswerKeyRaw {
  id:             string
  correct_answer: string | null
  question_text:  string
  question_type:  string
  order_number:   number | null
}

// ── Status coercion ───────────────────────────────────────────────────────────

/**
 * FIX C-1: Coerces any raw string coming from the DB into a typed
 * SubmissionStatus. Previously, rows with status = 'reviewed' or 'released'
 * fell through without proper typing, causing the GradingPanel to show
 * incorrect counts and the submissions table to display wrong badges.
 *
 * All five DB values are handled explicitly. Unknown values fall back to
 * 'in_progress' so the UI always has a safe renderable state.
 */
export function coerceStatus(raw: string | null | undefined): SubmissionStatus {
  switch (raw) {
    case 'in_progress': return 'in_progress'
    case 'submitted':   return 'submitted'
    case 'graded':      return 'graded'
    case 'reviewed':    return 'reviewed'
    case 'released':    return 'released'
    default:            return 'in_progress'
  }
}

// ── Profile unwrap ────────────────────────────────────────────────────────────

/**
 * FIX C-2: The two-step fetch in submission.service.ts nests a RawProfileJoin
 * inside RawStudentJoin.profiles. PostgREST (when used for the students query
 * that doesn't involve a join) returns a plain object, but we still guard
 * against the array case defensively.
 */
function unwrapProfile(
  raw: RawProfileJoin | RawProfileJoin[] | null | undefined,
): RawProfileJoin | null {
  if (!raw) {return null}
  return Array.isArray(raw) ? (raw[0] ?? null) : raw
}

function unwrapStudent(
  raw: RawStudentJoin | RawStudentJoin[] | null | undefined,
): RawStudentJoin | null {
  if (!raw) {return null}
  return Array.isArray(raw) ? (raw[0] ?? null) : raw
}

// ── mapSubmission ─────────────────────────────────────────────────────────────

/**
 * FIX C: Maps a raw DB row (assembled by submission.service.ts two-step fetch)
 * to the Submission display model.
 *
 * Critical fixes vs original:
 *  - coerceStatus() ensures 'reviewed' / 'released' rows are typed correctly
 *  - student.full_name always has a fallback string (never undefined in type)
 *  - student.student_id correctly pulled from the students join leg
 */
export function mapSubmission(row: SubmissionRaw): Submission {
  const studentJoin = unwrapStudent(row.students)
  const profile     = unwrapProfile(studentJoin?.profiles)

  return {
    id:                 row.id,
    student: {
      id:         row.student_id ?? '',
      full_name:  profile?.full_name  ?? 'Unknown Student',
      email:      profile?.email      ?? '',
      student_id: studentJoin?.student_id ?? null,
    },
    attempt_no:         row.attempt_no ?? 1,
    started_at:         row.started_at,
    submitted_at:       row.submitted_at,
    time_spent_seconds: row.time_spent_seconds,
    status:             coerceStatus(row.status),
    score:              row.score,
    percentage:         row.percentage,
    passed:             row.passed,
  }
}

// ── mapAnswer ─────────────────────────────────────────────────────────────────

const VALID_QUESTION_TYPES = new Set<string>([
  'multiple_choice', 'true_false', 'short_answer', 'essay', 'matching', 'fill_blank',
])

function normalizeQuestionOptions(
  options: unknown,
): { label: string; text: string }[] | null {
  if (!Array.isArray(options)) {return null}

  const isValid = options.every(
    (item) =>
      typeof item === 'object' &&
      item !== null &&
      'label' in item &&
      'text' in item &&
      typeof (item as { label: unknown }).label === 'string' &&
      typeof (item as { text: unknown }).text === 'string',
  )

  return isValid ? (options as { label: string; text: string }[]) : null
}

export function mapAnswer(raw: AnswerRaw): AnswerDetail {
  const q = Array.isArray(raw.questions) ? raw.questions[0] : raw.questions

  const question = q && VALID_QUESTION_TYPES.has(q.question_type ?? '')
    ? {
        question_text:  q.question_text,
        question_type:  q.question_type as QuestionType,
        points:         q.points,
        options:        normalizeQuestionOptions(q.options),
        correct_answer: q.correct_answer ?? null,
        explanation:    q.explanation   ?? null,
        order_number:   q.order_number  ?? null,
      }
    : null

  return {
    id:            raw.id,
    question_id:   raw.question_id ?? '',  
    answer_text:   raw.answer_text,
    is_correct:    raw.is_correct   ?? null,
    points_earned: raw.points_earned ?? null,
    feedback:      raw.feedback      ?? '',
    question,
  }
}

// ── mapAnswerKeyEntry ─────────────────────────────────────────────────────────

import type { AnswerKeyEntry } from '@/lib/types/admin/exams/submissions/answer.types'

export function mapAnswerKeyEntry(raw: AnswerKeyRaw): AnswerKeyEntry {
  return {
    question_id:    raw.id,           
    correct_answer: raw.correct_answer,
    question_text:  raw.question_text,
    question_type:  raw.question_type as QuestionType,
    order_number:   raw.order_number ?? null,
  }
}
