// lib/services/admin/analytics/analytics.service.ts
// All Supabase data-fetching logic for the Admin Analytics Dashboard.
// No UI, no state — pure async functions with typed return values.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'
import type {
  SubmissionProjection,
  ReleasedSubmissionProjection,
  ExamProjection,
  ProfileProjection,
  ProgramProjection,
  ProgramFilterOption,
  OverviewStats,
  ProgramPerf,
  ExamPerf,
  TopStudent,
  AtRiskStudent,
  EngagementStats,
  ScoreBucket,
  ExamBucket,
  StudentBucket,
} from '@/lib/types/admin/analytics/analytics.types'

type DB = SupabaseClient<Database>

// ── Type guards ─────────────────────────────────────────────────────────────

function isPostgrestError(err: unknown): err is { message: string } {
  return (
    typeof err === 'object' &&
    err !== null &&
    'message' in err &&
    typeof (err as Record<string, unknown>)['message'] === 'string'
  )
}

function extractMessage(err: unknown): string {
  if (isPostgrestError(err)) {
    return err.message
  }
  if (err instanceof Error) {
    return err.message
  }
  return 'An unexpected error occurred.'
}

// ── fetchPrograms ───────────────────────────────────────────────────────────

export async function fetchPrograms(
  db: DB,
  schoolId?: string | null,
): Promise<ProgramFilterOption[]> {
  let query = db
    .from('programs')
    .select('id, code, name')

  if (schoolId) {
    query = query.eq('school_id', schoolId)
  }

  const { data, error } = await query.order('code')

  if (error) {
    throw new Error(extractMessage(error))
  }

  return (data ?? []) as ProgramFilterOption[]
}

// ── fetchCountStats ─────────────────────────────────────────────────────────
// Returns total student count and total exam count.

interface CountStats {
  totalStudents: number
  totalExams:    number
}

export async function fetchCountStats(
  db: DB,
  schoolId?: string | null,
  programIds?: string[],
): Promise<CountStats> {
  let studentsQuery = db.from('students').select('id', { count: 'exact', head: true })
  let examsQuery = db.from('exams').select('id', { count: 'exact', head: true })

  if (schoolId) {
    studentsQuery = studentsQuery.eq('school_id', schoolId)
  }
  if (programIds) {
    if (programIds.length === 0) {
      return { totalStudents: 0, totalExams: 0 }
    }
    examsQuery = examsQuery.in('program_id', programIds)
  }

  const [studentsRes, examsRes] = await Promise.all([
    studentsQuery,
    examsQuery,
  ])

  if (studentsRes.error) {
    throw new Error(extractMessage(studentsRes.error))
  }
  if (examsRes.error) {
    throw new Error(extractMessage(examsRes.error))
  }

  return {
    totalStudents: studentsRes.count ?? 0,
    totalExams:    examsRes.count    ?? 0,
  }
}

// ── fetchExamIdsForProgram ──────────────────────────────────────────────────
// Returns exam IDs scoped to a program (used for filtering submissions).

export async function fetchExamIdsForProgram(
  db:        DB,
  programId: string,
): Promise<string[]> {
  const { data, error } = await db
    .from('exams')
    .select('id')
    .eq('program_id', programId)

  if (error) {
    throw new Error(extractMessage(error))
  }

  return (data ?? []).map((e: Pick<ExamProjection, 'id'>) => e.id)
}

// ── fetchAllSubmissions ─────────────────────────────────────────────────────
// Fetches all terminal-status submissions (submitted + graded).

export async function fetchAllSubmissions(
  db:         DB,
  examIds?:   string[],
): Promise<SubmissionProjection[]> {
  if (examIds && examIds.length === 0) {
    return []
  }

  let query = db
    .from('submissions')
    .select('id, student_id, exam_id, status, time_spent_seconds')
    .in('status', ['submitted', 'graded', 'released'])

  if (examIds && examIds.length > 0) {
    query = query.in('exam_id', examIds)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(extractMessage(error))
  }

  return (data ?? []) as SubmissionProjection[]
}

// ── fetchReleasedSubmissions ────────────────────────────────────────────────
// Fetches only released submissions (scores visible to students).

