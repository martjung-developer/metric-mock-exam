// lib/services/student/help/faq.service.ts
// Supabase data-fetching for FAQs. No UI, no state, fully typed.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database }       from '@/lib/types/database'
import type { FaqItem, FaqRow } from '@/lib/types/student/help/faq.types'

type DB = SupabaseClient<Database>

// ── Error helper ─────────────────────────────────────────────────────────────

function extractMessage(err: unknown): string {
  if (
    typeof err === 'object' &&
    err !== null &&
    'message' in err &&
    typeof (err as Record<string, unknown>)['message'] === 'string'
  ) {
    return (err as Record<string, unknown>)['message'] as string
  }
  if (err instanceof Error) {return err.message}
  return 'An unexpected error occurred.'
}

// ── getFaqs ──────────────────────────────────────────────────────────────────
// Fetches FAQ rows from `help_faqs`, ordered by category.
// Returns an empty array (not an error) if the table doesn't exist yet —
// the hook handles fallback logic.

export async function getFaqs(db: DB): Promise<FaqItem[]> {
  const { data, error } = await db
    .from('help_faqs')
    .select('id, question, answer, category')
    .order('category')

  if (error) {throw new Error(extractMessage(error))}

  // Cast at the single service boundary: .select() matches FaqRow exactly
  return (data ?? []) as FaqRow[]
}