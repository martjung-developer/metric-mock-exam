/**
 * lib/hooks/admin/students/useStudents.ts
 *
 * Manages student data fetching, loading, error, and window-focus refetch.
 * All Supabase calls delegated to the service layer.
 */

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient }              from '@/lib/supabase/client'
import { getStudentsWithProfiles }   from '@/lib/services/admin/students/student.service'
import type { Students }              from '@/lib/types/admin/students/student.types'

export interface UseStudentsReturn {
  students: Students[]
  loading:  boolean
  error:    string | null
  refetch:  () => void
}

export function useStudents(): UseStudentsReturn {
  const supabase = useMemo(() => createClient(), [])

  const [students, setStudents] = useState<Students[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string | null>(null)

  const fetchStudents = useCallback(async () => {
    setLoading(true)
    setError(null)

    const result = await getStudentsWithProfiles(supabase)

    if (result.error) {
      setError(result.error)
    } else {
      setStudents(result.students)
    }
    setLoading(false)
  }, [supabase])

  // Initial load
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchStudents()
  }, [fetchStudents])

  // Re-fetch on window focus (catches edits made in other tabs/pages)
  useEffect(() => {
    function onFocus() { void fetchStudents() }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [fetchStudents])

  return {
    students,
    loading,
    error,
    refetch: fetchStudents,
  }
}