export async function fetchReleasedSubmissions(
  db:       DB,
  examIds?: string[],
): Promise<ReleasedSubmissionProjection[]> {
  if (examIds && examIds.length === 0) {
    return []
  }

  let query = db
    .from('submissions')
    .select('id, student_id, exam_id, percentage, passed, time_spent_seconds')
    .eq('status', 'released')

  if (examIds && examIds.length > 0) {
    query = query.in('exam_id', examIds)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(extractMessage(error))
  }

  return (data ?? []) as ReleasedSubmissionProjection[]
}

// ── fetchExamMetadata ───────────────────────────────────────────────────────
// Fetches id/title/program_id for a list of exam IDs.

export async function fetchExamMetadata(
  db:      DB,
  examIds: string[],
): Promise<ExamProjection[]> {
  if (examIds.length === 0) {
    return []
  }

  const { data, error } = await db
    .from('exams')
    .select('id, title, program_id')
    .in('id', examIds)

  if (error) {
    throw new Error(extractMessage(error))
  }

  return (data ?? []) as ExamProjection[]
}

// ── fetchProfileNames ───────────────────────────────────────────────────────
// Fetches id/full_name for a list of profile (user) IDs.

export async function fetchProfileNames(
  db:         DB,
  profileIds: string[],
): Promise<ProfileProjection[]> {
  if (profileIds.length === 0) {
    return []
  }

  const { data, error } = await db
    .from('profiles')
    .select('id, full_name')
    .in('id', profileIds)

  if (error) {
    throw new Error(extractMessage(error))
  }

  return (data ?? []) as ProfileProjection[]
}

// ── fetchProgramNames ───────────────────────────────────────────────────────
// Fetches id/name for a list of program IDs.

export async function fetchProgramNames(
  db:         DB,
  programIds: string[],
): Promise<ProgramProjection[]> {
  if (programIds.length === 0) {
    return []
  }

  const { data, error } = await db
    .from('programs')
    .select('id, name')
    .in('id', programIds)

  if (error) {
    throw new Error(extractMessage(error))
  }

  return (data ?? []) as ProgramProjection[]
}

// ── computeOverview ─────────────────────────────────────────────────────────

export function computeOverview(
  totalStudents:  number,
  totalExams:     number,
  allSubs:        SubmissionProjection[],
  releasedSubs:   ReleasedSubmissionProjection[],
): OverviewStats {
  const withScore = releasedSubs.filter((r) => r.percentage !== null)

  const averageScore =
    withScore.length > 0
      ? withScore.reduce((sum, r) => sum + (r.percentage ?? 0), 0) / withScore.length
      : 0

  return {
    totalStudents,
    totalExams,
    totalAttempts:    allSubs.length,
    releasedAttempts: releasedSubs.length,
    averageScore,
  }
}

// ── computeProgramPerformance ───────────────────────────────────────────────

export function computeProgramPerformance(
  releasedSubs:  ReleasedSubmissionProjection[],
  examMetadata:  ExamProjection[],
  programNames:  ProgramProjection[],
): ProgramPerf[] {
  const examToProgramId: Record<string, string | null> = {}
  for (const e of examMetadata) {
    examToProgramId[e.id] = e.program_id
  }

  const programNameMap: Record<string, string> = {}
  for (const p of programNames) {
    programNameMap[p.id] = p.name
  }

  const buckets: Record<string, ScoreBucket> = {}

  for (const r of releasedSubs) {
    if (!r.exam_id || r.percentage === null) {
      continue
    }
    const pid = examToProgramId[r.exam_id]
    if (!pid) {
      continue
    }
    if (!buckets[pid]) {
      buckets[pid] = { sum: 0, count: 0 }
    }
    buckets[pid].sum   += r.percentage
    buckets[pid].count += 1
  }

  return Object.keys(buckets)
    .map<ProgramPerf>((pid) => ({
      program_id: pid,
      name:       programNameMap[pid] ?? pid,
      avg_score:  parseFloat((buckets[pid].sum / buckets[pid].count).toFixed(1)),
    }))
    .sort((a, b) => b.avg_score - a.avg_score)
}

// ── computeExamPerformance ──────────────────────────────────────────────────

