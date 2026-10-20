// lib/hooks/admin/exams/questions/useQuestions.ts
//
// Manages the list of questions for a given exam.
// Handles fetch, optimistic create/update/delete, loading, and error state.
// Makes zero direct Supabase calls — delegates entirely to the service layer.

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import * as QuestionsService from '@/lib/services/admin/exams/questions/questions.service'
import type {
  Question,
  ToastState,
} from '@/lib/types/admin/exams/questions/questions.types'
import { calcMaxOrderNumber } from '@/lib/utils/admin/questions/helpers'
import { isAutoGraded } from '@/lib/types/admin/exams/questions/questions.types'

// ── Return type ────────────────────────────────────────────────────────────

export interface UseQuestionsReturn {
  questions:  Question[]
  loading:    boolean
  error:      string | null
  toast:      ToastState | null
  dismissToast: () => void
  refetch:    () => Promise<void>
  createQuestion: (payload: CreatePayload) => Promise<boolean>
  updateQuestion: (payload: UpdatePayload) => Promise<boolean>
  deleteQuestion: (id: string)            => Promise<boolean>
  selectedQuestionIds: Set<string>
  toggleQuestionSelection: (id: string) => void
  setSelectedQuestions: (ids: string[]) => void
  clearQuestionSelection: () => void
  deleteSelectedQuestions: () => Promise<boolean>
  bulkDeleting: boolean
}

export interface CreatePayload {
  question_text:  string
  question_type:  Question['question_type']
  points:         number
  options:        Question['options']
  correct_answer: string
  image_url:      string
  explanation:    string
}

export interface UpdatePayload extends CreatePayload {
  id: string
}

// ── Hook ───────────────────────────────────────────────────────────────────

