// lib/hooks/admin/exams/create/useCreateExam.ts
//
// FIXED:
//  1. DEFAULT_FORM: program → program_id (stores UUID, not text)
//  2. validate():   checks program_id, not program
//  3. submit():     passes form with program_id to buildInsertPayload
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useCallback }   from 'react'
import { useRouter }               from 'next/navigation'
import { createClient }            from '@/lib/supabase/client'
import {
  buildInsertPayload,
  insertExam,
  getCurrentUserId,
}                                  from '@/lib/services/admin/exams/create/exam.service'
import type {
  ExamFormData,
  ExamFormErrors,
  UseCreateExamReturn,
}                                  from '@/lib/types/admin/exams/create/exam.types'

// ── Default form state ────────────────────────────────────────────────────────

const DEFAULT_FORM: ExamFormData = {
  title:            '',
  description:      '',
  category_id:      '',
  program_id:       '',   // ← was "program: ''" — now correctly stores a UUID
  exam_type:        'mock',
  duration_minutes: '60',
  total_points:     '100',
  passing_score:    '75',
  is_published:     false,
}

// ── Validation ────────────────────────────────────────────────────────────────

function validate(data: ExamFormData): ExamFormErrors {
  const errors: ExamFormErrors = {}

  if (!data.title.trim()) {
    errors.title = 'Exam title is required.'
  }
  if (!data.category_id) {
    errors.category_id = 'Please select a category.'
  }
  if (!data.program_id) {
    errors.program_id = 'Please select a program.'   // ← was errors.program
  }
  if (!data.exam_type) {
    errors.exam_type = 'Please select an exam type.'
  }

  const dur = Number(data.duration_minutes)
  if (!data.duration_minutes || isNaN(dur) || dur < 1) {
    errors.duration_minutes = 'Enter a valid duration (min 1 minute).'
  }

  const pts = Number(data.total_points)
  if (!data.total_points || isNaN(pts) || pts < 1) {
    errors.total_points = 'Enter a valid total points value.'
  }

  const pass = Number(data.passing_score)
  if (!data.passing_score || isNaN(pass) || pass < 0 || pass > 100) {
    errors.passing_score = 'Passing score must be 0–100.'
  }

  return errors
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useCreateExam(): UseCreateExamReturn {
  const router = useRouter()

  const [form,        setForm]        = useState<ExamFormData>(DEFAULT_FORM)
  const [errors,      setErrors]      = useState<ExamFormErrors>({})
  const [submitting,  setSubmitting]  = useState(false)
  const [success,     setSuccess]     = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const setField = useCallback(
    <K extends keyof ExamFormData>(field: K, value: ExamFormData[K]) => {
      setForm((prev) => ({ ...prev, [field]: value }))
      // Clear the field error as the user corrects it
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    },
    [],
  )

  const submit = useCallback(
    async (e: React.FormEvent<Element>) => {
      e.preventDefault()

      const errs = validate(form)
      setErrors(errs)
      if (Object.keys(errs).length > 0) {return}

      if (submitting) {return}
      setSubmitting(true)
      setSubmitError(null)

      try {
        const supabase = createClient()
        const userId   = await getCurrentUserId(supabase)
        const payload  = buildInsertPayload(form, userId)
        await insertExam(supabase, payload)

        setSuccess(true)
        setTimeout(() => router.push('/admin/exams'), 1500)
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Could not save exam. Please try again.'
        setSubmitError(message)
        setSubmitting(false)
      }
    },
    [form, submitting, router],
  )

  return { form, errors, submitting, success, submitError, setField, submit }
}