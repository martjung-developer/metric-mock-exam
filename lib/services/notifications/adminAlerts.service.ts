import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'

type DB = SupabaseClient<Database>

interface AdminAlertPayload {
  title: string
  message: string
  type?: string
}

async function fetchAdminRecipientIds(db: DB): Promise<string[]> {
  const { data, error } = await db
    .from('profiles')
    .select('id')
    .in('role', ['admin', 'faculty'])

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []).map((row) => row.id)
}

export async function notifyAdmins(
  db: DB,
  payload: AdminAlertPayload,
): Promise<void> {
  const adminIds = await fetchAdminRecipientIds(db)
  if (!adminIds.length) {
    return
  }

  const rows = adminIds.map((userId) => ({
    user_id: userId,
    title: payload.title,
    message: payload.message,
    type: (payload.type ?? 'general') as Database['public']['Tables']['notifications']['Insert']['type'],
    is_read: false,
  }))

  const { error } = await db.from('notifications').insert(rows)
  if (error) {
    throw new Error(error.message)
  }
}

interface ExamSubmittedAlertInput {
  studentLabel: string
  examTitle: string
}

export async function notifyAdminsExamSubmitted(
  db: DB,
  input: ExamSubmittedAlertInput,
): Promise<void> {
  await notifyAdmins(db, {
    type: 'exam',
    title: 'Student submitted an exam',
    message: `${input.studentLabel} submitted "${input.examTitle}".`,
  })
}

interface SupportTicketAlertInput {
  studentLabel: string
  subject: string
  priority: string
}

export async function notifyAdminsSupportTicket(
  db: DB,
  input: SupportTicketAlertInput,
): Promise<void> {
  await notifyAdmins(db, {
    type: 'general',
    title: 'New support ticket submitted',
    message: `${input.studentLabel} submitted a ${input.priority} priority ticket: "${input.subject}".`,
  })
}