export function useQuestions(examId: string): UseQuestionsReturn {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState<string | null>(null)
  const [toast,     setToast]     = useState<ToastState | null>(null)
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)

  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Toast helpers ────────────────────────────────────────────────────────

  const showToast = useCallback((next: ToastState) => {
    if (toastTimerRef.current) {clearTimeout(toastTimerRef.current)}
    setToast(next)
    toastTimerRef.current = setTimeout(() => setToast(null), 3000)
  }, [])

  const dismissToast = useCallback(() => {
    if (toastTimerRef.current) {clearTimeout(toastTimerRef.current)}
    setToast(null)
  }, [])

  useEffect(() => () => {
    if (toastTimerRef.current) {clearTimeout(toastTimerRef.current)}
  }, [])

  // ── Fetch ────────────────────────────────────────────────────────────────

  const fetchQuestions = useCallback(async () => {
    setLoading(true)
    setError(null)

    const { data, error: fetchErr } = await QuestionsService.fetchQuestionsByExamId(examId)

    if (fetchErr || !data) {
      setError('Could not load questions.')
    } else {
      setQuestions(data)
    }
    setLoading(false)
  }, [examId])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      const { data, error: fetchErr } = await QuestionsService.fetchQuestionsByExamId(examId)
      if (cancelled) {return}
      if (fetchErr || !data) {
        setError('Could not load questions.')
      } else {
        setQuestions(data)
      }
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [examId])

  // ── Create (optimistic) ──────────────────────────────────────────────────
  //
  // We send the request, then splice in the returned record if it succeeds.
  // If it fails we show an error without mutating local state.

  const createQuestion = useCallback(
    async (payload: CreatePayload): Promise<boolean> => {
      const maxOrder = calcMaxOrderNumber(questions)

      const { data: created, error: createErr } = await QuestionsService.createQuestion({
        examId:         examId,
        question_text:  payload.question_text,
        question_type:  payload.question_type,
        points:         payload.points,
        options:        payload.question_type === 'multiple_choice' ? payload.options : null,
        correct_answer: isAutoGraded(payload.question_type)
          ? (payload.correct_answer || null)
          : null,
        image_url:      payload.image_url || null,
        explanation:    payload.explanation || null,
        order_number:   maxOrder + 1,
      })

      if (createErr || !created) {
        showToast({ message: 'Could not create question.', type: 'error' })
        return false
      }

      setQuestions((prev) => [...prev, created])
      showToast({ message: 'Question added.', type: 'success' })
      return true
    },
    [examId, questions, showToast],
  )

  // ── Update (optimistic) ──────────────────────────────────────────────────

  const updateQuestion = useCallback(
    async (payload: UpdatePayload): Promise<boolean> => {
      // Optimistic patch
      const original = questions.find((q) => q.id === payload.id) ?? null

      const patched: Partial<Question> = {
        question_text:  payload.question_text,
        question_type:  payload.question_type,
        points:         payload.points,
        options:        payload.question_type === 'multiple_choice' ? payload.options : null,
        correct_answer: isAutoGraded(payload.question_type)
          ? (payload.correct_answer || null)
          : null,
        image_url:      payload.image_url || null,
        explanation:    payload.explanation || null,
      }

      setQuestions((prev) =>
        prev.map((q) => (q.id === payload.id ? { ...q, ...patched } : q)),
      )

      const { error: updateErr } = await QuestionsService.updateQuestion({
        id:             payload.id,
        question_text:  payload.question_text,
        question_type:  payload.question_type,
        points:         payload.points,
        options:        patched.options ?? null,
        correct_answer: patched.correct_answer ?? null,
        image_url:      patched.image_url ?? null,
        explanation:    patched.explanation ?? null,
      })

      if (updateErr) {
        // Roll back
        if (original) {
          setQuestions((prev) =>
            prev.map((q) => (q.id === payload.id ? original : q)),
          )
        }
        showToast({ message: 'Could not update question.', type: 'error' })
        return false
      }

      showToast({ message: 'Question updated.', type: 'success' })
      return true
    },
    [questions, showToast],
  )

  // ── Delete (optimistic) ──────────────────────────────────────────────────

  const deleteQuestion = useCallback(
    async (id: string): Promise<boolean> => {
      const snapshot = questions

      // Optimistic remove
      setQuestions((prev) => prev.filter((q) => q.id !== id))

      const { error: deleteErr } = await QuestionsService.deleteQuestion(id)

      if (deleteErr) {
        // Roll back
        setQuestions(snapshot)
        showToast({ message: 'Could not delete question.', type: 'error' })
        return false
      }

      setSelectedQuestionIds((previous) => {
        const next = new Set(previous)
        next.delete(id)
        return next
      })
      showToast({ message: 'Question deleted.', type: 'success' })
      return true
    },
    [questions, showToast],
  )

  const toggleQuestionSelection = useCallback((id: string) => {
    setSelectedQuestionIds((previous) => {
      const next = new Set(previous)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }, [])

  const setSelectedQuestions = useCallback((ids: string[]) => {
    setSelectedQuestionIds(new Set(ids))
  }, [])

  const clearQuestionSelection = useCallback(() => setSelectedQuestionIds(new Set()), [])

  const deleteSelectedQuestions = useCallback(async (): Promise<boolean> => {
    const ids = [...selectedQuestionIds]
    if (ids.length === 0) { return false }

    setBulkDeleting(true)
    try {
      const { error: deleteErr } = await QuestionsService.deleteQuestions(ids, examId)
      if (deleteErr !== null) {
        showToast({ message: `Could not delete selected questions: ${deleteErr}`, type: 'error' })
        return false
      }

      clearQuestionSelection()
      await fetchQuestions()
      showToast({ message: `${ids.length} question${ids.length === 1 ? '' : 's'} deleted.`, type: 'success' })
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown deletion error.'
      showToast({ message: `Could not delete selected questions: ${message}`, type: 'error' })
      return false
    } finally {
      setBulkDeleting(false)
    }
  }, [selectedQuestionIds, examId, showToast, clearQuestionSelection, fetchQuestions])

  return {
    questions,
    loading,
    error,
    toast,
    dismissToast,
    refetch:  fetchQuestions,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    selectedQuestionIds,
    toggleQuestionSelection,
    setSelectedQuestions,
    clearQuestionSelection,
    deleteSelectedQuestions,
    bulkDeleting,
  }
}
