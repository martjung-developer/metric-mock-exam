/**
 * lib/utils/admin/students/format.ts
 *
 * Pure formatting helpers — no React, no Supabase, no side effects.
 */

/**
 * Formats an ISO date string to a human-readable US locale date.
 * e.g. "Jan 5, 2024"
 */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day:   'numeric',
    year:  'numeric',
  })
}

/**
 * Returns a human-readable ordinal year label from a numeric year level.
 * e.g. 1 → "1st Year", 2 → "2nd Year"
 * Returns "—" for null/undefined/0.
 */
export function yearLabel(n: number | null | undefined): string {
  if (!n) {return '—'}
  const suffixes = ['st', 'nd', 'rd']
  const suffix   = suffixes[n - 1] ?? 'th'
  return `${n}${suffix} Year`
}