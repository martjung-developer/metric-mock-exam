// lib/hooks/admin/exams/submissions/useGrading.ts
// ─────────────────────────────────────────────────────────────────────────────
// FIX L: gradeSubmission now uses `satisfies SubmissionUpdate` for the
//   updateSubmission call, eliminating the implicit cast that was silently
//   accepting invalid status strings when database.ts had the old 3-value enum.
//
// FIX M: previewScore guards against division by zero AND negative earned
//   values (e.g. if a question has no correct_answer and earns 0 pts).
// ─────────────────────────────────────────────────────────────────────────────

'use client'
import { useState, useCallback, useMemo } from 'react'
import { createClient }             from '@/lib/supabase/client'
import * as ExamService             from '@/lib/services/admin/exams/submissions/exam.service'
import * as SubmissionService       from '@/lib/services/admin/exams/submissions/submission.service'
import { gradeAnswer, sumPoints, computeScore, computeTosScore } from '@/lib/utils/admin/submissions/grading'
import { AUTO_TYPES }               from '@/lib/utils/admin/submissions/constants'
import type { GradingMode, Submission } from '@/lib/types/admin/exams/submissions/submission.types'
import type { AnswerDetail }        from '@/lib/types/admin/exams/submissions/answer.types'
import type { ExamInfo, PreviewScore } from '@/lib/types/admin/exams/submissions/exam.types'
import type { Database }            from '@/lib/types/database'

type SubmissionUpdate = Database['public']['Tables']['submissions']['Update']

export interface UseGradingReturn {
  tosErrors:          string[]
  gradingMode:        GradingMode
  savingMode:         boolean
  gradingSubmission:  boolean
  handleModeChange:   (
    mode:       GradingMode,
    onLoadKey:  () => Promise<void>,
    onShowKey:  (v: boolean) => void,
    keyLoaded:  boolean,
  ) => Promise<void>
  gradeSubmission: (
    target:             Submission,
    answers:            AnswerDetail[],
    keyMap:             Record<string, string | null>,
    examInfo:           ExamInfo,
    onAnswersUpdate:    (a: AnswerDetail[]) => void,
    onSubmissionUpdate: (patch: Partial<Submission>) => void,
    onClose:            () => Promise<void>,
  ) => Promise<void>
  handleAnswerCorrectToggle: (
    id:         string,
    isCorrect:  boolean,
    answers:    AnswerDetail[],
    setAnswers: (a: AnswerDetail[]) => void,
  ) => void
  handlePointsChange: (
    id:         string,
    pts:        number,
    answers:    AnswerDetail[],
    setAnswers: (a: AnswerDetail[]) => void,
  ) => void
  handleFeedbackChange: (
    id:         string,
    fb:         string,
    answers:    AnswerDetail[],
    setAnswers: (a: AnswerDetail[]) => void,
  ) => void
  previewScore:   (answers: AnswerDetail[], examInfo: ExamInfo | null) => PreviewScore | null
  setGradingMode: (m: GradingMode) => void
}

