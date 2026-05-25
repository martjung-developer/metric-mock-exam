// lib/hooks/admin/exams/submissions/useSubmissionDetails.ts
'use client'

import { useState, useCallback, useMemo } from 'react'
import { createClient }             from '@/lib/supabase/client'
import type { Submission }          from '@/lib/types/admin/exams/submissions/submission.types'
import type {
  AnswerDetail,
  AnswerStats,
}                                   from '@/lib/types/admin/exams/submissions/answer.types'
import type { QuestionType } from '@/lib/types/database'

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
  const supabase = useMemo(() => createClient(), [])

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

    const [questionsRes, answersRes] = await Promise.all([
      supabase
        .from('questions')
        .select('id, question_text, question_type, points, options, correct_answer, explanation, order_number')
        .eq('exam_id', examId),
      supabase
        .from('answers')
        .select('id, question_id, answer_text, is_correct, points_earned, feedback')
        .eq('submission_id', sub.id),
    ])

    if (!questionsRes.error && !answersRes.error) {
      const questionMap = new Map(
        (questionsRes.data ?? []).map((q) => [
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

      const mapped: AnswerDetail[] = (answersRes.data ?? [])
        .map((ans) => {
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
  }, [supabase])

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
