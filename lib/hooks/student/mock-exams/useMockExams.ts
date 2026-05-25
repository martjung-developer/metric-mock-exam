// lib/hooks/student/mock-exams/useMockExams.ts
//
// FIXED:
//  1. Fetches attemptCounts per exam and populates MockExam.attemptCount
//  2. Derives 'locked' status when attemptCount >= MAX_ATTEMPTS
//  3. Exposes refresh() for manual refetch
//  4. No `any` types
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useUser }              from '@/lib/context/AuthContext'
import {
  fetchAssignedExamIds,
  fetchStudentProgramId,
  fetchPublishedMockExams,
  fetchQuestionCounts,
  fetchStudentSubmissionStatuses,
  fetchAttemptCounts,
}                               from '@/lib/services/student/mock-exams/mockExams.service'
import {
  unwrapCategory,
  unwrapProgram,
  formatDuration,
}                               from '@/lib/utils/student/mock-exams/mock-exams'
import {
  ALL_CATEGORIES,
  PAGE_SIZE,
}                               from '@/lib/constants/student/mock-exams/mock-exams'
import { MAX_ATTEMPTS }         from '@/lib/types/student/mock-exams/mock-exams'
import type {
  MockExam, ExamRaw, ExamStatus,
}                               from '@/lib/types/student/mock-exams/mock-exams'

type SortOption = 'newest' | 'oldest' | 'duration'

export function useMockExams() {
  const { user, loading: authLoading } = useUser()

  const [allExams,        setAllExams]        = useState<MockExam[]>([])
  const [dataLoading,     setDataLoading]      = useState(false)
  const [dataError,       setDataError]        = useState<string | null>(null)
  const [search,          setSearchRaw]        = useState('')
  const [debouncedSearch, setDebouncedSearch]  = useState('')
  const [category,        setCategory]         = useState(ALL_CATEGORIES)
  const [sort,            setSort]             = useState<SortOption>('newest')
  const [page,            setPage]             = useState(1)
  const [programId,       setProgramId]        = useState<string | null>(null)
  const [programReady,    setProgramReady]     = useState(false)
  const [refreshTick,     setRefreshTick]      = useState(0)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function setSearch(val: string) {
    setSearchRaw(val)
    if (debounceRef.current !== null) {clearTimeout(debounceRef.current)}
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(val)
      setPage(1)
    }, 250)
  }

  /** Manually trigger a full refetch of exams + attempts */
  const refresh = useCallback(() => {
    setRefreshTick((t) => t + 1)
  }, [])

  // ── Load student's program_id ────────────────────────────────────────────
  useEffect(() => {
    if (user === null || user === undefined) {return}
    void fetchStudentProgramId(user.id).then((pid) => {
      setProgramId(pid)
      setProgramReady(true)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps -- user identity is keyed by user?.id in this effect
  }, [user?.id])

  // ── Fetch exams ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (user === null || user === undefined || !programReady) {return}
    if (!programId) {
      setAllExams([])
      setDataLoading(false)
      setDataError('No degree program is assigned to your student account.')
      return
    }
    let cancelled = false

    async function load() {
      setDataLoading(true)
      setDataError(null)

      try {
        const [assignedIds, examData] = await Promise.all([
          fetchAssignedExamIds(user.id, programId),
          fetchPublishedMockExams(programId),
        ])

        const exams   = examData as unknown as ExamRaw[]
        const examIds = exams.map((e) => e.id)

        const [qCountMap, submissionMap, attemptCountMap] = await Promise.all([
          fetchQuestionCounts(examIds),
          fetchStudentSubmissionStatuses(user.id, examIds),
          fetchAttemptCounts(user.id, examIds),
        ])

        const mapped: MockExam[] = exams.map((exam) => {
          const cat         = unwrapCategory(exam.exam_categories)
          const prog        = unwrapProgram(exam.programs)
          const sub         = submissionMap[exam.id]
          const isAssigned  = assignedIds.has(exam.id)
          const attemptCount = attemptCountMap[exam.id] ?? 0

          let status: ExamStatus

          if (!isAssigned) {
            status = 'coming_soon'
          } else if (sub?.status === 'in_progress') {
            status = 'in_progress'
          } else if (attemptCount >= MAX_ATTEMPTS) {
            status = 'locked'
          } else if (sub?.status === 'submitted' || sub?.status === 'graded' || sub?.status === 'reviewed') {
            status = 'completed'
          } else {
            status = 'available'
          }

          return {
            id:           exam.id,
            title:        exam.title,
            shortCode:    prog?.code ?? (cat?.name?.match(/\b([A-Z])/g)?.join('') ?? 'EXAM'),
            category:     cat?.name ?? 'Uncategorized',
            status,
            questions:    qCountMap[exam.id],
            duration:     formatDuration(exam.duration_minutes),
            durationMins: exam.duration_minutes,
            submissionId: sub?.submissionId,
            inProgressAttemptNo: sub?.status === 'in_progress' ? sub.attemptNo : undefined,
            attemptCount,
          }
        })

        if (!cancelled) {
          setAllExams(mapped)
          setDataLoading(false)
        }
      } catch (err) {
        if (!cancelled) {
          setDataError(err instanceof Error ? err.message : 'Failed to load exams.')
          setDataLoading(false)
        }
      }
    }

    void load()
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- user identity is keyed by user?.id in this effect
  }, [user?.id, programId, programReady, refreshTick])

  // ── Derived ──────────────────────────────────────────────────────────────
  const categories = useMemo(() => {
    const unique = Array.from(new Set(allExams.map((e) => e.category))).sort()
    return [ALL_CATEGORIES, ...unique]
  }, [allExams])

  const filtered = useMemo(() => {
    const q = debouncedSearch.toLowerCase().trim()
    let list = allExams.filter((e) => {
      const matchCat = category === ALL_CATEGORIES || e.category === category
      const matchQ   = !q || e.title.toLowerCase().includes(q) || e.shortCode.toLowerCase().includes(q)
      return matchCat && matchQ
    })

    if (sort === 'oldest') {
      list = [...list].reverse()
    } else if (sort === 'duration') {
      list = [...list].sort((a, b) => (a.durationMins ?? 0) - (b.durationMins ?? 0))
    }

    return list
  }, [allExams, debouncedSearch, category, sort])

  const totalPages  = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage    = Math.min(page, totalPages)
  const paginated   = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const availableCount  = allExams.filter((e) => e.status === 'available').length
  const completedCount  = allExams.filter((e) => e.status === 'completed').length
  const inProgressCount = allExams.filter((e) => e.status === 'in_progress').length
  const lockedCount     = allExams.filter((e) => e.status === 'locked').length

  const loading = authLoading || dataLoading
  const error   = dataError

  return {
    // state
    search,
    setSearch,
    category,
    setCategory: (v: string) => { setCategory(v); setPage(1) },
    sort,
    setSort: (v: SortOption) => { setSort(v); setPage(1) },
    page: safePage,
    setPage,
    totalPages,
    refresh,
    // data
    paginated,
    filtered,
    categories,
    allExams,
    // stats
    availableCount,
    completedCount,
    inProgressCount,
    lockedCount,
    total: allExams.length,
    // meta
    loading,
    error,
  }
}