export function computeExamPerformance(
  releasedSubs: ReleasedSubmissionProjection[],
  examMetadata: ExamProjection[],
  limit = 8,
): ExamPerf[] {
  const examTitleMap: Record<string, string> = {}
  for (const e of examMetadata) {
    examTitleMap[e.id] = e.title
  }

  const buckets: Record<string, ExamBucket> = {}

  for (const r of releasedSubs) {
    if (!r.exam_id || r.percentage === null) {
      continue
    }
    if (!buckets[r.exam_id]) {
      buckets[r.exam_id] = { sum: 0, count: 0, passed: 0 }
    }
    buckets[r.exam_id].sum   += r.percentage
    buckets[r.exam_id].count += 1
    if (r.passed === true) {
      buckets[r.exam_id].passed += 1
    }
  }

  return Object.keys(buckets)
    .map<ExamPerf>((eid) => ({
      exam_id:   eid,
      title:     (examTitleMap[eid] ?? eid).slice(0, 30),
      avg_score: parseFloat((buckets[eid].sum  / buckets[eid].count).toFixed(1)),
      pass_rate: parseFloat(((buckets[eid].passed / buckets[eid].count) * 100).toFixed(1)),
    }))
    .sort((a, b) => b.avg_score - a.avg_score)
    .slice(0, limit)
}

// ── computeStudentAnalytics ─────────────────────────────────────────────────

interface StudentAnalyticsResult {
  topStudents: TopStudent[]
  atRisk:      AtRiskStudent[]
}

export function computeStudentAnalytics(
  releasedSubs:  ReleasedSubmissionProjection[],
  profileNames:  ProfileProjection[],
  topLimit  = 8,
  riskLimit = 8,
): StudentAnalyticsResult {
  const profileNameMap: Record<string, string | null> = {}
  for (const p of profileNames) {
    profileNameMap[p.id] = p.full_name
  }

  const buckets: Record<string, StudentBucket> = {}

  for (const r of releasedSubs) {
    if (!r.student_id) {
      continue
    }
    if (!buckets[r.student_id]) {
      buckets[r.student_id] = { sumScore: 0, count: 0, attempts: 0 }
    }
    if (r.percentage !== null) {
      buckets[r.student_id].sumScore += r.percentage
      buckets[r.student_id].count   += 1
    }
    buckets[r.student_id].attempts += 1
  }

  const allStudents = Object.keys(buckets)
    .filter((sid) => buckets[sid].count > 0)
    .map((sid) => ({
      student_id:     sid,
      full_name:      profileNameMap[sid] ?? 'Unknown',
      average_score:  parseFloat((buckets[sid].sumScore / buckets[sid].count).toFixed(1)),
      total_attempts: buckets[sid].attempts,
    }))

  const topStudents: TopStudent[] = [...allStudents]
    .sort((a, b) => b.average_score - a.average_score)
    .slice(0, topLimit)

  const atRisk: AtRiskStudent[] = allStudents
    .filter(
      (s) =>
        s.average_score < 50 ||
        (s.total_attempts >= 3 && s.average_score < 65),
    )
    .sort((a, b) => a.average_score - b.average_score)
    .slice(0, riskLimit)

  return { topStudents, atRisk }
}

// ── computeEngagement ───────────────────────────────────────────────────────

export function computeEngagement(
  allSubs:      SubmissionProjection[],
  releasedSubs: ReleasedSubmissionProjection[],
): EngagementStats {
  const totalTimeMinutes = Math.round(
    allSubs.reduce((sum, r) => sum + (r.time_spent_seconds ?? 0), 0) / 60,
  )

  const totalAttempts = allSubs.length

  // Unique students across released subs for "avg attempts per student"
  const uniqueStudentIds = new Set(
    releasedSubs
      .map((r) => r.student_id)
      .filter((id): id is string => id !== null),
  )
  const uniqueStudentCount = uniqueStudentIds.size

  return {
    totalAttempts,
    releasedAttempts:      releasedSubs.length,
    totalTimeMinutes,
    avgTimePerAttempt:
      totalAttempts > 0
        ? parseFloat((totalTimeMinutes / totalAttempts).toFixed(1))
        : 0,
    avgAttemptsPerStudent:
      uniqueStudentCount > 0
        ? parseFloat((totalAttempts / uniqueStudentCount).toFixed(1))
        : 0,
  }
}
