// lib/hooks/admin/exams/questions/useQuestionForm.ts
//
// Isolated form state for the create/edit modal.
// Handles type switching, option management, validation, and reset.
// No Supabase calls — pure form logic.

'use client'

import { useCallback, useState } from 'react'
import type {
  ModalMode,
  Question,
  QuestionForm,
  QuestionOption,
  QuestionType,
} from '@/lib/types/admin/exams/questions/questions.types'
import { BLANK_FORM } from '@/lib/types/admin/exams/questions/questions.types'
import { nextOptionLabel } from '@/lib/utils/admin/questions/helpers'
import { validateQuestion } from '@/lib/utils/admin/questions/validateQuestion'

// ── Return type ────────────────────────────────────────────────────────────

export interface UseQuestionFormReturn {
  form:           QuestionForm
  formError:      string | null
  modalMode:      ModalMode

  // Modal control
  openCreate:  (defaultType?: QuestionType) => void
  openEdit:    (question: Question)         => void
  closeModal:  ()                           => void

  // Field setters
  setQuestionText:  (v: string)      => void
  setPoints:        (v: number)      => void
  setExplanation:   (v: string)      => void
  setCorrectAnswer: (v: string)      => void
  setImageUrl:      (v: string)      => void
  handleTypeChange: (t: QuestionType) => void

  // Option management
  handleOptionText: (index: number, text: string) => void
  addOption:        ()                             => void
  removeOption:     (index: number)                => void

  // Submission
  validateAndGetPayload: () => QuestionForm | null
}

// ── Hook ───────────────────────────────────────────────────────────────────

export function useQuestionForm(): UseQuestionFormReturn {
  const [form,      setForm]      = useState<QuestionForm>(BLANK_FORM)
  const [formError, setFormError] = useState<string | null>(null)
  const [modalMode, setModalMode] = useState<ModalMode>({ open: false })

  // ── Modal control ────────────────────────────────────────────────────────

  const openCreate = useCallback((defaultType: QuestionType = 'multiple_choice') => {
    setForm({ ...BLANK_FORM, question_type: defaultType })
    setFormError(null)
    setModalMode({ open: true, mode: 'create', defaultType })
  }, [])

  const openEdit = useCallback((question: Question) => {
    setForm({
      question_text:  question.question_text,
      question_type:  question.question_type,
      points:         question.points,
      options:        question.options ?? [
        { label: 'A', text: '' },
        { label: 'B', text: '' },
        { label: 'C', text: '' },
        { label: 'D', text: '' },
      ],
      correct_answer: question.correct_answer ?? '',
      image_url:      question.image_url      ?? '',
      explanation:    question.explanation    ?? '',
    })
    setFormError(null)
    setModalMode({ open: true, mode: 'edit', target: question })
  }, [])

  const closeModal = useCallback(() => {
    setModalMode({ open: false })
    setFormError(null)
  }, [])

  // ── Type switching ───────────────────────────────────────────────────────
  // Preserve options when switching to/from MCQ; reset correct_answer.

  const handleTypeChange = useCallback((type: QuestionType) => {
    setForm((prev) => ({
      ...prev,
      question_type:  type,
      correct_answer: '',
      options:
        type === 'multiple_choice' && prev.options.length > 0
          ? prev.options
          : [
              { label: 'A', text: '' },
              { label: 'B', text: '' },
              { label: 'C', text: '' },
              { label: 'D', text: '' },
            ],
    }))
  }, [])

  // ── Simple field setters ─────────────────────────────────────────────────

  const setQuestionText  = useCallback((v: string) => setForm((p) => ({ ...p, question_text: v })), [])
  const setPoints        = useCallback((v: number) => setForm((p) => ({ ...p, points: v })), [])
  const setExplanation   = useCallback((v: string) => setForm((p) => ({ ...p, explanation: v })), [])
  const setCorrectAnswer = useCallback((v: string) => setForm((p) => ({ ...p, correct_answer: v })), [])
  const setImageUrl      = useCallback((v: string) => setForm((p) => ({ ...p, image_url: v })), [])

  // ── Option management ────────────────────────────────────────────────────

  const handleOptionText = useCallback((index: number, text: string) => {
    setForm((prev) => {
      const opts = [...prev.options]
      const existing = opts[index]
      if (!existing) {return prev}
      opts[index] = { ...existing, text }
      return { ...prev, options: opts }
    })
  }, [])

  const addOption = useCallback(() => {
    setForm((prev) => {
      if (prev.options.length >= 6) {return prev}
      const label  = nextOptionLabel(prev.options.length)
      const newOpt: QuestionOption = { label, text: '' }
      return { ...prev, options: [...prev.options, newOpt] }
    })
  }, [])

  const removeOption = useCallback((index: number) => {
    setForm((prev) => {
      const removed = prev.options[index]
      const nextOptions = prev.options.filter((_, i) => i !== index)
      const nextAnswer  =
        removed && prev.correct_answer === removed.label ? '' : prev.correct_answer
      return { ...prev, options: nextOptions, correct_answer: nextAnswer }
    })
  }, [])

  // ── Validate + expose form ───────────────────────────────────────────────
  // Returns the current form if valid, null otherwise (and sets formError).

  const validateAndGetPayload = useCallback((): QuestionForm | null => {
    const result = validateQuestion(form)
    if (!result.valid) {
      setFormError(result.errors[0].message)
      return null
    }
    setFormError(null)
    return form
  }, [form])

  return {
    form,
    formError,
    modalMode,

    openCreate,
    openEdit,
    closeModal,

    setQuestionText,
    setPoints,
    setExplanation,
    setCorrectAnswer,
    setImageUrl,
    handleTypeChange,

    handleOptionText,
    addOption,
    removeOption,

    validateAndGetPayload,
  }
}
