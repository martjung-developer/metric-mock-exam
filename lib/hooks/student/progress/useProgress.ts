// lib/hooks/student/progress/useProgress.ts
//
// Manages all server state for the Progress page.
// Calls the service layer, computes ProgressMetrics from raw data,
// and exposes a stable refetch function.

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useUser }             from '@/lib/context/AuthContext'
import { createClient }        from '@/lib/supabase/client'
import { fetchProgressData }   from '@/lib/services/student/progress/progress.service'
import { computeStreak }       from '@/lib/utils/student/progress/computeStreak'
import { buildTimeline }       from '@/lib/utils/student/progress/buildTimeline'
import { buildCategoryAverages } from '@/lib/utils/student/progress/buildCategoryAverages'
import type {
  ProgressMetrics,
  RawSubmission,
  RawExam,
  RecentExamItem,
} from '@/lib/types/student/progress/progress.types'

// ── Hook return shape ─────────────────────────────────────────────────────────

export interface UseProgressReturn {
  metrics: ProgressMetrics | null
  loading: boolean
  error:   string | null
  refetch: () => Promise<void>
}

// ── Empty metrics sentinel ────────────────────────────────────────────────────

const EMPTY_METRICS: ProgressMetrics = {
  examsTaken:        0,
  averageScore:      0,
  highestScore:      0,
  highestScoreTitle: '—',
  passRate:          0,
  studyStreakDays:   0,
  totalStudyHours:   0,
  totalPassed:       0,
  totalFailed:       0,
  pendingCount:      0,
  scoreTimeline:     [],
  categoryAverages:  [],
  recentItems:       [],
  hasData:           false,
}

// ── Metrics computation (pure, lives here since it needs multiple utils) ──────

function computeMetrics(
  submissions: RawSubmission[],
  exams:       RawExam[],
  categories:  { id: string; name: string }[],
): ProgressMetrics {
  if (submissions.length === 0) {return EMPTY_METRICS}

  // Build lookup maps
  const categoryNameMap  = new Map(categories.map((c) => [c.id, c.name]))
  const examMap          = new Map(exams.map((e) => [e.id, e]))
  const examCategoryMap  = new Map<string, string>()
  for (const exam of exams) {
    examCategoryMap.set(
      exam.id,
      exam.category_id
        ? (categoryNameMap.get(exam.category_id) ?? 'Other')
        : 'Other',
    )
  }

  // Partition submissions
  const terminalSubs = submissions.filter((s) => s.status !== 'in_progress')
  const releasedSubs = submissions.filter((s) => s.status === 'released')
  const withScore    = releasedSubs.filter((s): s is RawSubmission & { percentage: number } =>
    s.percentage !== null,
  )
  const passedSubs  = releasedSubs.filter((s) => s.passed === true)
  const failedSubs  = releasedSubs.filter((s) => s.passed === false)
  const pendingCount = submissions.filter(
    (s) => s.status === 'submitted' || s.status === 'graded',
  ).length

  // Aggregate scores
  const averageScore = withScore.length
    ? withScore.reduce((sum, s) => sum + s.percentage, 0) / withScore.length
    : 0

  const highestScore = withScore.length
    ? Math.max(...withScore.map((s) => s.percentage))
    : 0

  const passRate = releasedSubs.length
    ? (passedSubs.length / releasedSubs.length) * 100
    : 0

  // Best exam title
  const highestSub = withScore.reduce<(RawSubmission & { percentage: number }) | null>(
    (best, s) => (!best || s.percentage > best.percentage ? s : best),
    null,
  )
  const highestScoreTitle = highestSub?.exam_id
    ? (examMap.get(highestSub.exam_id)?.title ?? '—')
    : '—'

  // Study time + streak
  const totalStudySecs = submissions.reduce(
    (sum, s) => sum + (s.time_spent_seconds ?? 0), 0,
  )
  const streakSource = submissions.filter(
    (s) => s.status !== 'in_progress' && (s.submitted_at ?? s.created_at),
  )

  // Recent items (last 5 terminal submissions)
  const recentItems: RecentExamItem[] = terminalSubs.slice(0, 5).map((s) => {
    const exam       = s.exam_id ? examMap.get(s.exam_id) : undefined
    const isReleased = s.status === 'released'
    return {
      id:          s.id,
      title:       exam?.title ?? 'Unknown Exam',
      category:    exam?.category_id
        ? (categoryNameMap.get(exam.category_id) ?? null)
        : null,
      submittedAt: s.submitted_at,
      score:       isReleased && s.percentage !== null
        ? Math.round(s.percentage)
        : null,
      passed:      isReleased ? s.passed : null,
      status:      s.status,
    }
  })

  return {
    examsTaken:        terminalSubs.length,
    averageScore:      Math.round(averageScore * 10) / 10,
    highestScore:      Math.round(highestScore * 10) / 10,
    highestScoreTitle,
    passRate:          Math.round(passRate * 10) / 10,
    studyStreakDays:   computeStreak(streakSource),
    totalStudyHours:   Math.round((totalStudySecs / 3600) * 10) / 10,
    totalPassed:       passedSubs.length,
    totalFailed:       failedSubs.length,
    pendingCount,
    scoreTimeline:     buildTimeline(submissions),
    categoryAverages:  buildCategoryAverages(submissions, examCategoryMap),
    recentItems,
    hasData:           true,
  }
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useProgress(): UseProgressReturn {
  const supabase = useMemo(() => createClient(), [])
  const { user, loading: authLoading, error: authError } = useUser()

  const [metrics,     setMetrics]     = useState<ProgressMetrics | null>(null)
  const [dataLoading, setDataLoading] = useState(false)
  const [dataError,   setDataError]   = useState<string | null>(null)

  // Abort controller prevents stale commits on fast re-fetches or unmount
  const abortRef = useRef<AbortController | null>(null)

  const refetch = useCallback(async () => {
    if (!user) {return}

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setDataLoading(true)
    setDataError(null)

    try {
      const { submissions, exams, categories } = await fetchProgressData(
        supabase,
        user.id,
      )

      if (!controller.signal.aborted) {
        setMetrics(computeMetrics(submissions, exams, categories))
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        setDataError(err instanceof Error ? err.message : 'Unexpected error.')
      }
    } finally {
      if (!controller.signal.aborted) {
        setDataLoading(false)
      }
    }
  }, [user, supabase])

  useEffect(() => {
    if (!authLoading && user) {void refetch()}
    return () => { abortRef.current?.abort() }
  }, [authLoading, user, refetch])

  useEffect(() => {
    if (!user) {
      return
    }

    const channel = supabase
      .channel(`student-progress-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'submissions',
          filter: `student_id=eq.${user.id}`,
        },
        () => { void refetch() },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [supabase, user, refetch])

  const loading = authLoading || dataLoading
  const error   = authError   ?? dataError

  return { metrics, loading, error, refetch }
}
