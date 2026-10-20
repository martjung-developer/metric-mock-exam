// lib/utils/student/progress/computeStreak.ts
//
// Pure function — no React, no Supabase.
// Computes the number of consecutive days a student has made a submission.

import type { RawSubmission } from '@/lib/types/student/progress/progress.types'

/**
 * Returns the current consecutive-day study streak.
 *
 * Algorithm:
 *   1. Build a Set of unique ISO dates (YYYY-MM-DD) from submitted_at / created_at.
 *   2. Sort descending, walk backward day-by-day from today.
 *   3. Increment streak while each next day is exactly 1 day before the cursor.
 */
export function computeStreak(submissions: RawSubmission[]): number {
  if (submissions.length === 0) {return 0}

  const daySet = new Set<string>()
  for (const s of submissions) {
    daySet.add((s.submitted_at ?? s.created_at).slice(0, 10))
  }

  const days   = Array.from(daySet).sort().reverse()
  const today  = new Date()
  today.setHours(0, 0, 0, 0)

  let streak = 0
  let cursor = new Date(today)

  for (const day of days) {
    const d    = new Date(day)
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