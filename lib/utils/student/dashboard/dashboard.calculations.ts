// lib/utils/student/dashboard/dashboard.calculations.ts
// ─────────────────────────────────────────────────────────────────────────────
// Pure functions — no Supabase imports, no side effects.
// Safe to unit-test in isolation.
// ─────────────────────────────────────────────────────────────────────────────

import { MOCK_TARGET, PRACTICE_TARGET } from '@/lib/types/student/dashboard/dashboard.types'
import type { DashboardProgress }       from '@/lib/types/student/dashboard/dashboard.types'


export function computeStreak(isoDates: string[]): number {
  if (isoDates.length === 0) {return 0}

  const daySet = new Set(isoDates.map((d) => d.slice(0, 10)))
  const sorted = Array.from(daySet).sort().reverse()

  const today  = new Date()
  today.setHours(0, 0, 0, 0)

  let streak = 0
  let cursor = new Date(today)

  for (const day of sorted) {
    const d = new Date(day)
    d.setHours(0, 0, 0, 0)
    const diff = Math.round((cursor.getTime() - d.getTime()) / 86_400_000)

    if (diff === 0 || diff === 1) {
      streak++
      cursor = d
    } else {
      break
    }
  }

  return streak
}

/**
 * Format an ISO date string as a human-readable relative time.
 * Returns '—' for null input.
 */
export function formatRelative(iso: string | null): string {
  if (!iso) {return '—'}
  const diff = Date.now() - new Date(iso).getTime()
  const m    = Math.floor(diff / 60_000)
  if (m < 1)  {return 'just now'}
  if (m < 60) {return `${m}m ago`}
  const h = Math.floor(m / 60)
  if (h < 24) {return `${h}h ago`}
  return `${Math.floor(h / 24)}d ago`
}

/**
 * Compute progress percentages capped at 100.
 */
export function computeProgress(
  mockCount:     number,
  practiceCount: number,
): DashboardProgress {
  return {
    mockPct:      Math.min(Math.round((mockCount     / MOCK_TARGET)     * 100), 100),
    practicePct:  Math.min(Math.round((practiceCount / PRACTICE_TARGET) * 100), 100),
    materialsPct: 0,  // reserved for future materials tracking
  }
}

/**
 * Get the highest percentage score from an array of nullable numbers.
 * Returns null if no valid scores exist.
 */
export function computeBestScore(percentages: (number | null)[]): number | null {
  const valid = percentages.filter((p): p is number => p !== null)
  if (valid.length === 0) {return null}
  return Math.round(Math.max(...valid))
}