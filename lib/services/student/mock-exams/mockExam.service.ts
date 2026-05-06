// lib/services/student/mock-exams/mockExam.service.ts
//
// ─────────────────────────────────────────────────────────────────────────────
// Handles mock-exam submission and result-release flows.
//
// Notification responsibilities:
//   completeAttempt  → notifies ALL admin/faculty (submission event)
//   releaseResult    → notifies the STUDENT (result_released event)
//
// Mirrors practiceExam.service.ts exactly — same pattern, same delegation.
// ─────────────────────────────────────────────────────────────────────────────

import { createClient }         from '@/lib/supabase/client'
import type { Database }        from '@/lib/types/database'
import {
  createBulkNotifications,
  createNotification,
  getStaffIds,
  NotificationTemplates,
}                               from '@/lib/services/notifications/notification.service'

// ── DB-derived types ──────────────────────────────────────────────────────────

type SubmissionUpdate = Database['public']['Tables']['submissions']['Update']

// ── Mock-exam status constants ────────────────────────────────────────────────
// If you have a dedicated MOCK_STATUS constant file, import from there instead.

const MOCK_STATUS = {
  SUBMITTED: 'submitted',
  RELEASED:  'released',
} as const

// ── completeAttempt ───────────────────────────────────────────────────────────
/**
 * Marks a mock-exam submission as SUBMITTED and notifies all admin/faculty.
 *
 * Call this from the student-facing mock-exam submit handler.
 *
 * @param submissionId  - The submissions row being finalised
 * @param score         - Raw score value
 * @param percentage    - Score expressed as a percentage (0–100)
 * @param passed        - Whether the student met the passing threshold
 * @param examTitle     - Human-readable exam name shown in the notification
 * @param studentName   - Display name of the submitting student
 */
export async function completeAttempt(
  submissionId: string,
  score:        number,
  percentage:   number,
  passed:       boolean,
  examTitle:    string,
  studentName:  string,
): Promise<{ error: string | null }> {
  const supabase = createClient()

  // 1. Persist the final submission state
  const update: SubmissionUpdate = {
    status:       MOCK_STATUS.SUBMITTED,
    submitted_at: new Date().toISOString(),
    score,
    percentage,
    passed,
  }

  const { error: submitError } = await supabase
    .from('submissions')
    .update(update)
    .eq('id', submissionId)

  if (submitError !== null) {
    return { error: 'Could not save final mock-exam result.' }
  }

  // 2. Resolve staff IDs — non-fatal if this fails
  const staffIds = await getStaffIds(supabase)

  if (staffIds.length === 0) {
    console.warn('[mockExam/completeAttempt] No staff found — notification skipped.')
    return { error: null }
  }

  // 3. Notify all admin/faculty using the shared submission template
  const template = NotificationTemplates.examSubmittedAdmin(
    studentName,
    examTitle,
    Math.round(percentage),
  )

  const { error: notifError } = await createBulkNotifications(supabase, {
    userIds: staffIds,
    ...template,
  })

  if (notifError !== null) {
    // Non-fatal: log but don't surface the error to the student
    console.error('[mockExam/completeAttempt] createBulkNotifications error:', notifError)
  }

  return { error: null }
}

// ── releaseResult ─────────────────────────────────────────────────────────────
/**
 * Marks a mock-exam submission as RELEASED and notifies the student.
 *
 * Call this from the admin result-release handler (server action or route).
 *
 * @param submissionId  - The submission being released
 * @param studentUserId - The `profiles.id` of the student (NOT students.id)
 * @param examTitle     - Human-readable exam name shown in the notification
 * @param score         - Numeric score (percentage, 0–100)
 * @param passed        - Whether the student passed
 */
export async function releaseResult(
  submissionId:  string,
  studentUserId: string,
  examTitle:     string,
  score:         number,
  passed:        boolean,
): Promise<{ error: string | null }> {
  const supabase = createClient()

  // 1. Update submission status to RELEASED
  const update: SubmissionUpdate = {
    status:      MOCK_STATUS.RELEASED,
    released_at: new Date().toISOString(),
  }

  const { error: releaseError } = await supabase
    .from('submissions')
    .update(update)
    .eq('id', submissionId)

  if (releaseError !== null) {
    return { error: 'Could not release mock-exam result.' }
  }

  // 2. Notify the student using the shared result-released template
  const template = NotificationTemplates.resultReleasedStudent(
    examTitle,
    passed,
    Math.round(score),
  )

  const { error: notifError } = await createNotification(supabase, {
    userId: studentUserId,
    ...template,
  })

  if (notifError !== null) {
    // Non-fatal: result is released regardless of notification failure
    console.error('[mockExam/releaseResult] createNotification error:', notifError)
  }

  return { error: null }
}

// ── assignExam ────────────────────────────────────────────────────────────────
/**
 * Optional helper: notifies a student when a mock exam is assigned to them.
 *
 * Call this from the admin exam-assignment handler after persisting the
 * assignment row. The DB write itself is NOT handled here — only the
 * notification side-effect.
 *
 * @param studentUserId - The `profiles.id` of the student being assigned
 * @param examTitle     - Human-readable exam name shown in the notification
 */
export async function notifyExamAssigned(
  studentUserId: string,
  examTitle:     string,
): Promise<{ error: string | null }> {
  const supabase = createClient()

  const template = NotificationTemplates.examAssigned(examTitle)

  const { error: notifError } = await createNotification(supabase, {
    userId: studentUserId,
    ...template,
  })

  if (notifError !== null) {
    console.error('[mockExam/notifyExamAssigned] createNotification error:', notifError)
    return { error: notifError }
  }

  return { error: null }
}