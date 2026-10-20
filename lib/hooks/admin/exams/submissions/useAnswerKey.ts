// lib/hooks/admin/exams/submissions/useAnswerKey.ts
'use client'
import { useState, useCallback, useMemo } from 'react'
import { createClient }          from '@/lib/supabase/client'
import * as SubmissionService    from '@/lib/services/admin/exams/submissions/submission.service'
import { mapAnswerKeyEntry }     from '@/lib/utils/admin/submissions/mappers'
import type { AnswerKeyEntry }   from '@/lib/types/admin/exams/submissions/answer.types'

export interface UseAnswerKeyReturn {
  answerKey:        AnswerKeyEntry[]
  showAnswerKey:    boolean
  answerKeyLoading: boolean
  keyMap:           Record<string, string | null>
  loadAnswerKey:    () => Promise<void>
  setShowAnswerKey: (v: boolean) => void
  updateKeyEntry:   (questionId: string, value: string | null) => void
}

export function useAnswerKey(examId: string): UseAnswerKeyReturn {
  const supabase = useMemo(() => createClient(), [])

  const [answerKey,        setAnswerKey]        = useState<AnswerKeyEntry[]>([])
  const [showAnswerKey,    setShowAnswerKey]     = useState(false)
  const [answerKeyLoading, setAnswerKeyLoading]  = useState(false)

  const loadAnswerKey = useCallback(async () => {
    setAnswerKeyLoading(true)
    const result = await SubmissionService.getAnswerKey(supabase, examId)
    if (result.data) {
      setAnswerKey(
        result.data
          .map(mapAnswerKeyEntry)
          .filter((e): e is AnswerKeyEntry => e !== null),
      )
    }
    setAnswerKeyLoading(false)
  }, [supabase, examId])

  const updateKeyEntry = useCallback((questionId: string, value: string | null) => {
    setAnswerKey(prev =>
      prev.map(k =>
        k.question_id === questionId ? { ...k, correct_answer: value } : k,
      ),
    )
  }, [])

  // Convenience map used by grading logic: questionId → correct_answer
  const keyMap = useMemo<Record<string, string | null>>(() => {
    const m: Record<string, string | null> = {}
    for (const e of answerKey) {m[e.question_id] = e.correct_answer}
    return m
  }, [answerKey])

  return {
    answerKey, showAnswerKey, answerKeyLoading, keyMap,
    loadAnswerKey, setShowAnswerKey, updateKeyEntry,
  }
}