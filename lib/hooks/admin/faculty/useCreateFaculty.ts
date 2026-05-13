// lib/hooks/admin/faculty/useCreateFaculty.ts
//
// Wraps the createFaculty service call with loading / error state.

import { useState, useCallback } from 'react'
import { createFaculty }         from '@/lib/services/admin/faculty/facultyService'
import type {
  CreateFacultyPayload,
  CreateFacultyResponse,
} from '@/lib/types/admin/faculty'

interface UseCreateFacultyResult {
  create:   (payload: CreateFacultyPayload) => Promise<CreateFacultyResponse>
  loading:  boolean
  error:    string | null
  clearError: () => void
}

export function useCreateFaculty(): UseCreateFacultyResult {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  const clearError = useCallback(() => setError(null), [])

  const create = useCallback(
    async (payload: CreateFacultyPayload): Promise<CreateFacultyResponse> => {
      setLoading(true)
      setError(null)

      try {
        const result = await createFaculty(payload)
        if (!result.success) {
          setError(result.error ?? 'Failed to create faculty.')
        }
        return result
      } catch {
        const msg = 'Unexpected error creating faculty.'
        setError(msg)
        return { success: false, error: msg }
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  return { create, loading, error, clearError }
}
