// lib/hooks/admin/students/edit/useUpdateStudent.ts
'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter }               from 'next/navigation'
import { createClient }            from '@/lib/supabase/client'
import {
  updateStudentProfile,
  updateStudentRecord,
} from '@/lib/services/admin/students/edit/student.service'
import { validateEditStudentForm } from '@/lib/utils/admin/students/edit/validators'
import type {
  EditStudentForm,
  EditStudentFormErrors,
} from '@/lib/types/admin/students/edit/student.types'

export interface UseUpdateStudentReturn {
  form:        EditStudentForm | null
  formErrors:  EditStudentFormErrors
  saving:      boolean
  success:     boolean
  setForm:     React.Dispatch<React.SetStateAction<EditStudentForm | null>>
  handleChange:(field: keyof EditStudentForm, value: string) => void
  handleSubmit:(e: React.FormEvent<HTMLFormElement>) => Promise<void>
}

export function useUpdateStudent(
  studentId:   string,
  initialForm: EditStudentForm | null,
): UseUpdateStudentReturn {
  const supabase = useMemo(() => createClient(), [])
  const router   = useRouter()

  const [form,       setForm]       = useState<EditStudentForm | null>(initialForm)
  const [formErrors, setFormErrors] = useState<EditStudentFormErrors>({})
  const [saving,     setSaving]     = useState(false)
  const [success,    setSuccess]    = useState(false)

  // Sync when initialForm resolves from the fetch hook
  // (initialForm starts null while loading)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (initialForm !== null) {setForm(initialForm)}
  }, [initialForm])

  const handleChange = useCallback((field: keyof EditStudentForm, value: string) => {
    setForm((prev) => (prev ? { ...prev, [field]: value } : prev))
    setFormErrors((prev) => ({ ...prev, [field]: undefined, general: undefined }))
  }, [])

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      if (!form) {return}

      const errors = validateEditStudentForm(form)
      if (Object.keys(errors).length > 0) { setFormErrors(errors); return }

      setSaving(true)
      setFormErrors({})

      // 1. Update profile (full_name)
      const profileResult = await updateStudentProfile(supabase, studentId, {
        full_name: form.full_name.trim(),
      })

      if (!profileResult.ok) {
        setFormErrors({ general: profileResult.message })
        setSaving(false)
        return
      }

      // 2. Update student record
      const studentResult = await updateStudentRecord(supabase, studentId, {
        student_id:  form.student_id.trim()  || null,
        program_id:  form.program_id          || null,
        year_level:  form.year_level ? Number(form.year_level) : null,
        school:      form.school.trim()       || null,
        target_exam: form.target_exam.trim()  || null,
      })

      if (!studentResult.ok) {
        setFormErrors({ general: studentResult.message })
        setSaving(false)
        return
      }

      setSuccess(true)
      setSaving(false)

      setTimeout(() => {
        router.refresh()
        router.push(`/admin/students/${studentId}`)
      }, 1500)
    },
    [form, studentId, supabase, router],
  )

  return {
    form, formErrors, saving, success,
    setForm, handleChange, handleSubmit,
  }
}
