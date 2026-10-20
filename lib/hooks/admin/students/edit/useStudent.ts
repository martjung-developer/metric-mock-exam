// lib/hooks/admin/students/edit/useStudent.ts
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createClient }        from '@/lib/supabase/client'
import { getStudentById }      from '@/lib/services/admin/students/edit/student.service'
import { mapStudentToForm, mapRawToStudentData, getDisplayName } from '@/lib/utils/admin/students/edit/mappers'
import type { EditStudentForm } from '@/lib/types/admin/students/edit/student.types'

export interface UseStudentReturn {
  loading:     boolean
  error:       string | null
  displayName: string
  initialForm: EditStudentForm | null
}

export function useStudent(studentId: string): UseStudentReturn {
  const supabase   = useMemo(() => createClient(), [])
  const hasFetched = useRef(false)

  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState<string | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [initialForm, setInitialForm] = useState<EditStudentForm | null>(null)

  useEffect(() => {
    if (!studentId || hasFetched.current) {return}
    hasFetched.current = true

    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      const result = await getStudentById(supabase, studentId)

      if (cancelled) {return}

      if (!result.ok) {
        setError(result.message)
        setLoading(false)
        return
      }

      const studentData = mapRawToStudentData(result.data)
      setDisplayName(getDisplayName(result.data))
      setInitialForm(mapStudentToForm(studentData))
      setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [studentId, supabase])

  return { loading, error, displayName, initialForm }
}