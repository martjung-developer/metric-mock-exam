// lib/hooks/admin/students/create/usePrograms.ts
//
// Fetches programs once on mount and provides loading state.
// Memoises the Supabase client to prevent recreation on re-renders.

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getPrograms }  from '@/lib/services/admin/students/program.service'
import type { Program } from '@/lib/types/admin/students/program.types'

export interface UseProgramsReturn {
  programs: Program[]
  loading:  boolean
}

export function usePrograms(): UseProgramsReturn {
  const supabase = useMemo(() => createClient(), [])

  const [programs, setPrograms] = useState<Program[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    let cancelled = false

    getPrograms(supabase)
      .then((data) => { if (!cancelled) {setPrograms(data)} })
      .catch((err) => { console.warn('Failed to load programs:', err) })
      .finally(() => { if (!cancelled) {setLoading(false)} })

    return () => { cancelled = true }
  }, [supabase])

  return { programs, loading }
}