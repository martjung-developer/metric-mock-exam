// lib/utils/admin/results/results.utils.ts
// ─────────────────────────────────────────────────────────────────────────────
// Pure utility functions for the results feature.
// Extended with computeSummary that now derives multi-attempt statistics from
// StudentAttemptHistory[].
// ─────────────────────────────────────────────────────────────────────────────

import type {
  Result,
  ResultSummary,
  AggregateAnalytics,
  StudentAttemptHistory,
} from '@/lib/types/admin/exams/results/results.types'

// ── Formatters ────────────────────────────────────────────────────────────────

export function fmtTime(secs: number): string {
  const m = Math.floor(secs / 60)
  return `${m}m ${secs % 60}s`
}

export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-PH', {
    month: 'short',
    day:   'numeric',
    year:  'numeric',
  })
}

export function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-PH')
}

// ── Avatar initials ───────────────────────────────────────────────────────────

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

// ── Summary from flat Result[] (existing — unchanged) ─────────────────────────

export function computeSummary(results: Result[]): ResultSummary {
  const passing  = results.filter((r) => r.passed).length
  const released = results.filter((r) => r.status === 'released').length
  const reviewed = results.filter((r) => r.status === 'reviewed').length

  return {
    total:    results.length,
    passing,
    failing:  results.length - passing,
    passRate: results.length ? Math.round((passing / results.length) * 100) : 0,
    released,
    reviewed,
    studentsWithMultipleAttempts: 0,
    averageImprovement:           null,
    highestImprovement:           null,
  }
}

// ── Summary from StudentAttemptHistory[] (richer, preferred) ─────────────────

export function computeSummaryFromHistories(histories: StudentAttemptHistory[]): ResultSummary {
  // Use best attempt per student as the canonical result for pass/fail counts
  const total    = histories.length
  const passing  = histories.filter(h => h.bestAttempt.passed).length
  const released = histories.filter(h => h.latestAttempt.status === 'released').length
  const reviewed = histories.filter(h => h.latestAttempt.status === 'reviewed').length

  const multiAttemptStudents = histories.filter(h => h.attempts.length > 1).length

  const deltas = histories
    .map(h => h.improvementDelta)
    .filter((d): d is number => d !== null)

  const averageImprovement =
    deltas.length > 0
      ? deltas.reduce((acc, d) => acc + d, 0) / deltas.length
      : null

  const highestImprovement =
    deltas.length > 0
      ? Math.max(...deltas)
      : null

  return {
    total,
    passing,
    failing:  total - passing,
    passRate: total ? Math.round((passing / total) * 100) : 0,
    released,
    reviewed,
    studentsWithMultipleAttempts: multiAttemptStudents,
    averageImprovement,
    highestImprovement,
  }
}

// ── Analytics fallback ────────────────────────────────────────────────────────

export function computeAnalyticsFromResults(results: Result[]): AggregateAnalytics | null {
  if (results.length === 0) {return null}
  const pcts = results.map((r) => r.percentage)

  const latestSubmittedAt = results
    .map((r) => r.submitted_at)
    .sort()
    .at(-1) ?? null

  return {
    total_attempts:  pcts.length,
    average_score:   pcts.reduce((a, b) => a + b, 0) / pcts.length,
    highest_score:   Math.max(...pcts),
    lowest_score:    Math.min(...pcts),
    last_attempt_at: latestSubmittedAt,
  }
}

// ── Analytics from histories (counts all attempts, not just best) ─────────────

export function computeAnalyticsFromHistories(
  histories: StudentAttemptHistory[],
): AggregateAnalytics | null {
  const allAttempts = histories.flatMap(h => h.attempts)
  if (allAttempts.length === 0) {return null}

  const pcts = allAttempts.map(a => a.percentage)
  const latestSubmittedAt = allAttempts
    .map(a => a.submitted_at)
    .sort()
    .at(-1) ?? null

  return {
    total_attempts:  allAttempts.length,
    average_score:   pcts.reduce((a, b) => a + b, 0) / pcts.length,
    highest_score:   Math.max(...pcts),
    lowest_score:    Math.min(...pcts),
    last_attempt_at: latestSubmittedAt,
  }
}