// lib/hooks/admin/exams/submissions/useSubmissionDetails.ts
'use client'

import { useState, useCallback, useMemo } from 'react'
import type { Submission }          from '@/lib/types/admin/exams/submissions/submission.types'
import type { Json }                from '@/lib/types/database'
import type {
  AnswerDetail,
  AnswerStats,
}                                   from '@/lib/types/admin/exams/submissions/answer.types'
import type { QuestionType } from '@/lib/types/database'

type AnswerPayloadQuestion = {
  id: string
  question_text: string
  question_type: string
  points: number | null
  options: Json | null
  correct_answer: string | null
  explanation: string | null
  order_number: number | null
}

type AnswerPayloadAnswer = {
  id: string
  question_id: string | null
  answer_text: string | null
  is_correct: boolean | null
  points_earned: number | null
  feedback: string | null
}

type AnswersPayload = {
  questions?: AnswerPayloadQuestion[]
  answers?: AnswerPayloadAnswer[]
  error?: string
}

export interface UseSubmissionDetailsReturn {
  viewTarget:     Submission | null
  modalMode:      'grade' | 'view'
  answers:        AnswerDetail[]
  answersLoading: boolean
  answerStats:    AnswerStats
  openModal:      (sub: Submission, examId: string, mode?: 'grade' | 'view') => Promise<void>
  closeModal:     () => void
  setAnswers:     React.Dispatch<React.SetStateAction<AnswerDetail[]>>
}

export function useSubmissionDetails(): UseSubmissionDetailsReturn {
  const [viewTarget,     setViewTarget]     = useState<Submission | null>(null)
  const [modalMode,      setModalMode]      = useState<'grade' | 'view'>('view')
  const [answers,        setAnswers]        = useState<AnswerDetail[]>([])
  const [answersLoading, setAnswersLoading] = useState(false)

  const openModal = useCallback(async (
    sub: Submission,
    examId: string,
    mode: 'grade' | 'view' = 'view',
  ) => {
    setViewTarget(sub)
    setModalMode(mode)
    setAnswers([])
    setAnswersLoading(true)

    const res = await fetch(`/api/admin/exams/${examId}/submissions/${sub.id}/answers`, {
      credentials: 'include',
    })
    const payload = (await res.json().catch(() => ({}))) as AnswersPayload

    if (res.ok) {
      const questionMap = new Map(
        (payload.questions ?? []).map((q) => [
          q.id,
          {
            question_text: q.question_text,
            question_type: q.question_type as QuestionType,
            points: q.points ?? 1,
            options: Array.isArray(q.options)
              ? q.options
                  .filter((opt): opt is { label: string; text: string } =>
                    typeof opt === 'object' &&
                    opt !== null &&
                    typeof (opt as { label?: unknown }).label === 'string' &&
                    typeof (opt as { text?: unknown }).text === 'string',
                  )
                  .map((opt) => ({ label: opt.label, text: opt.text }))
              : null,
            correct_answer: q.correct_answer ?? null,
            explanation: q.explanation ?? null,
            order_number: q.order_number ?? null,
          },
        ]),
      )

      const mapped: AnswerDetail[] = (payload.answers ?? [])
        .map((ans) => {
          if (!ans.question_id) {return null}
          const question = questionMap.get(ans.question_id)
          if (!question) {return null}
          return {
            id: ans.id,
            question_id: ans.question_id,
            answer_text: ans.answer_text,
            is_correct: ans.is_correct,
            points_earned: ans.points_earned,
            feedback: ans.feedback ?? '',
            question,
          }
        })
        .filter((row): row is AnswerDetail => row !== null)
        .sort((a, b) => (a.question?.order_number ?? 999) - (b.question?.order_number ?? 999))

      setAnswers(mapped)
    }

    setAnswersLoading(false)
  }, [])

  const closeModal = useCallback(() => {
    setViewTarget(null)
    setModalMode('view')
    setAnswers([])
  }, [])

  const answerStats = useMemo<AnswerStats>(() => ({
    correct:   answers.filter(a => a.is_correct === true).length,
    incorrect: answers.filter(a => a.is_correct === false).length,
    pending:   answers.filter(a => a.is_correct === null).length,
    total:     answers.length,
  }), [answers])

  return {
    viewTarget, modalMode, answers, answersLoading, answerStats,
    openModal, closeModal, setAnswers,
  }
}
