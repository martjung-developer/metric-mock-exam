// lib/hooks/admin/exams/submissions/useSubmissions.ts
// ─────────────────────────────────────────────────────────────────────────────
// FIX H: reviewedCount now uses RELEASABLE_STATUSES constant instead of a
//   hardcoded 'reviewed' string — keeps counts consistent with useBulkGrading.
//
// FIX I: gradeableCount now uses GRADEABLE_STATUSES (which is now
//   ['submitted', 'graded']) — matches what bulkGradeAll actually processes,
//   so the "Grade All" button count is always accurate.
//
// FIX J: forceSubmit correctly handles the optimistic update. The previous
//   version updated started_at (wrong) — only status, submitted_at, and
//   time_spent_seconds should be patched.
//
// FIX K: filter dropdown now shows 'reviewed' and 'released' submissions
//   correctly because SubmissionStatus now includes all 5 values.
// ─────────────────────────────────────────────────────────────────────────────

'use client'
import { useState, useCallback, useMemo, useEffect } from 'react'
import { createClient }              from '@/lib/supabase/client'
import * as SubmissionService        from '@/lib/services/admin/exams/submissions/submission.service'
import * as ExamService              from '@/lib/services/admin/exams/submissions/exam.service'
import { mapSubmission }             from '@/lib/utils/admin/submissions/mappers'
import {
  PAGE_SIZE,
  GRADEABLE_STATUSES,
  RELEASABLE_STATUSES,
} from '@/lib/utils/admin/submissions/constants'
import type {
  Submission,
  SubmissionStatus,
} from '@/lib/types/admin/exams/submissions/submission.types'
import type { ExamInfo } from '@/lib/types/admin/exams/submissions/exam.types'

export interface UseSubmissionsReturn {
  submissions:     Submission[]
  examInfo:        ExamInfo | null
  loading:         boolean
  error:           string | null
  // Filters
  search:          string
  statusFilter:    SubmissionStatus | 'all'
  takeSort:        'asc' | 'desc'
  page:            number
  // Derived
  filtered:        Submission[]
  paginated:       Submission[]
  totalPages:      number
  // FIX H: reviewedCount = rows eligible for release (status === 'reviewed')
  reviewedCount:   number
  // FIX I: gradeableCount = rows eligible for grading (submitted + graded)
  gradeableCount:  number
  // Actions
  setSearch:       (v: string)                          => void
  setStatusFilter: (v: SubmissionStatus | 'all')        => void
  setTakeSort:     (v: 'asc' | 'desc')                  => void
  setPage:         (v: number)                          => void
  setSubmissions:  React.Dispatch<React.SetStateAction<Submission[]>>
  refetch:         () => Promise<void>
  clearError:      () => void
  // Admin force-submit action
  forceSubmit:     (submissionId: string, startedAt: string) => Promise<string | null>
}

export function useSubmissions(examId: string): UseSubmissionsReturn {
  const supabase = useMemo(() => createClient(), [])

  const [submissions,  setSubmissions]  = useState<Submission[]>([])
  const [examInfo,     setExamInfo]     = useState<ExamInfo | null>(null)
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState<string | null>(null)
  const [search,       setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState<SubmissionStatus | 'all'>('all')
  const [takeSort,     setTakeSort]     = useState<'asc' | 'desc'>('desc')
  const [page,         setPage]         = useState(1)

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)

    const [examResult, subsResult] = await Promise.all([
      ExamService.getExamInfo(supabase, examId),
      SubmissionService.getSubmissionsByExam(supabase, examId),
    ])

    if (examResult.data) {setExamInfo(examResult.data)}

    if (subsResult.error) {
      setError(subsResult.error)
      setLoading(false)
      return
    }

    setSubmissions((subsResult.data ?? []).map(mapSubmission))
    setLoading(false)
  }, [supabase, examId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refetch()
  }, [refetch])

  // ── forceSubmit ─────────────────────────────────────────────────────────────

  const forceSubmit = useCallback(async (
    submissionId: string,
    startedAt:    string,
  ): Promise<string | null> => {
    const result = await SubmissionService.forceSubmitInProgress(
      supabase,
      submissionId,
      startedAt,
    )
    if (result.error) {return result.error}

    // FIX J: Optimistic patch — only update the fields that changed.
    // Do NOT patch started_at (that value didn't change).
    setSubmissions(prev =>
      prev.map(s =>
        s.id === submissionId
          ? {
              ...s,
              status:             'submitted' as SubmissionStatus,
              submitted_at:       result.data?.submitted_at ?? null,
              time_spent_seconds: result.data?.time_spent_seconds ?? null,
            }
          : s,
      ),
    )
    return null
  }, [supabase])

  // ── Derived: filtered list ───────────────────────────────────────────────────

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    const base = submissions.filter(sub => {
      const matchSearch =
        !search ||
        sub.student.full_name.toLowerCase().includes(q) ||
        sub.student.email.toLowerCase().includes(q) ||
        (sub.student.student_id ?? '').toLowerCase().includes(q)

      const matchStatus =
        statusFilter === 'all' || sub.status === statusFilter

      return matchSearch && matchStatus
    })

    const sorted = [...base].sort((a, b) => {
      const diff = (a.attempt_no ?? 1) - (b.attempt_no ?? 1)
      return takeSort === 'asc' ? diff : -diff
    })

    return sorted
  }, [submissions, search, statusFilter, takeSort])

  // ── Derived: pagination ──────────────────────────────────────────────────────

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // ── Derived: counts ──────────────────────────────────────────────────────────

  // FIX H: Use RELEASABLE_STATUSES — only 'reviewed' qualifies for release
  const reviewedCount = useMemo(
    () => submissions.filter(s => RELEASABLE_STATUSES.includes(s.status)).length,
    [submissions],
  )

  // FIX I: Use GRADEABLE_STATUSES (['submitted', 'graded']) — matches
  // what bulkGradeAll processes, so "Grade All (N)" is always accurate
  const gradeableCount = useMemo(
    () => submissions.filter(s => GRADEABLE_STATUSES.includes(s.status)).length,
    [submissions],
  )

  return {
    submissions, examInfo, loading, error,
    search, statusFilter, takeSort, page,
    filtered, paginated, totalPages,
    reviewedCount, gradeableCount,
    setSearch, setStatusFilter, setTakeSort, setPage, setSubmissions,
    refetch, clearError: () => setError(null),
    forceSubmit,
  }
}
