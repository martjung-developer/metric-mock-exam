// lib/services/student/results/results.service.ts
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database }       from '@/lib/types/database'
import type { ResultRow, PendingRow, SummaryStats, RawResultRow, RawPendingRow } from '@/lib/types/student/results/results.types'
import { RELEASED_STATUS, PENDING_STATUSES, PAGE_SIZE } from '@/lib/constants/student/results/results'
import { getValidDurationSeconds } from '@/lib/utils/formatDuration'


type TypedClient  = SupabaseClient<Database>
type ExamTypeFilter = 'all' | 'mock' | 'practice'
type StatusFilter   = 'all' | 'passed' | 'failed'

// ── Raw stat row shape ────────────────────────────────────────────────────────
interface RawStatRow {
  percentage:         number | null
  passed:             boolean | null
  time_spent_seconds: number | null
  started_at:         string | null
  submitted_at:       string | null
  exams: { duration_minutes: number | null } | Array<{ duration_minutes: number | null }> | null
}

// ── Mapper: raw DB row → domain ResultRow ─────────────────────────────────────
function mapResultRow(row: RawResultRow): ResultRow {
  return {
    id:                 row.id,
    exam_id:            row.exam_id ?? '',
    exam_title:         row.exams?.title              ?? 'Untitled Exam',
    exam_type:          (row.exams?.exam_type === 'practice' ? 'practice' : 'mock'),
    category:           row.exams?.exam_categories?.name ?? 'Uncategorised',
    score:              row.score           ?? null,
    total_points:       row.exams?.total_points ?? 100,
    percentage:         row.percentage !== null ? Math.round(row.percentage) : null,
    passed:             row.passed          ?? null,
    status:             row.status,
    time_spent_seconds: row.time_spent_seconds ?? null,
    submitted_at:       row.submitted_at    ?? null,
    started_at:         row.started_at ?? null,
    duration_minutes:   row.exams?.duration_minutes ?? null,
  }
}

// ── fetchStats ────────────────────────────────────────────────────────────────
// ONLY reads released submissions owned by studentId.
export async function fetchStats(
  client:    TypedClient,
  studentId: string,
): Promise<SummaryStats> {
  const { data } = await client
    .from('submissions')
    .select('percentage, passed, time_spent_seconds, started_at, submitted_at, exams ( duration_minutes )')
    .eq('student_id', studentId)
    .eq('status', RELEASED_STATUS)

  if (!data || data.length === 0) {
    return { totalExams: 0, passed: 0, averageScore: null, highestScore: null, totalTimeMinutes: 0, totalTimeSeconds: null, validTimeCount: 0 }
  }

  const rows   = data as unknown as RawStatRow[]
  const scores = rows
    .map((r) => r.percentage)
    .filter((v): v is number => v !== null)
  const validDurations = rows.map((row) => getValidDurationSeconds(
    row.started_at,
    row.submitted_at,
    Array.isArray(row.exams) ? row.exams[0]?.duration_minutes : row.exams?.duration_minutes,
  )).filter((seconds): seconds is number => seconds !== null)
  const totalTimeSeconds = validDurations.reduce((sum, seconds) => sum + seconds, 0)

  return {
    totalExams:       rows.length,
    passed:           rows.filter((r) => r.passed === true).length,
    averageScore:     scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : null,
    highestScore:     scores.length > 0 ? Math.round(Math.max(...scores)) : null,
    totalTimeMinutes: Math.floor(totalTimeSeconds / 60),
    totalTimeSeconds: validDurations.length > 0 ? totalTimeSeconds : null,
    validTimeCount: validDurations.length,
  }
}

// ── fetchPending ──────────────────────────────────────────────────────────────
// Reads submitted/graded submissions owned by studentId (for the banner).
export async function fetchPending(
  client:    TypedClient,
  studentId: string,
): Promise<PendingRow[]> {
  const { data } = await client
    .from('submissions')
    .select('id, submitted_at, status, exams ( title )')
    .eq('student_id', studentId)
    .in('status', PENDING_STATUSES)
    .order('submitted_at', { ascending: false })
    .limit(10)

  return (data ?? []).map((r) => {
    const raw = r as unknown as RawPendingRow
    return {
      id:           raw.id,
      exam_title:   raw.exams?.title ?? 'Untitled Exam',
      submitted_at: raw.submitted_at ?? null,
      status:       raw.status,
    }
  })
}

// ── fetchResults ──────────────────────────────────────────────────────────────
// Paginated, server-side status filter, client-side tab/search/category filter.
// ONLY reads released submissions owned by studentId.
export interface FetchResultsParams {
  studentId:      string
  page:           number
  statusFilter:   StatusFilter
  tab:            ExamTypeFilter
  search:         string
  categoryFilter: string
}

export interface FetchResultsReturn {
  results:    ResultRow[]
  total:      number
  categories: string[]
  error:      string | null
}

export async function fetchSubmissionStatus(
  client: TypedClient,
  submissionId: string,
): Promise<{ status: string | null; error: string | null }> {
  const { data, error } = await client
    .from('submissions')
    .select('status')
    .eq('id', submissionId)
    .single()

  if (error) {
    return { status: null, error: error.message }
  }

  return { status: data?.status ?? null, error: null }
}

export async function fetchResults(
  client: TypedClient,
  params: FetchResultsParams,
): Promise<FetchResultsReturn> {
  const { studentId, page, statusFilter, tab, search, categoryFilter } = params

  let query = client
    .from('submissions')
    .select(
      `id, exam_id, score, percentage, passed, status, time_spent_seconds, started_at, submitted_at,
       exams ( title, total_points, exam_type, duration_minutes, exam_categories ( name ) )`,
      { count: 'exact' },
    )
    .eq('student_id', studentId)
    .eq('status', RELEASED_STATUS)
    .order('submitted_at', { ascending: false })

  if (statusFilter === 'passed') { query = query.eq('passed', true) }
  if (statusFilter === 'failed') { query = query.eq('passed', false) }

  const from = (page - 1) * PAGE_SIZE
  query = query.range(from, from + PAGE_SIZE - 1)

  const { data, count, error } = await query

  if (error) {
    return { results: [], total: 0, categories: [], error: 'Could not load results. Please try again.' }
  }

  let shaped = (data ?? []).map((row) => mapResultRow(row as unknown as RawResultRow))

  // Client-side secondary filters (mirrors original behaviour exactly)
  if (tab !== 'all')            { shaped = shaped.filter((r) => r.exam_type === tab) }
  if (search.trim())            { shaped = shaped.filter((r) => r.exam_title.toLowerCase().includes(search.toLowerCase()) || r.category.toLowerCase().includes(search.toLowerCase())) }
  if (categoryFilter !== 'all') { shaped = shaped.filter((r) => r.category === categoryFilter) }

  const categories = Array.from(new Set(shaped.map((r) => r.category))).sort()

  return { results: shaped, total: count ?? 0, categories, error: null }
}
