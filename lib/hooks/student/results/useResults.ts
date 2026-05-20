// lib/hooks/student/results/useResults.ts
import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient }  from '@/lib/supabase/client'
import { useUser }       from '@/lib/context/AuthContext'
import { fetchStats, fetchPending, fetchResults } from '@/lib/services/student/results/results.service'
import { useResultsFilters }  from './useResultsFilters'
import { useResultsStats }    from './useResultsStats'
import { PAGE_SIZE }          from '@/lib/constants/student/results/results'
import type { ResultRow, PendingRow, SummaryStats } from '@/lib/types/student/results/results.types'

export interface UseResultsReturn {
  // data
  results:        ResultRow[]
  pendingRows:    PendingRow[]
  stats:          SummaryStats
  categories:     string[]
  passRate:       number | null
  // loading / error
  loading:        boolean
  dataLoading:    boolean
  error:          string | null
  // totals
  total:          number
  totalPages:     number
  pageNumbers:    (number | '…')[]
  // filters (forwarded)
  tab:            ReturnType<typeof useResultsFilters>['tab']
  search:         ReturnType<typeof useResultsFilters>['search']
  statusFilter:   ReturnType<typeof useResultsFilters>['statusFilter']
  categoryFilter: ReturnType<typeof useResultsFilters>['categoryFilter']
  page:           ReturnType<typeof useResultsFilters>['page']
  setTab:         ReturnType<typeof useResultsFilters>['setTab']
  setSearch:      ReturnType<typeof useResultsFilters>['setSearch']
  setStatusFilter:ReturnType<typeof useResultsFilters>['setStatusFilter']
  setCategoryFilter: ReturnType<typeof useResultsFilters>['setCategoryFilter']
  setPage:        ReturnType<typeof useResultsFilters>['setPage']
  refetch:        () => Promise<void>
}

const EMPTY_STATS: SummaryStats = {
  totalExams: 0, passed: 0, averageScore: null, highestScore: null, totalTimeMinutes: 0,
}

export function useResults(): UseResultsReturn {
  const supabase = useMemo(() => createClient(), [])
  const { user, loading: authLoading, error: authError } = useUser()

  const [results,     setResults]     = useState<ResultRow[]>([])
  const [pendingRows, setPendingRows] = useState<PendingRow[]>([])
  const [stats,       setStats]       = useState<SummaryStats>(EMPTY_STATS)
  const [categories,  setCategories]  = useState<string[]>([])
  const [dataLoading, setDataLoading] = useState(false)
  const [dataError,   setDataError]   = useState<string | null>(null)
  const [total,       setTotal]       = useState(0)

  const filters = useResultsFilters()
  const { passRate } = useResultsStats(stats)

  // ── One-time fetches (stats + pending) ─────────────────────────────────────
  const loadStaticData = useCallback(async (sid: string) => {
    const [statsData, pendingData] = await Promise.all([
      fetchStats(supabase, sid),
      fetchPending(supabase, sid),
    ])
    setStats(statsData)
    setPendingRows(pendingData)
  }, [supabase])

  // ── Paginated results fetch (re-runs on filter/page change) ────────────────
  const loadResults = useCallback(async (sid: string) => {
    setDataLoading(true)
    setDataError(null)

    const { results: rows, total: count, categories: cats, error } = await fetchResults(supabase, {
      studentId:      sid,
      page:           filters.page,
      statusFilter:   filters.statusFilter,
      tab:            filters.tab,
      search:         filters.search,
      categoryFilter: filters.categoryFilter,
    })

    if (error) {
      setDataError(error)
    } else {
      setResults(rows)
      setTotal(count)
      // Merge categories without duplicates (mirrors original behaviour)
      setCategories((prev) => Array.from(new Set([...prev, ...cats])).sort())
    }

    setDataLoading(false)
  }, [
    supabase,
    filters.page,
    filters.statusFilter,
    filters.tab,
    filters.search,
    filters.categoryFilter,
  ])

  // ── Trigger fetches once auth resolves ─────────────────────────────────────
  useEffect(() => {
    if (authLoading || !user) { return }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadStaticData(user.id)
  }, [authLoading, user, loadStaticData])

  useEffect(() => {
    if (authLoading || !user) { return }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadResults(user.id)
  }, [authLoading, user, loadResults])

  // ── Derived pagination ─────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const pageNumbers = useMemo<(number | '…')[]>(() => {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
      .filter((p) => p === 1 || p === totalPages || Math.abs(p - filters.page) <= 1)
      .reduce<(number | '…')[]>((acc, p, idx, arr) => {
        if (idx > 0 && typeof arr[idx - 1] === 'number' && p - (arr[idx - 1] as number) > 1) {
          acc.push('…')
        }
        acc.push(p)
        return acc
      }, [])
  }, [totalPages, filters.page])

  const refetch = useCallback(async () => {
    if (!user) {
      return
    }
    await Promise.all([loadStaticData(user.id), loadResults(user.id)])
  }, [loadResults, loadStaticData, user])

  return {
    results, pendingRows, stats, categories, passRate,
    loading: authLoading || dataLoading,
    dataLoading,
    error:   authError ?? dataError,
    total, totalPages, pageNumbers,
    refetch,
    ...filters,
  }
}
