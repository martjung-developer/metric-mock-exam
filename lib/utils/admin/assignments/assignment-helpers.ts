/* lib/utils/admin/assignments/assignment-helpers.ts */

import type {
  DisplaySubmissionStatus,
  SubmissionProjection,
  SubmissionStatusPriority,
} from '@/lib/types/admin/exams/assignments/assignments.types'

// ── Status priority ───────────────────────────────────────────────────────────

/**
 * Priority order for picking the most "advanced" submission when a student
 * has taken the same exam multiple times.
 * Higher number = more advanced state.
 */
export const SUBMISSION_STATUS_PRIORITY: SubmissionStatusPriority = {
  released:    5,
  reviewed:    4,
  graded:      3,
  submitted:   2,
  in_progress: 1,
}

// ── Status mapping ────────────────────────────────────────────────────────────

/**
 * Converts a raw `submissions.status` DB string to our UI display status.
 * `reviewed` and `released` both map to `graded` since the distinction is
 * internal and not surfaced to admins in this view.
 */
export function toDisplayStatus(raw: string): DisplaySubmissionStatus {
  switch (raw) {
    case 'in_progress': return 'in_progress'
    case 'submitted':   return 'submitted'
    case 'graded':
    case 'reviewed':
    case 'released':    return 'graded'
    default:            return 'not_started'
  }
}

// ── Submission merging ────────────────────────────────────────────────────────

/**
 * Given multiple submission rows for the same student + exam (retakes),
 * returns the single most "advanced" one by status priority.
 * Returns `null` if the array is empty.
 */
export function pickBestSubmission(
  rows: SubmissionProjection[],
): SubmissionProjection | null {
  if (rows.length === 0) {return null}
  return rows.reduce((best, cur) => {
    const bestPrio = SUBMISSION_STATUS_PRIORITY[best.status] ?? 0
    const curPrio  = SUBMISSION_STATUS_PRIORITY[cur.status]  ?? 0
    return curPrio > bestPrio ? cur : best
  })
}

/**
 * Groups an array of submission projections by `student_id`, then reduces
 * each group to the single best submission using `pickBestSubmission`.
 *
 * Returns a `Record<studentId, SubmissionProjection>` for O(1) lookup.
 */
export function buildBestSubmissionMap(
  rows: SubmissionProjection[],
): Record<string, SubmissionProjection> {
  const grouped: Record<string, SubmissionProjection[]> = {}

  for (const sub of rows) {
    if (!sub.student_id) {continue}
    const bucket = grouped[sub.student_id]
    if (bucket) {
      bucket.push(sub)
    } else {
      grouped[sub.student_id] = [sub]
    }
  }

  const result: Record<string, SubmissionProjection> = {}
  for (const [sid, subs] of Object.entries(grouped)) {
    const best = pickBestSubmission(subs)
    if (best) {result[sid] = best}
  }
  return result
}

// ── Relation unwrapping ───────────────────────────────────────────────────────

/**
 * Supabase foreign-key joins can return either a single object or an array.
 * This helper normalises both shapes to a single value or `null`.
 *
 * Generic bound ensures only object types (not primitives) are accepted.
 */
export function unwrapJoin<T extends object>(
  value: T | T[] | null | undefined,
): T | null {
  if (!value) {return null}
  return Array.isArray(value) ? (value[0] ?? null) : value
}

// ── Display formatting ────────────────────────────────────────────────────────

/** Formats an ISO date string to a human-readable PH locale date. */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-PH', {
    month: 'short',
    day:   'numeric',
    year:  'numeric',
  })
}

/** Returns the first two initials of a name, uppercased. */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}