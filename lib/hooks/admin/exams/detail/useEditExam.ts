// lib/hooks/admin/exams/detail/useEditExam.ts
// Manages edit modal state, form state, validation, and the Supabase update.
// Receives exam + reference data via parameters (no internal fetching).

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  buildUpdatePayload,
  updateExam,
} from '@/lib/services/admin/exams/detail/exam.service'
import {
  validateEditForm,
  isFormValid,
} from '@/lib/utils/admin/exams/detail/validators'
import type {
  ExamDetail,
  EditForm,
  EditFormErrors,
  CategoryOption,
  ProgramOption,
  ToastState,
  UseEditExamReturn,
} from '@/lib/types/admin/exams/detail/exam.types'

interface UseEditExamParams {
  exam:       ExamDetail | null
  categories: CategoryOption[]
  programs:   ProgramOption[]
  setExam:    (updater: (prev: ExamDetail | null) => ExamDetail | null) => void
}

export function useEditExam({
  exam,
  categories,
  programs,
  setExam,
}: UseEditExamParams): UseEditExamReturn {
  const [showEdit,   setShowEdit]   = useState(false)
  const [editForm,   setEditForm]   = useState<EditForm | null>(null)
  const [editErrors, setEditErrors] = useState<EditFormErrors>({})
  const [editSaving, setEditSaving] = useState(false)
  const [toast,      setToast]      = useState<ToastState | null>(null)

  // ── openEdit ──────────────────────────────────────────────────────────────

  const openEdit = useCallback(() => {
    if (!exam) {return}
    setEditErrors({})
    setEditForm({
      title:            exam.title,
      description:      exam.description ?? '',
      category_id:      exam.category?.id ?? '',
      program_id:       exam.program?.id  ?? '',
      exam_type:        exam.exam_type,
      duration_minutes: String(exam.duration_minutes),
      total_points:     String(exam.total_points),
      passing_score:    String(exam.passing_score),
      is_published:     exam.is_published,
    })
    setShowEdit(true)
  }, [exam])

  // ── closeEdit ─────────────────────────────────────────────────────────────

  const closeEdit = useCallback(() => {
    if (editSaving) {return}
    setShowEdit(false)
    setEditForm(null)
    setEditErrors({})
  }, [editSaving])

  // ── setEditField ──────────────────────────────────────────────────────────
  // Generic typed setter — no per-field onChange handlers needed in the modal.

  const setEditField = useCallback(
    <K extends keyof EditForm>(field: K, value: EditForm[K]) => {
      setEditForm((prev) => (prev ? { ...prev, [field]: value } : prev))
    },
    [],
  )

  // ── saveEdit ──────────────────────────────────────────────────────────────

  const saveEdit = useCallback(async () => {
    if (!exam || !editForm) {return}

    // 1. Validate
    const errors = validateEditForm(editForm)
    setEditErrors(errors)
    if (!isFormValid(errors)) {return}

    // 2. Guard double-submission
    if (editSaving) {return}

    setEditSaving(true)

    try {
      const db      = createClient()
      const payload = buildUpdatePayload(editForm)

      await updateExam(db, exam.id, payload)

      // 3. Optimistic update — resolve display names from local reference data
      const newCat  = categories.find((c) => c.id === editForm.category_id)
      const newProg = programs.find((p)   => p.id === editForm.program_id)

      setExam((prev) =>
        prev
          ? {
              ...prev,
              title:            payload.title            ?? prev.title,
              description:      payload.description      ?? null,
              exam_type:        payload.exam_type        ?? prev.exam_type,
              duration_minutes: payload.duration_minutes ?? prev.duration_minutes,
              total_points:     payload.total_points     ?? prev.total_points,
              passing_score:    payload.passing_score    ?? prev.passing_score,
              is_published:     payload.is_published     ?? prev.is_published,
              updated_at:       payload.updated_at       ?? prev.updated_at,
              category: newCat
                ? { id: newCat.id, name: newCat.name }
                : null,
              program: newProg
                ? { id: newProg.id, code: newProg.code, name: newProg.name }
                : null,
            }
          : prev,
      )

      closeEdit()
      setToast({
        message: `"${payload.title ?? exam.title}" updated successfully.`,
        type:    'success',
      })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to save. Please try again.'
      setToast({ message, type: 'error' })
    } finally {
      setEditSaving(false)
    }
  }, [exam, editForm, editSaving, categories, programs, setExam, closeEdit])

  // ── clearToast ────────────────────────────────────────────────────────────

  const clearToast = useCallback(() => setToast(null), [])

  return {
    showEdit,
    editForm,
    editErrors,
    editSaving,
    toast,
    openEdit,
    closeEdit,
    setEditField,
    saveEdit,
    clearToast,
  }
}