export function useGrading(examId: string): UseGradingReturn {
  const supabase = useMemo(() => createClient(), [])

  const [gradingMode,       setGradingMode]      = useState<GradingMode>('auto')
  const [savingMode,        setSavingMode]        = useState(false)
  const [gradingSubmission, setGradingSubmission] = useState(false)
  const [tosErrors, setTosErrors] = useState<string[]>([])

  const handleModeChange = useCallback(async (
    mode:      GradingMode,
    onLoadKey: () => Promise<void>,
    onShowKey: (v: boolean) => void,
    keyLoaded: boolean,
  ) => {
    setSavingMode(true)
    setGradingMode(mode)
    await ExamService.updateGradingMode(supabase, examId, mode)
    if (mode === 'manual' && !keyLoaded) {
      await onLoadKey()
      onShowKey(true)
    }
    setSavingMode(false)
  }, [supabase, examId])

const gradeSubmission = useCallback(async (
  target: Submission,
  answers: AnswerDetail[],
  keyMap: Record<string, string | null>,
  examInfo: ExamInfo,
  onAnswersUpdate: (a: AnswerDetail[]) => void,
  onSubmissionUpdate: (patch: Partial<Submission>) => void,
  onClose: () => void,
) => {
  setGradingSubmission(true)
  setTosErrors([])

  const gradedAnswers = answers.map((ans: AnswerDetail) => {
    if (!ans.question) {return ans}

    const isAutoType = AUTO_TYPES.includes(ans.question.question_type)

    // FIX: Grade ALL auto-type answers, not just null ones.
    // Previously `ans.is_correct === null` check skipped already-graded
    // answers that might have wrong scores from a prior partial grade.
    if (isAutoType) {
      const key = gradingMode === 'manual'
        ? (keyMap[ans.question_id] ?? ans.question.correct_answer)
        : ans.question.correct_answer
      const result = gradeAnswer(
        ans.answer_text, key,
        ans.question.question_type,
        ans.question.points,
      )
      return { ...ans, ...result }
    }

    // Manual types: preserve whatever the grader set
    return ans
  })

  const earned = sumPoints(gradedAnswers.map((a: AnswerDetail) => a.points_earned))
  const tosAreasResult = await ExamService.getTosAreas(supabase, examId)
  if (tosAreasResult.error) {
    setTosErrors([tosAreasResult.error])
    setGradingSubmission(false)
    return
  }
  const tosAreas = tosAreasResult.data ?? []

  let percentage: number
  let passed: boolean
  if (tosAreas.length > 0) {
    const missingQuestionCount = gradedAnswers.filter((answer) => answer.question === null).length
    const questions = gradedAnswers.flatMap((answer) => answer.question
      ? [{
          question_text: answer.question.question_text,
          section_title: answer.question.section_title,
          section_number: answer.question.section_number,
          points: answer.question.points,
          points_earned: answer.points_earned,
        }]
      : [])
    const tosScore = computeTosScore(
      questions,
      tosAreas,
      examInfo.total_points,
      examInfo.passing_score,
    )
    const validationErrors = [...tosScore.validation_errors]
    if (missingQuestionCount > 0) {
      validationErrors.push(`${missingQuestionCount} answer(s) could not be matched to a question area.`)
    }
    if (validationErrors.length > 0 || tosScore.weighted_percentage === null || tosScore.passed === null) {
      const errors = validationErrors.length > 0
        ? validationErrors
        : ['TOS scoring could not produce a valid result.']
      setTosErrors(errors)
      setGradingSubmission(false)
      return
    }
    percentage = tosScore.weighted_percentage
    passed = tosScore.passed
  } else {
    const legacyScore = computeScore(earned, examInfo.total_points, examInfo.passing_score)
    percentage = legacyScore.percentage
    passed = legacyScore.passed
  }

  // Persist answers
  await Promise.all(
    gradedAnswers.map((a: AnswerDetail) =>
      SubmissionService.updateAnswer(supabase, a.id, {
        is_correct:    a.is_correct,
        points_earned: a.points_earned,
        feedback:      a.feedback || null,
      })
    )
  )

  const patch = {
    score:      earned,
    percentage,
    passed,
    status:     'reviewed',
  } satisfies SubmissionUpdate

  const { error } = await SubmissionService.updateSubmission(supabase, target.id, patch)
  
  if (error) {
    console.error('[gradeSubmission] failed to persist:', error)
    setGradingSubmission(false)
    return  // Don't close modal or update UI if DB write failed
  }

  onAnswersUpdate(gradedAnswers)
  onSubmissionUpdate({ score: earned, percentage, passed, status: 'reviewed' })
  setGradingSubmission(false)
  onClose()
}, [supabase, examId, gradingMode])

  const handleAnswerCorrectToggle = useCallback((
    id: string, isCorrect: boolean,
    answers: AnswerDetail[], setAnswers: (a: AnswerDetail[]) => void,
  ) => {
    setAnswers(answers.map(a => {
      if (a.id !== id) {return a}
      return {
        ...a,
        is_correct:    isCorrect,
        points_earned: isCorrect ? (a.question?.points ?? 0) : 0,
      }
    }))
  }, [])

  const handlePointsChange = useCallback((
    id: string, pts: number,
    answers: AnswerDetail[], setAnswers: (a: AnswerDetail[]) => void,
  ) => {
    setAnswers(answers.map(a => a.id === id ? { ...a, points_earned: pts } : a))
  }, [])

  const handleFeedbackChange = useCallback((
    id: string, fb: string,
    answers: AnswerDetail[], setAnswers: (a: AnswerDetail[]) => void,
  ) => {
    setAnswers(answers.map(a => a.id === id ? { ...a, feedback: fb } : a))
  }, [])

  // FIX M: guard against division by zero and NaN percentage
  const previewScore = useCallback((
    answers: AnswerDetail[], examInfo: ExamInfo | null,
  ): PreviewScore | null => {
    if (!examInfo || answers.length === 0) {return null}
    const earned = sumPoints(answers.map(a => a.points_earned))
    const pct    = examInfo.total_points > 0
      ? parseFloat(((earned / examInfo.total_points) * 100).toFixed(2))
      : 0
    return { earned, pct, passed: pct >= examInfo.passing_score }
  }, [])

  return {
    gradingMode, savingMode, gradingSubmission, tosErrors,
    handleModeChange, gradeSubmission,
    handleAnswerCorrectToggle, handlePointsChange, handleFeedbackChange,
    previewScore, setGradingMode,
  }
}
