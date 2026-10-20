// lib/services/student/practice-exams/practiceExam.service.ts
//
// ─────────────────────────────────────────────────────────────────────────────
// Handles practice-exam submission and result-release flows.
//
// Notification responsibilities:
//   completeAttempt  → notifies ALL admin/faculty (submission event)
//   releaseResult    → notifies the STUDENT (result_released event)
//
// ✅ No `any`, no `as`, no `unknown`
// ✅ All notification logic delegated to notification.service.ts
// ─────────────────────────────────────────────────────────────────────────────

import { createClient }         from '@/lib/supabase/client'
import { PRACTICE_STATUS }      from '@/lib/constants/student/practice-exams/practice-exams'
import type { Database }        from '@/lib/types/database'
import {
  createBulkNotifications,
  createNotification,
  getStaffIds,
  NotificationTemplates,
}                               from '@/lib/services/notifications/notification.service'

type SubmissionUpdate = Database['public']['Tables']['submissions']['Update']

// ── completeAttempt ───────────────────────────────────────────────────────────
/**
 * Marks a submission as SUBMITTED and notifies all admin/faculty staff.
 *
 * Call this from the student-facing exam submit handler.
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
    status:       PRACTICE_STATUS.SUBMITTED,
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
    return { error: 'Could not save final result.' }
  }

  // 2. Resolve staff IDs (non-fatal if this fails)
  const staffIds = await getStaffIds(supabase)

  if (staffIds.length === 0) {
    console.warn('[completeAttempt] No staff found — notification skipped.')
    return { error: null }
  }

  // 3. Notify all staff
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
    // Non-fatal: log but don't surface to the student
    console.error('[completeAttempt] createBulkNotifications error:', notifError)
  }

  return { error: null }
}

// ── releaseResult ─────────────────────────────────────────────────────────────
/**
 * Marks a submission as RELEASED and notifies the student whose result was
 * released.
 *
 * Call this from the admin result-release handler (server action or route).
 *
 * @param submissionId  - The submission being released
 * @param studentUserId - The `profiles.id` of the student (NOT students.id)
 * @param examTitle     - Human-readable exam name shown in the notification
 * @param score         - Numeric score (percentage)
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
    status:      PRACTICE_STATUS.RELEASED,
    released_at: new Date().toISOString(),
  }

  const { error: releaseError } = await supabase
    .from('submissions')
    .update(update)
    .eq('id', submissionId)

  if (releaseError !== null) {
    return { error: 'Could not release result.' }
  }

  // 2. Notify the student
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
    console.error('[releaseResult] createNotification error:', notifError)
    // Non-fatal: result is released regardless of notification failure
  }

  return { error: null }
}