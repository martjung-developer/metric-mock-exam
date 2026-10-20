// lib/hooks/admin/students/edit/usePrograms.ts
'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient }  from '@/lib/supabase/client'
import { getPrograms }   from '@/lib/services/admin/students/program.service'
import type { ProgramOption } from '@/lib/types/admin/students/edit/program.types'

export function usePrograms(): ProgramOption[] {
  const supabase = useMemo(() => createClient(), [])
  const [programs, setPrograms] = useState<ProgramOption[]>([])

  useEffect(() => {
    getPrograms(supabase).then(setPrograms)
  }, [supabase])

  return programs
}