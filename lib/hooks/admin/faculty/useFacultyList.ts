// lib/hooks/admin/faculty/useFacultyList.ts
//
// Fetches and caches the faculty list.
// Key improvement: stale data is preserved during refetch so the UI
// does NOT flash back to a full skeleton — only the initial load shows skeleton.

import { useState, useEffect, useCallback } from 'react'
import { fetchFacultyList }                 from '@/lib/services/admin/faculty/facultyService'
import type { FacultyRow }                  from '@/lib/types/admin/faculty'

interface UseFacultyListResult {
  faculty:  FacultyRow[]
  loading:  boolean
  error:    string | null
  refetch:  () => void
}

export function useFacultyList(): UseFacultyListResult {
  const [faculty,  setFaculty]  = useState<FacultyRow[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string | null>(null)
  const [revision, setRevision] = useState(0)

  const refetch = useCallback(() => setRevision((r) => r + 1), [])

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (faculty.length === 0) {
        setLoading(true)
      }
      setError(null)

      try {
        const result = await fetchFacultyList()

        if (!cancelled) {
          if (result.success && result.faculty) {
            setFaculty(result.faculty)
          } else {
            setError(result.error ?? 'Failed to load faculty.')
          }
        }
      } catch {
        if (!cancelled) {
          setError('Unexpected error loading faculty.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void load()
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revision])

  return { faculty, loading, error, refetch }
}
