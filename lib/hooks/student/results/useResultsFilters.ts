// lib/hooks/student/results/useResultsFilters.ts
import { useState, useEffect, useCallback } from 'react'
import type { ExamTypeFilter, StatusFilter } from '@/lib/types/student/results/results.types'

export interface UseResultsFiltersReturn {
  tab:              ExamTypeFilter
  search:           string
  statusFilter:     StatusFilter
  categoryFilter:   string
  page:             number
  setTab:           (v: ExamTypeFilter) => void
  setSearch:        (v: string)         => void
  setStatusFilter:  (v: StatusFilter)   => void
  setCategoryFilter:(v: string)         => void
  setPage:          (v: number)         => void
}

export function useResultsFilters(): UseResultsFiltersReturn {
  const [tab,            setTab]            = useState<ExamTypeFilter>('all')
  const [search,         setSearch]         = useState('')
  const [statusFilter,   setStatusFilter]   = useState<StatusFilter>('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [page,           setPage]           = useState(1)

  // Reset to page 1 whenever any filter changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1)
  }, [tab, search, statusFilter, categoryFilter])

  const setTabCb            = useCallback((v: ExamTypeFilter) => setTab(v), [])
  const setSearchCb         = useCallback((v: string)         => setSearch(v), [])
  const setStatusFilterCb   = useCallback((v: StatusFilter)   => setStatusFilter(v), [])
  const setCategoryFilterCb = useCallback((v: string)         => setCategoryFilter(v), [])
  const setPageCb           = useCallback((v: number)         => setPage(v), [])

  return {
    tab, search, statusFilter, categoryFilter, page,
    setTab:            setTabCb,
    setSearch:         setSearchCb,
    setStatusFilter:   setStatusFilterCb,
    setCategoryFilter: setCategoryFilterCb,
    setPage:           setPageCb,
  }
}
