// lib/utils/student/progress/buildTimeline.ts
//
// Pure function — no React, no Supabase.
// Builds the score-over-time array from raw submissions.

import type {
  RawSubmission,
  TimelinePoint,
  FilterRange,
} from '@/lib/types/student/progress/progress.types'

/**
 * Filters to released submissions with a percentage, sorts ascending by date,
 * and maps to TimelinePoint objects.
 */
export function buildTimeline(submissions: RawSubmission[]): TimelinePoint[] {
  return submissions
    .filter(
      (s): s is RawSubmission & { submitted_at: string; percentage: number } =>
        s.status === 'released' &&
        s.percentage !== null &&
        s.submitted_at !== null,
    )
    .sort((a, b) => new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime())
    .map((s) => ({
      date:  s.submitted_at.slice(0, 10),
      score: Math.round(s.percentage),
    }))
}

/**
 * Slices a pre-built timeline to the requested date range.
 * Falls back to the most-recent N points if the range yields nothing.
 */
export function sliceTimeline(
  timeline: TimelinePoint[],
  range:    FilterRange,
): TimelinePoint[] {
  if (range === 'all' || timeline.length === 0) {return timeline}

  const days    = range === '7d' ? 7 : 30
  const cutoff  = new Date()
  cutoff.setDate(cutoff.getDate() - days)

  const filtered = timeline.filter((p) => new Date(p.date) >= cutoff)
  return filtered.length > 0
    ? filtered
    : timeline.slice(-Math.min(days, timeline.length))
}