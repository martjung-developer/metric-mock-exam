/**
 * lib/hooks/admin/students/useStudentFilters.ts
 *
 * Manages all filter state (program tab, year level, search query)
 * and computes the filtered student list via useMemo.
 */

'use client'

import { useState, useMemo } from 'react'
import type { Students }      from '@/lib/types/admin/students/student.types'
import { ALL_TAB, YEAR_OPTIONS, type YearOption } from '@/lib/utils/admin/students/constants'

export interface UseStudentFiltersReturn {
  activeTab:        string
  yearFilter:       YearOption
  search:           string
  filtered:         Students[]
  setActiveTab:     (tab: string) => void
  setYearFilter:    (year: YearOption) => void
  setSearch:        (q: string) => void
}

export function useStudentFilters(students: Students[]): UseStudentFiltersReturn {
  const [activeTab,  setActiveTab]  = useState<string>(ALL_TAB)
  const [yearFilter, setYearFilter] = useState<YearOption>('All Years')
  const [search,     setSearch]     = useState<string>('')

  const filtered = useMemo<Students[]>(() => {
    const q = search.toLowerCase().trim()

    return students.filter((s) => {
      // Program tab filter
      if (activeTab !== ALL_TAB && s.program_id !== activeTab) {return false}

      // Year level filter
      if (yearFilter !== 'All Years') {
        const yr = YEAR_OPTIONS.indexOf(yearFilter)
        if (s.year_level !== yr) {return false}
      }

      // Text search
      if (q) {
        const haystack = [
          s.full_name,
          s.email,
          s.student_id,
          s.program_code,
          s.program_name,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()

        if (!haystack.includes(q)) {return false}
      }

      return true
    })
  }, [students, activeTab, yearFilter, search])

  return {
    activeTab,
    yearFilter,
    search,
    filtered,
    setActiveTab,
    setYearFilter,
    setSearch,
  }
}