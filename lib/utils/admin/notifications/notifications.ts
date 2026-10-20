// lib/utils/admin/notifications/notifications.ts

import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/types/database'

// ── DB-derived types ──────────────────────────────────────────────────────────
type NotificationRow    = Database['public']['Tables']['notifications']['Row']
type NotificationInsert = Database['public']['Tables']['notifications']['Insert']

// ── Supported notification types ─────────────────────────────────────────────
export type NotifType = 'exam' | 'result' | 'general' | 'progress'

// ── Shared result types ───────────────────────────────────────────────────────
export interface NotifResult {
  success: boolean
  error?:  string
}

export interface BulkNotifResult extends NotifResult {
  count: number
}

// ── Fetch ─────────────────────────────────────────────────────────────────────
// Use userId to scope to a single student (student page).
// Omit userId to fetch all notifications (admin page).
//
// NOTE: This is a client-side helper. For Server Actions / Route Handlers,
//       use createServerClient from @/lib/supabase/server instead.

export interface FetchNotificationsOptions {
  userId?: string   // if provided, filters to this user only
  limit?:  number   // default 100
}

export async function fetchNotifications(
  opts: FetchNotificationsOptions = {},
): Promise<{ data: NotificationRow[]; error?: string }> {
  const supabase = createClient()
  const limit    = opts.limit ?? 100

  let query = supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (opts.userId) {
    query = query.eq('user_id', opts.userId)
  }

  const { data, error } = await query

  if (error) {
    console.error('[fetchNotifications]', error.message)
    return { data: [], error: error.message }
  }

  return { data: data ?? [] }
}

// ── Mark single notification as read/unread ───────────────────────────────────
// The `notifications` Update type in database.ts resolves to `never` for Supabase's
// generic query builder when the payload is typed — known Supabase JS SDK issue
// when the table has optional string | null columns alongside boolean ones.
// The eslint-disable below is intentional: logic and types are verified manually.

export async function markAsRead(
  id:      string,
  is_read: boolean,
): Promise<NotifResult> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('notifications')
    .update({ is_read })
    .eq('id', id)

  if (error) {
    console.error('[markAsRead]', (error as { message: string }).message)
    return { success: false, error: (error as { message: string }).message }
  }

  return { success: true }
}

// ── Mark multiple notifications as read ───────────────────────────────────────
// Used by "Mark all as read" on both admin and student pages.

export async function markAllAsRead(ids: string[]): Promise<NotifResult> {
  if (!ids.length) {
    return { success: true }
  }

  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('notifications')
    .update({ is_read: true })
    .in('id', ids)

  if (error) {
    console.error('[markAllAsRead]', (error as { message: string }).message)
    return { success: false, error: (error as { message: string }).message }
  }

  return { success: true }
}

// ── Delete a notification ─────────────────────────────────────────────────────

export async function deleteNotification(id: string): Promise<NotifResult> {
  const supabase = createClient()

  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('[deleteNotification]', error.message)
    return { success: false, error: error.message }
  }

  return { success: true }
}

// ── Create a single notification ──────────────────────────────────────────────

export interface CreateNotificationInput {
  user_id: string
  title:   string
  message: string
  type:    NotifType
}

export async function createNotification(
  input: CreateNotificationInput,
): Promise<NotifResult> {
  const supabase = createClient()

  const row: NotificationInsert = {
    user_id: input.user_id,
    title:   input.title,
    message: input.message,
    // NotifType is a narrow union; database.ts stores `type` as string | null.
    // The Supabase builder collapses to `never` when a narrower type is passed.
    type:    input.type,
    is_read: false,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('notifications').insert(row)

  if (error) {
    console.error('[createNotification] failed:', (error as { message: string }).message)
    return { success: false, error: (error as { message: string }).message }
  }

  return { success: true }
}

// ── Create multiple notifications in one round-trip ───────────────────────────

export interface CreateBulkNotificationInput {
  user_ids: string[]
  title:    string
  message:  string
  type:     NotifType
}

export async function createBulkNotifications(
  input: CreateBulkNotificationInput,
): Promise<BulkNotifResult> {
  if (!input.user_ids.length) {
    return { success: true, count: 0 }
  }

  const supabase = createClient()

  const rows: NotificationInsert[] = input.user_ids.map((uid) => ({
    user_id: uid,
    title:   input.title,
    message: input.message,
    type:    input.type,
    is_read: false,
  }))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('notifications').insert(rows)

  if (error) {
    console.error('[createBulkNotifications] failed:', (error as { message: string }).message)
    return { success: false, count: 0, error: (error as { message: string }).message }
  }

  return { success: true, count: rows.length }
}

// ── Notification Templates ────────────────────────────────────────────────────
// Pre-built payloads for system-triggered notifications.
// Spread into createNotification() with the target user_id:
//
//   await createNotification({
//     user_id: studentId,
//     ...NotifTemplates.resultsReleased('BSPsych Mock – Set 1'),
//   })

type NotifTemplatePayload = Pick<CreateNotificationInput, 'title' | 'message' | 'type'>

export const NotifTemplates: Record<string, (...args: string[]) => NotifTemplatePayload> = {

  examSubmitted: (examTitle: string): NotifTemplatePayload => ({
    title:   'Exam submitted',
    message: `Your submission for "${examTitle}" has been received and is awaiting grading.`,
    type:    'exam',
  }),

  examGraded: (examTitle: string): NotifTemplatePayload => ({
    title:   'Exam graded',
    message: `Your submission for "${examTitle}" has been graded. Results will be released soon.`,
    type:    'result',
  }),

  resultsReleased: (examTitle: string): NotifTemplatePayload => ({
    title:   'Results available',
    message: `Your results for "${examTitle}" are now available. Check your submissions page.`,
    type:    'result',
  }),

  examAssigned: (examTitle: string): NotifTemplatePayload => ({
    title:   'New exam assigned',
    message: `"${examTitle}" has been assigned to you. Good luck!`,
    type:    'exam',
  }),

} as const