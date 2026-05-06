// lib/services/notifications/notification.service.ts
//
// ─────────────────────────────────────────────────────────────────────────────
// CORE notification service. Zero UI logic. Zero React hooks.
// All Supabase writes flow through here so the logic lives in one place.
//
// Used by:
//   - submission.service.ts   (student submits exam → admin notification)
//   - results.service.ts      (admin releases result → student notification)
//   - Any future server action that needs to notify a user
//
// ─────────────────────────────────────────────────────────────────────────────

import type { SupabaseClient }           from '@supabase/supabase-js'
import type { Database }                 from '@/lib/types/database'
import {
  rowToDTO,
  type CreateNotificationPayload,
  type CreateBulkNotificationPayload,
  type NotificationDTO,
  type NotificationResult,
  type NotificationInsert,
} from '@/lib/types/notifications/notification.dto'

// ── Internal alias ────────────────────────────────────────────────────────────

type DB = Database

// ── createNotification ────────────────────────────────────────────────────────
/**
 * Inserts a single notification row and returns the created DTO.
 *
 * @example
 * const { data, error } = await createNotification(supabase, {
 *   userId:  adminId,
 *   type:    'submission',
 *   title:   'New Exam Submission',
 *   message: 'Alice submitted "BSPsych Mock – Set 1" with 82%.',
 * })
 */
export async function createNotification(
  supabase: SupabaseClient<DB>,
  payload:  CreateNotificationPayload,
): Promise<NotificationResult<NotificationDTO>> {
  const insert: NotificationInsert = {
    user_id:  payload.userId,
    type:     payload.type,
    title:    payload.title,
    message:  payload.message,
    is_read:  false,
  }

  const { data, error } = await supabase
    .from('notifications')
    .insert(insert)
    .select()
    .single()

  if (error !== null || data === null) {
    return {
      data:  null,
      error: error?.message ?? 'Insert returned no row.',
    }
  }

  return { data: rowToDTO(data), error: null }
}

// ── createBulkNotifications ───────────────────────────────────────────────────
/**
 * Inserts one notification per userId in a single round-trip.
 * Returns the count of rows inserted.
 *
 * @example
 * // Notify all staff when a student submits
 * const staffIds = await getStaffIds(supabase)
 * await createBulkNotifications(supabase, {
 *   userIds: staffIds,
 *   type:    'submission',
 *   title:   'Exam Submitted',
 *   message: `${studentName} submitted "${examTitle}" (${pct}%).`,
 * })
 */
export async function createBulkNotifications(
  supabase: SupabaseClient<DB>,
  payload:  CreateBulkNotificationPayload,
): Promise<NotificationResult<number>> {
  if (payload.userIds.length === 0) {
    return { data: 0, error: null }
  }

  const rows: NotificationInsert[] = payload.userIds.map((uid) => ({
    user_id:  uid,
    type:     payload.type,
    title:    payload.title,
    message:  payload.message,
    is_read:  false,
  }))

  const { error, count } = await supabase
    .from('notifications')
    .insert(rows)
    .select('id', { count: 'exact', head: true })

  if (error !== null) {
    return { data: null, error: error.message }
  }

  return { data: count ?? rows.length, error: null }
}

// ── getStaffIds ───────────────────────────────────────────────────────────────
/**
 * Fetches all admin/faculty profile IDs via SECURITY DEFINER RPC.
 * Falls back to a direct profiles query if the RPC doesn't exist yet.
 */
export async function getStaffIds(
  supabase: SupabaseClient<DB>,
): Promise<string[]> {
  // Primary path: SECURITY DEFINER RPC (bypasses RLS on profiles)
  const { data: rpcData, error: rpcError } = await supabase
    .rpc('get_staff_ids')

  if (rpcError === null && Array.isArray(rpcData)) {
    return rpcData.map((row: { id: string }) => row.id)
  }

  if (rpcError !== null) {
    console.warn('[getStaffIds] RPC unavailable, falling back:', rpcError.message)
  }

  // Fallback: direct query (works if RLS allows it)
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .in('role', ['admin', 'faculty'])

  if (profileError !== null) {
    console.error('[getStaffIds] fallback failed:', profileError.message)
    return []
  }

  return (profileData ?? []).map((row) => row.id)
}

// ── markAsRead ────────────────────────────────────────────────────────────────

export async function markNotificationRead(
  supabase: SupabaseClient<DB>,
  id:       string,
  isRead:   boolean,
): Promise<NotificationResult> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: isRead })
    .eq('id', id)

  if (error !== null) {return { data: null, error: error.message }}
  return { data: null, error: null }
}

// ── markAllAsRead ─────────────────────────────────────────────────────────────

export async function markAllNotificationsRead(
  supabase: SupabaseClient<DB>,
  userId:   string,
): Promise<NotificationResult> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false)

  if (error !== null) {return { data: null, error: error.message }}
  return { data: null, error: null }
}

// ── deleteNotification ────────────────────────────────────────────────────────

export async function deleteNotificationById(
  supabase: SupabaseClient<DB>,
  id:       string,
): Promise<NotificationResult> {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', id)

  if (error !== null) {return { data: null, error: error.message }}
  return { data: null, error: null }
}

// ── fetchNotificationsForUser ─────────────────────────────────────────────────

export async function fetchNotificationsForUser(
  supabase: SupabaseClient<DB>,
  userId:   string,
  limit     = 50,
): Promise<NotificationResult<NotificationDTO[]>> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error !== null) {return { data: null, error: error.message }}

  return {
    data:  (data ?? []).map(rowToDTO),
    error: null,
  }
}

// ── fetchAllNotifications (admin) ─────────────────────────────────────────────

export async function fetchAllNotifications(
  supabase: SupabaseClient<DB>,
  limit     = 100,
): Promise<NotificationResult<NotificationDTO[]>> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error !== null) {return { data: null, error: error.message }}

  return {
    data:  (data ?? []).map(rowToDTO),
    error: null,
  }
}

// ── Pre-built notification templates ──────────────────────────────────────────

export const NotificationTemplates = {
  /**
   * ADMIN notification: a student submitted an exam.
   */
  examSubmittedAdmin: (
    studentName: string,
    examTitle:   string,
    percentage:  number,
  ): Pick<CreateBulkNotificationPayload, 'type' | 'title' | 'message'> => ({
    type:    'submission',
    title:   'Exam Submitted',
    message: `${studentName} completed "${examTitle}" with a score of ${percentage}%.`,
  }),

  /**
   * STUDENT notification: an admin released their exam result.
   */
  resultReleasedStudent: (
    examTitle: string,
    passed:    boolean,
    score:     number,
  ): Pick<CreateNotificationPayload, 'type' | 'title' | 'message'> => ({
    type:    'result_released',
    title:   'Your Results Are Ready',
    message: passed
      ? `You passed "${examTitle}" with a score of ${score}%. Check your results page.`
      : `Your results for "${examTitle}" are available (score: ${score}%). Keep it up!`,
  }),

  /**
   * STUDENT notification: a new exam has been assigned.
   */
  examAssigned: (
    examTitle: string,
  ): Pick<CreateNotificationPayload, 'type' | 'title' | 'message'> => ({
    type:    'exam',
    title:   'New Exam Assigned',
    message: `"${examTitle}" has been assigned to you. Good luck!`,
  }),
} as const