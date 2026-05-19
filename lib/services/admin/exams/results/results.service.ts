// lib/services/admin/exams/results/results.service.ts
// ─────────────────────────────────────────────────────────────────────────────
// Extended with getExamResultsWithAttempts which groups released submissions
// by student and returns a typed StudentAttemptHistory[] without N+1 queries.
//
// All existing functions (fetchResults, fetchAnalytics) are preserved and
// unchanged so the hook can be migrated incrementally.
// ─────────────────────────────────────────────────────────────────────────────

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database }       from '@/lib/types/database'
import type {
  Result,
  Attempt,
  StudentAttemptHistory,
  ImprovementTrend,
  AggregateAnalytics,
  ResultStatus,
  ResultsError,
} from '@/lib/types/admin/exams/results/results.types'
import { computeAnalyticsFromResults } from '@/lib/utils/admin/results/results.utils'

type DB = SupabaseClient<Database>

// ─────────────────────────────────────────────────────────────────────────────
// Internal projection types — narrowly typed so we never carry unknown fields
// ─────────────────────────────────────────────────────────────────────────────

type AnalyticsProjection = Pick<
  Database['public']['Tables']['analytics']['Row'],
  'total_attempts' | 'average_score' | 'highest_score' | 'lowest_score' | 'last_attempt_at'
>

interface FlatSubmissionRow {
  id:                 string
  student_id:         string | null
  score:              number | null
  percentage:         number | null
  passed:             boolean | null
  submitted_at:       string | null
  time_spent_seconds: number | null
  status:             string
  attempt_no:         number | null
}

interface FlatProfileRow {
  id:        string
  full_name: string | null
  email:     string
}

