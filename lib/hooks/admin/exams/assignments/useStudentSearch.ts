/**
 * lib/hooks/admin/exams/assignments/useStudentSearch.ts
 *
 * Debounced student search hook.
 * Encapsulates all search-related state and the async query lifecycle.
 *
 * Rules:
 *   - No JSX
 *   - No Supabase calls directly (service layer only)
 *   - Correctly cancels stale requests via cleanup
 */

'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient }                  from '@/lib/supabase/client'
import { searchStudents }                from '@/lib/services/admin/exams/assignments/assignments.service'
import type { StudentSearchResult }      from '@/lib/types/admin/exams/assignments/assignments.types'

const DEBOUNCE_MS = 350

export interface UseStudentSearchReturn {
  studentSearch:   string
  setStudentSearch:(q: string) => void
  studentResults:  StudentSearchResult[]
  searching:       boolean
  clearSearch:     () => void
}

export function useStudentSearch(
  active: boolean,
  examId: string,
): UseStudentSearchReturn {
  const supabase = useMemo(() => createClient(), [])

  const [studentSearch,   setStudentSearch]   = useState('')
  const [studentResults,  setStudentResults]  = useState<StudentSearchResult[]>([])
  const [searching,       setSearching]       = useState(false)

  useEffect(() => {
    // Don't search if panel is in program mode or query is empty
    if (!active || !studentSearch.trim()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStudentResults([])
      return
    }

    let cancelled = false

    const timer = setTimeout(async () => {
      setSearching(true)

      const { results } = await searchStudents(supabase, studentSearch.trim(), examId)

      if (!cancelled) {
        setStudentResults(results)
        setSearching(false)
      }
    }, DEBOUNCE_MS)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [supabase, studentSearch, active, examId])

  function clearSearch() {
    setStudentSearch('')
    setStudentResults([])
  }

  return {
    studentSearch,
    setStudentSearch,
    studentResults,
    searching,
    clearSearch,
  }
}
