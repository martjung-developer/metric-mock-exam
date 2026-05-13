// lib/hooks/admin/exams/results/useExamResults.ts
// ─────────────────────────────────────────────────────────────────────────────
// Fetches exam results AND attempt histories in one coordinated refresh.
// Both fetchResults (for the flat results table) and getExamResultsWithAttempts
// (for the expandable attempt panel) run in parallel to avoid sequential
// round-trips.
//
// The hook exposes:
//   - allResults / filteredResults / paginated  → existing flat table
//   - histories                                  → attempt history keyed by
//                                                  student id for O(1) lookup
//   - summary built from histories (richer stats)
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createClient }          from '@/lib/supabase/client'
import {
  fetchResults,
  fetchAnalytics,
  getExamResultsWithAttempts,
} from '@/lib/services/admin/exams/results/results.service'
import {
  computeSummaryFromHistories,
  computeAnalyticsFromHistories,
} from '@/lib/utils/admin/results/results.utils'
import { INITIAL_FILTERS } from '@/lib/types/admin/exams/results/results.types'
import type {
  Result,
  StudentAttemptHistory,
  AggregateAnalytics,
  ResultFilters,
  ResultSummary,
  PassFilter,
  StatusFilter,
} from '@/lib/types/admin/exams/results/results.types'

const PAGE_SIZE = 10

export interface UseExamResultsReturn {
  loading:   boolean
  error:     string | null
  analytics: AggregateAnalytics | null
  summary:   ResultSummary

  filters:    ResultFilters
  setSearch:  (v: string) => void
  setPass:    (v: PassFilter) => void
  setStatus:  (v: StatusFilter) => void

  page:          number
  setPage:       React.Dispatch<React.SetStateAction<number>>
  totalPages:    number
  paginated:     Result[]
  totalFiltered: number

  refresh: () => Promise<void>

  filteredResults: Result[]
  allResults:      Result[]

  /** Attempt histories keyed by student profile id for O(1) lookup */
  historiesByStudentId: Map<string, StudentAttemptHistory>
  /** Full ordered list (same order as the results table) */
  histories: StudentAttemptHistory[]
}

export function useExamResults(examId: string): UseExamResultsReturn {
  const supabase  = useMemo(() => createClient(), [])
  const isMounted = useRef(true)

  const examIdRef = useRef(examId)
  useEffect(() => { examIdRef.current = examId }, [examId])

  const [allResults,   setAllResults]   = useState<Result[]>([])
  const [histories,    setHistories]    = useState<StudentAttemptHistory[]>([])
  const [analytics,    setAnalytics]    = useState<AggregateAnalytics | null>(null)
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState<string | null>(null)
  const [filters,      setFilters]      = useState<ResultFilters>(INITIAL_FILTERS)
  const [page,         setPage]         = useState(1)

  useEffect(() => {
    isMounted.current = true
    return () => { isMounted.current = false }
  }, [])

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const refresh = useCallback(async () => {
    if (!isMounted.current) {return}
    setLoading(true)
    setError(null)

    // Run results fetch and attempt history fetch in parallel
    const [resultsOutcome, attemptsOutcome] = await Promise.all([
      fetchResults(supabase, examIdRef.current),
      getExamResultsWithAttempts(supabase, examIdRef.current),
    ])

    if (!isMounted.current) {return}

    if (!resultsOutcome.ok) {
      setError(resultsOutcome.error.message)
      setLoading(false)
      return
    }

    const results      = resultsOutcome.results
    const newHistories = attemptsOutcome.ok ? attemptsOutcome.histories : []

    // Analytics: prefer DB table, fall back to histories-derived computation
    const analyticsOutcome = await fetchAnalytics(supabase, examIdRef.current, results)

    if (!isMounted.current) {return}

    setAllResults(results)
    setHistories(newHistories)
    setAnalytics(
      analyticsOutcome.ok && analyticsOutcome.analytics !== null
        ? analyticsOutcome.analytics
        : computeAnalyticsFromHistories(newHistories),
    )
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh()
  }, [refresh])

  // ── Filter helpers ────────────────────────────────────────────────────────
  const setSearch = useCallback((v: string) => {
    setFilters((f) => ({ ...f, search: v }))
    setPage(1)
  }, [])

  const setPass = useCallback((v: PassFilter) => {
    setFilters((f) => ({ ...f, passFilter: v }))
    setPage(1)
  }, [])

  const setStatus = useCallback((v: StatusFilter) => {
    setFilters((f) => ({ ...f, statusFilter: v }))
    setPage(1)
  }, [])

  // ── Derived: filtered ─────────────────────────────────────────────────────
  const filteredResults = useMemo<Result[]>(() => {
    const q = filters.search.toLowerCase()
    return allResults.filter((r) => {
      if (
        q &&
        !r.student.full_name.toLowerCase().includes(q) &&
        !r.student.email.toLowerCase().includes(q) &&
        !(r.student.student_id ?? '').toLowerCase().includes(q)
      ) {return false}
      if (filters.passFilter === 'passed' && !r.passed)  {return false}
      if (filters.passFilter === 'failed' &&  r.passed)  {return false}
      if (filters.statusFilter !== 'all' && r.status !== filters.statusFilter) {return false}
      return true
    })
  }, [allResults, filters])

  // ── Derived: paginated ────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filteredResults.length / PAGE_SIZE))
  const paginated  = useMemo(
    () => filteredResults.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredResults, page],
  )

  // ── Derived: histories map for O(1) row lookup ────────────────────────────
  const historiesByStudentId = useMemo<Map<string, StudentAttemptHistory>>(() => {
    const m = new Map<string, StudentAttemptHistory>()
    for (const h of histories) {
      m.set(h.student.id, h)
    }
    return m
  }, [histories])

  // ── Derived: summary from histories (richer) ──────────────────────────────
  const summary = useMemo<ResultSummary>(
    () => computeSummaryFromHistories(histories),
    [histories],
  )

  return {
    loading, error, analytics, summary,
    filters, setSearch, setPass, setStatus,
    page, setPage, totalPages, paginated,
    totalFiltered: filteredResults.length,
    refresh,
    filteredResults,
    allResults,
    historiesByStudentId,
    histories,
  }
}
