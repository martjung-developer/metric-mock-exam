// lib/utils/student/notifications/notifications.ts
//
// All Supabase I/O for the notifications feature.
// No React, no state, no UI logic.
// Reusable across student + admin contexts.

import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/types/database'
import type {
  Notification,
  NotifType,
  NotificationRow,
  ServiceResult,
} from '@/lib/types/student/notifications/notifications.types'

// ── Row → App type mapper ──────────────────────────────────────────────────

const VALID_NOTIF_TYPES: ReadonlyArray<NotifType> = [
  'exam', 'progress', 'reminder', 'study', 'streak', 'system',
]

function coerceType(raw: string | null): NotifType {
  if (raw && (VALID_NOTIF_TYPES as ReadonlyArray<string>).includes(raw)) {
    return raw as NotifType
  }
  return 'system'
}

export function mapRowToNotification(row: NotificationRow): Notification {
  return {
    id:        row.id,
    user_id:   row.user_id,
    type:      coerceType(row.type),
    title:     row.title     ?? '',
    message:   row.message   ?? '',
    timestamp: row.created_at,
    is_read:   row.is_read,
    link:      null,       // extend DB schema to add `link` column when ready
    ctaLabel:  null,       // extend DB schema to add `cta_label` column when ready
  }
}

// ── Fetch ──────────────────────────────────────────────────────────────────

export async function fetchNotifications(
  userId: string,
): Promise<ServiceResult<Notification[]>> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    return { data: null, error: error.message }
  }

  const notifications = (data as NotificationRow[]).map(mapRowToNotification)
  return { data: notifications, error: null }
}

// ── Mark single as read ────────────────────────────────────────────────────

export async function markAsRead(id: string): Promise<ServiceResult<void>> {
  const supabase = createClient()

  // `notifications` update/insert payload can be inferred as `never` by Supabase's
  // query builder for this schema, so we scope a narrow `any` cast to write calls.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id)

  if (error) {return { data: null, error: error.message }}
  return { data: null, error: null }
}

// ── Mark single as unread ──────────────────────────────────────────────────

export async function markAsUnread(id: string): Promise<ServiceResult<void>> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('notifications')
    .update({ is_read: false })
    .eq('id', id)

  if (error) {return { data: null, error: error.message }}
  return { data: null, error: null }
}

// ── Mark all as read ───────────────────────────────────────────────────────

export async function markAllAsRead(userId: string): Promise<ServiceResult<void>> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false)

  if (error) {return { data: null, error: error.message }}
  return { data: null, error: null }
}

// ── Delete ─────────────────────────────────────────────────────────────────

export async function deleteNotification(id: string): Promise<ServiceResult<void>> {
  const supabase = createClient()

  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', id)

  if (error) {return { data: null, error: error.message }}
  return { data: null, error: null }
}

// ── Create single ──────────────────────────────────────────────────────────

export interface CreateNotificationPayload {
  user_id: string
  type:    NotifType
  title:   string
  message: string
}

export async function createNotification(
  payload: CreateNotificationPayload,
): Promise<ServiceResult<Notification>> {
  const supabase = createClient()

  const insert: Database['public']['Tables']['notifications']['Insert'] = {
    user_id: payload.user_id,
    type:    payload.type,
    title:   payload.title,
    message: payload.message,
    is_read: false,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('notifications')
    .insert(insert)
    .select('*')
    .single()

  if (error || !data) {
    return { data: null, error: error?.message ?? 'Insert returned no data.' }
  }

  return { data: mapRowToNotification(data as NotificationRow), error: null }
}

// ── Create bulk ────────────────────────────────────────────────────────────

export async function createBulkNotifications(
  payloads: CreateNotificationPayload[],
): Promise<ServiceResult<void>> {
  const supabase = createClient()

  const inserts: Database['public']['Tables']['notifications']['Insert'][] =
    payloads.map((p) => ({
      user_id: p.user_id,
      type:    p.type,
      title:   p.title,
      message: p.message,
      is_read: false,
    }))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('notifications').insert(inserts)

  if (error) {return { data: null, error: error.message }}
  return { data: null, error: null }
}

// ── Notification templates ─────────────────────────────────────────────────
// Predefined payloads so callers never hard-code strings.

export const NotifTemplates = {
  examPublished: (userId: string, examTitle: string): CreateNotificationPayload => ({
    user_id: userId,
    type:    'exam',
    title:   'New Exam Available',
    message: `"${examTitle}" has been published and is ready for you to take.`,
  }),

  examGraded: (userId: string, examTitle: string, score: number): CreateNotificationPayload => ({
    user_id: userId,
    type:    'exam',
    title:   'Exam Results Ready',
    message: `Your results for "${examTitle}" are in. You scored ${score}%.`,
  }),

  studyReminder: (userId: string): CreateNotificationPayload => ({
    user_id: userId,
    type:    'reminder',
    title:   'Study Reminder',
    message: 'You haven\'t studied today. Keep your streak alive!',
  }),

  streakAlert: (userId: string, streak: number): CreateNotificationPayload => ({
    user_id: userId,
    type:    'streak',
    title:   `${streak}-Day Streak! 🔥`,
    message: `You've maintained a ${streak}-day study streak. Keep it up!`,
  }),

  progressMilestone: (userId: string, milestone: string): CreateNotificationPayload => ({
    user_id: userId,
    type:    'progress',
    title:   'Progress Milestone',
    message: `You've reached a new milestone: ${milestone}`,
  }),

  systemAlert: (userId: string, message: string): CreateNotificationPayload => ({
    user_id: userId,
    type:    'system',
    title:   'System Notice',
    message,
  }),
} as const