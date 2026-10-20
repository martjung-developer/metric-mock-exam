/**
 * lib/hooks/admin/students/usePrograms.ts
 *
 * Fetches the program list used for the tab filter.
 */

'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient }  from '@/lib/supabase/client'
import { getPrograms }   from '@/lib/services/admin/students/program.service'
import type { Program }  from '@/lib/types/admin/students/program.types'

export interface UseProgramsReturn {
  programs: Program[]
  loading:  boolean
}

export function usePrograms(): UseProgramsReturn {
  const supabase = useMemo(() => createClient(), [])

  const [programs, setPrograms] = useState<Program[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    void (async () => {
      const result = await getPrograms(supabase)
      setPrograms(result.programs)
      setLoading(false)
    })()
  }, [supabase])

  return { programs, loading }
}