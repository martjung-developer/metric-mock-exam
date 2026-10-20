// lib/services/student/help/ticket.service.ts

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database }       from '@/lib/types/database'
import type { SupportTicketInsert } from '@/lib/types/student/help/ticket.types'

type DB = SupabaseClient<Database>

// ── createTicket ──────────────────────────────────────────────────────────────

export async function createTicket(
  db:      DB,
  payload: SupportTicketInsert,
): Promise<void> {
  const { error } = await db
    .from('support_tickets')
    .insert([payload])

  if (error !== null) {
    throw new Error(error.message)
  }
}