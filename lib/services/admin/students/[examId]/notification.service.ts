// lib/services/admin/students/[examId]/notification.service.ts
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'
import type { Notification, NotificationRaw, NotificationInsertPayload } from '@/lib/types/admin/students/[examId]/notification.types'
import { mapNotificationRow } from '@/lib/utils/admin/students/[examId]/mappers'

type TypedClient = SupabaseClient<Database>

export async function getNotifications(
  client:    TypedClient,
  studentId: string,
): Promise<Notification[]> {
  const { data, error } = await client
    .from('notifications')
    .select('id, title, message, type, is_read, created_at')
    .eq('user_id', studentId)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) { throw new Error(error.message) }

  return (data ?? []).map((row) => mapNotificationRow(row as NotificationRaw))
}

export async function sendNotification(
  client:  TypedClient,
  payload: NotificationInsertPayload,
): Promise<void> {
  const { error } = await client.from('notifications').insert(payload)
  if (error) { throw new Error(error.message) }
}