interface FlatStudentRow {
  id:         string
  student_id: string | null
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function toResultStatus(raw: string): ResultStatus {
  if (raw === 'released') {return 'released'}
  return 'reviewed'
}

function deriveTrend(attempts: Attempt[]): ImprovementTrend {
  if (attempts.length <= 1) {return 'single'}
  const first  = attempts[0]
  const latest = attempts[attempts.length - 1]
  if (first === undefined || latest === undefined) {return 'single'}
  const delta = latest.percentage - first.percentage
  if (delta > 0.5)  {return 'up'}
  if (delta < -0.5) {return 'down'}
  return 'flat'
}

// ─────────────────────────────────────────────────────────────────────────────
// fetchResults (unchanged — kept for backward compatibility)
// ─────────────────────────────────────────────────────────────────────────────

export interface FetchResultsSuccess { ok: true;  results: Result[]     }
export interface FetchResultsFailure { ok: false; error:   ResultsError }
export type     FetchResultsOutcome  = FetchResultsSuccess | FetchResultsFailure

export async function fetchResults(
  supabase: DB,
  examId:   string,
): Promise<FetchResultsOutcome> {

  const { data: subData, error: subErr } = await supabase
    .from('submissions')
    .select(
      'id, student_id, score, percentage, passed, submitted_at, time_spent_seconds, status, attempt_no',
    )
    .eq('exam_id', examId)
    .in('status', ['reviewed', 'released'])
    .order('percentage',   { ascending: false, nullsFirst: false })
    .order('submitted_at', { ascending: true })

  if (subErr) {
    return { ok: false, error: { code: 'FETCH_SUBMISSIONS_FAILED', message: subErr.message } }
  }

  const rows = (subData ?? []) as FlatSubmissionRow[]

  if (rows.length === 0) {return { ok: true, results: [] }}

  const studentIds = [
    ...new Set(rows.map(r => r.student_id).filter((id): id is string => id !== null)),
  ]

  const [profilesRes, studentsRes] = await Promise.all([
    supabase.from('profiles').select('id, full_name, email').in('id', studentIds),
    supabase.from('students').select('id, student_id').in('id', studentIds),
  ])

  const profileMap = new Map<string, FlatProfileRow>()
  for (const p of (profilesRes.data ?? []) as FlatProfileRow[]) {
    profileMap.set(p.id, p)
  }

  const studentMap = new Map<string, FlatStudentRow>()
  for (const st of (studentsRes.data ?? []) as FlatStudentRow[]) {
    studentMap.set(st.id, st)
  }

  const results: Result[] = rows
    .filter(r => r.score !== null && r.submitted_at !== null)
    .map(r => {
      const profile = r.student_id ? profileMap.get(r.student_id) : undefined
      const student = r.student_id ? studentMap.get(r.student_id) : undefined

      return {
        id: r.id,
        student: {
          id:         profile?.id         ?? r.student_id ?? '',
          full_name:  profile?.full_name  ?? 'Unknown Student',
          email:      profile?.email      ?? '',
          student_id: student?.student_id ?? null,
        },
        score:              r.score ?? 0,
        percentage:         r.percentage ?? 0,
        passed:             r.passed     ?? false,
        submitted_at:       r.submitted_at ?? new Date(0).toISOString(),
        time_spent_seconds: r.time_spent_seconds ?? 0,
        status:             toResultStatus(r.status),
      }
    })

  const bestByStudent = new Map<string, Result>()
  for (const r of results) {
    const existing = bestByStudent.get(r.student.id)
    if (existing === undefined || r.percentage > existing.percentage) {
      bestByStudent.set(r.student.id, r)
    }
  }
  const deduped = Array.from(bestByStudent.values())
  deduped.sort((a, b) => b.percentage - a.percentage)
  return { ok: true, results: deduped }

}

// ─────────────────────────────────────────────────────────────────────────────
// getExamResultsWithAttempts — NEW
// Single query + in-memory grouping. No N+1. Strictly typed.
// Returns one StudentAttemptHistory per student who has at least one
// RELEASED submission for the given exam.
// ─────────────────────────────────────────────────────────────────────────────

export interface FetchAttemptsSuccess { ok: true;  histories: StudentAttemptHistory[] }
export interface FetchAttemptsFailure { ok: false; error:     ResultsError            }
export type     FetchAttemptsOutcome  = FetchAttemptsSuccess | FetchAttemptsFailure

export async function getExamResultsWithAttempts(
  supabase: DB,
  examId:   string,
): Promise<FetchAttemptsOutcome> {

  // ── Step 1: Single flat fetch of all released submissions ─────────────────
  // We deliberately include 'reviewed' here too, mirroring fetchResults, so
  // the attempt history panel stays consistent with the main results table.
  const { data: subData, error: subErr } = await supabase
    .from('submissions')
    .select(
      'id, student_id, score, percentage, passed, submitted_at, time_spent_seconds, status, attempt_no',
    )
    .eq('exam_id', examId)
    .in('status', ['reviewed', 'released'])
    .order('attempt_no', { ascending: true, nullsFirst: false })

  if (subErr) {
    return {
      ok:    false,
      error: { code: 'FETCH_SUBMISSIONS_FAILED', message: subErr.message },
    }
  }

  const rows = (subData ?? []) as FlatSubmissionRow[]

  if (rows.length === 0) {return { ok: true, histories: [] }}

  // ── Step 2: Batch profile + student lookups ───────────────────────────────
  const studentIds = [
    ...new Set(rows.map(r => r.student_id).filter((id): id is string => id !== null)),
  ]

  const [profilesRes, studentsRes] = await Promise.all([
    supabase.from('profiles').select('id, full_name, email').in('id', studentIds),
    supabase.from('students').select('id, student_id').in('id', studentIds),
  ])

  const profileMap = new Map<string, FlatProfileRow>()
  for (const p of (profilesRes.data ?? []) as FlatProfileRow[]) {
    profileMap.set(p.id, p)
  }

  const studentMap = new Map<string, FlatStudentRow>()
  for (const st of (studentsRes.data ?? []) as FlatStudentRow[]) {
    studentMap.set(st.id, st)
  }

  // ── Step 3: Group valid rows by student_id ────────────────────────────────
  // "Valid" = score not null, submitted_at not null, student_id not null
  type GroupMap = Map<string, FlatSubmissionRow[]>
  const byStudent: GroupMap = new Map()

  for (const row of rows) {
    if (
      row.student_id === null ||
      row.score      === null ||
      row.submitted_at === null
    ) {continue}

    const existing = byStudent.get(row.student_id)
    if (existing !== undefined) {
      existing.push(row)
    } else {
      byStudent.set(row.student_id, [row])
    }
  }

  // ── Step 4: Assemble StudentAttemptHistory for each student ───────────────
  const histories: StudentAttemptHistory[] = []

  for (const [sid, studentRows] of byStudent) {
    const profile = profileMap.get(sid)
    const student = studentMap.get(sid)

    const studentSummary = {
      id:         profile?.id        ?? sid,
      full_name:  profile?.full_name ?? 'Unknown Student',
      email:      profile?.email     ?? '',
      student_id: student?.student_id ?? null,
    }

    // Build Attempt[] sorted by attempt_no, capped at 3
    const attempts: Attempt[] = studentRows
      .slice(0, 3)                          // DB already orders by attempt_no ASC
      .map((r): Attempt => ({
        attempt_no:         r.attempt_no ?? 1,
        submission_id:      r.id,
        score:              r.score ?? 0,
        percentage:         r.percentage ?? 0,
        passed:             r.passed     ?? false,
        status:             toResultStatus(r.status),
        submitted_at:       r.submitted_at ?? new Date(0).toISOString(),
        time_spent_seconds: r.time_spent_seconds ?? 0,
      }))

    if (attempts.length === 0) {continue}

    // Best attempt: highest percentage; on tie, prefer later attempt_no
    const bestAttempt: Attempt = attempts.reduce((best, cur) =>
      cur.percentage > best.percentage ||
      (cur.percentage === best.percentage && cur.attempt_no > best.attempt_no)
        ? cur : best,
    )

    const latestAttempt: Attempt | undefined = attempts[attempts.length - 1]

    // Improvement delta: latest% − first%
    const firstAttempt: Attempt | undefined = attempts[0]
    const improvementDelta =
      attempts.length > 1 && latestAttempt && firstAttempt
        ? latestAttempt.percentage - firstAttempt.percentage
        : null

    histories.push({
      student:          studentSummary,
      attempts,
      bestAttempt,
      latestAttempt,
      improvementDelta,
      improvementTrend: deriveTrend(attempts),
    })
  }

  // Sort by best score descending (mirrors ResultsTable ranking)
  histories.sort((a, b) => b.bestAttempt.percentage - a.bestAttempt.percentage)

  return { ok: true, histories }
}

// ─────────────────────────────────────────────────────────────────────────────
// fetchAnalytics (unchanged)
// ─────────────────────────────────────────────────────────────────────────────

export interface FetchAnalyticsSuccess {
  ok: true; analytics: AggregateAnalytics | null; source: 'table' | 'computed'
}
export interface FetchAnalyticsFailure { ok: false; error: ResultsError }
export type FetchAnalyticsOutcome = FetchAnalyticsSuccess | FetchAnalyticsFailure

export async function fetchAnalytics(
  supabase:        DB,
  examId:          string,
  fallbackResults: Result[],
): Promise<FetchAnalyticsOutcome> {
  const { data, error } = await supabase
    .from('analytics')
    .select('total_attempts, average_score, highest_score, lowest_score, last_attempt_at')
    .eq('exam_id', examId)
    .is('student_id', null)
    .maybeSingle()
    .overrideTypes<AnalyticsProjection | null, { merge: false }>()

  if (error) {
    console.warn('[fetchAnalytics] falling back to computed:', error.message)
    return { ok: true, analytics: computeAnalyticsFromResults(fallbackResults), source: 'computed' }
  }

  if (data) {return { ok: true, analytics: data, source: 'table' }}

  return { ok: true, analytics: computeAnalyticsFromResults(fallbackResults), source: 'computed' }
}
