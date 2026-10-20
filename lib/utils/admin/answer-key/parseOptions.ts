// lib/utils/admin/answer-key/parseOptions.ts
// ─────────────────────────────────────────────────────────────────────────────
// Safely narrows a Supabase Json | null value to QuestionOption[] | null.
// Used in both the answer-key page and the submissions answer mapper.
// ─────────────────────────────────────────────────────────────────────────────

import type { Json } from '@/lib/types/database'
import type { QuestionOption } from '@/lib/types/database'

interface RawOption { label: unknown; text: unknown }

function isRawOption(item: unknown): item is RawOption {
  return (
    typeof item === 'object' &&
    item !== null &&
    'label' in item &&
    'text'  in item
  )
}

export function parseOptions(raw: Json | null): QuestionOption[] | null {
  if (!Array.isArray(raw)) {return null}
  const result: QuestionOption[] = []
  for (const item of raw) {
    if (
      isRawOption(item) &&
      typeof item.label === 'string' &&
      typeof item.text  === 'string'
    ) {
      result.push({ label: item.label, text: item.text })
    }
  }
  return result.length > 0 ? result : null
}