// lib/hooks/admin/exams/submissions/useBulkGrading.ts
// ─────────────────────────────────────────────────────────────────────────────
// FIX F: useReleaseResults now uses `satisfies SubmissionUpdate` instead of
// an unsafe `as Record<string, unknown>` cast. This works because
// database.ts.submissions.Update now includes:
//   status?:      SubmissionStatus   (which includes 'released')
//   released_at?: string | null
//
// FIX G: useBulkGrading.bulkGradeAll graded both 'submitted' AND 'graded'
// rows in the loop, but GRADEABLE_STATUSES in constants was only ['submitted'].
// Both are now ['submitted', 'graded'] — the filter in the loop and the
// constant match exactly, so gradeableCount in useSubmissions is accurate.
// ─────────────────────────────────────────────────────────────────────────────

'use client'
import { useState, useCallback, useMemo } from 'react'
import { createClient }          from '@/lib/supabase/client'
import * as SubmissionService    from '@/lib/services/admin/exams/submissions/submission.service'
import * as ExamService          from '@/lib/services/admin/exams/submissions/exam.service'
import { gradeAnswer, computeScore, computeTosScore } from '@/lib/utils/admin/submissions/grading'
import { GRADEABLE_STATUSES, RELEASABLE_STATUSES } from '@/lib/utils/admin/submissions/constants'
import { createNotification } from '@/lib/services/notifications/notification.service'
import type {
  Submission,
  GradingMode,
} from '@/lib/types/admin/exams/submissions/submission.types'
import type { ExamInfo }         from '@/lib/types/admin/exams/submissions/exam.types'
import type { QuestionType }     from '@/lib/types/database'
import type { Database }         from '@/lib/types/database'

type SubmissionUpdate = Database['public']['Tables']['submissions']['Update']

// ── BulkAnsRaw ────────────────────────────────────────────────────────────────

interface BulkAnsRaw {
  id:          string
  question_id: string | null
  answer_text: string | null
  questions: {
    question_text:  string
    question_type:  string
    points:         number
    correct_answer: string | null
    section_title:  string | null
    section_number: number | null
  } | null
}

// ─────────────────────────────────────────────────────────────────────────────
// useBulkGrading
// ─────────────────────────────────────────────────────────────────────────────

export interface UseBulkGradingReturn {
  bulkGrading:  boolean
  bulkProgress: { done: number; total: number } | null
  tosErrors:    string[]
  bulkGradeAll: (
    submissions: Submission[],
    examInfo:    ExamInfo,
    gradingMode: GradingMode,
    keyMap:      Record<string, string | null>,
    onUpdate:    (id: string, patch: Partial<Submission>) => void,
  ) => Promise<void>
}

export function useBulkGrading(): UseBulkGradingReturn {
  const supabase = useMemo(() => createClient(), [])
  const [bulkGrading,  setBulkGrading]  = useState(false)
  const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number } | null>(null)
  const [tosErrors, setTosErrors] = useState<string[]>([])

  const bulkGradeAll = useCallback(async (
    submissions: Submission[],
    examInfo:    ExamInfo,
    gradingMode: GradingMode,
    keyMap:      Record<string, string | null>,
    onUpdate:    (id: string, patch: Partial<Submission>) => void,
  ) => {
    // FIX G: Use the same GRADEABLE_STATUSES constant as useSubmissions so
    // the count shown in the panel and the rows actually processed are identical.
    const gradeable = submissions.filter(s => GRADEABLE_STATUSES.includes(s.status))
    if (!gradeable.length) {return}

    setTosErrors([])
    setBulkGrading(true)
    setBulkProgress({ done: 0, total: gradeable.length })

    const { data: examRef, error: examRefError } = await supabase
      .from('submissions')
      .select('exam_id')
      .eq('id', gradeable[0].id)
      .single()
    if (examRefError || !examRef?.exam_id) {
      setTosErrors([examRefError?.message ?? 'Could not determine the exam for TOS scoring.'])
      setBulkGrading(false)
      setBulkProgress(null)
      return
    }

    const tosAreasResult = await ExamService.getTosAreas(supabase, examRef.exam_id)
    if (tosAreasResult.error) {
      setTosErrors([tosAreasResult.error])
      setBulkGrading(false)
      setBulkProgress(null)
      return
    }
    const tosAreas = tosAreasResult.data ?? []

    const VALID_TYPES = new Set<string>([
      'multiple_choice', 'true_false', 'short_answer', 'essay', 'matching', 'fill_blank',
    ])

    for (let i = 0; i < gradeable.length; i++) {
      const sub = gradeable[i]

      const { data: ansData } = await supabase
        .from('answers')
        .select(
          'id, question_id, answer_text, ' +
          'questions:question_id ( question_text, question_type, points, correct_answer, section_title, section_number )',
        )
        .eq('submission_id', sub.id)

      if (!ansData) {
        setBulkProgress({ done: i + 1, total: gradeable.length })
        continue
      }

      let totalEarned = 0
      let missingQuestionCount = 0
      const answerUpdates: Array<{
        id: string
        is_correct: boolean | null
        points_earned: number
      }> = []
      const questionsForTos: Array<{
        question_text: string
        section_title: string | null
        section_number: number | null
        points: number
        points_earned: number
      }> = []

      for (const row of ansData as unknown as BulkAnsRaw[]) {
        const q = row.questions
        if (!q) {
          missingQuestionCount += 1
          continue
        }
        if (!VALID_TYPES.has(q.question_type)) {continue}

        const qType = q.question_type as QuestionType
        const key   = gradingMode === 'manual'
          ? (keyMap[row.question_id ?? ''] ?? q.correct_answer)
          : q.correct_answer

        const { is_correct, points_earned } = gradeAnswer(
          row.answer_text, key, qType, q.points,
        )
        totalEarned += points_earned
        if (tosAreas.length === 0) {
          await SubmissionService.updateAnswer(supabase, row.id, { is_correct, points_earned })
        } else {
          answerUpdates.push({ id: row.id, is_correct, points_earned })
        }
        questionsForTos.push({
          question_text: q.question_text,
          section_title: q.section_title,
          section_number: q.section_number,
          points: q.points,
          points_earned,
        })
      }

      let percentage: number
      let passed: boolean
      if (tosAreas.length > 0) {
        const tosScore = computeTosScore(
          questionsForTos,
          tosAreas,
          examInfo.total_points,
          examInfo.passing_score,
        )
        const validationErrors = [...tosScore.validation_errors]
        if (missingQuestionCount > 0) {
          validationErrors.push(`${missingQuestionCount} answer(s) could not be matched to a question area.`)
        }
        if (validationErrors.length > 0 || tosScore.weighted_percentage === null || tosScore.passed === null) {
          setTosErrors(validationErrors.length > 0
            ? validationErrors
            : ['TOS scoring could not produce a valid result.'])
          setBulkGrading(false)
          setBulkProgress(null)
          return
        }
        percentage = tosScore.weighted_percentage
        passed = tosScore.passed
      } else {
        const legacyScore = computeScore(totalEarned, examInfo.total_points, examInfo.passing_score)
        percentage = legacyScore.percentage
        passed = legacyScore.passed
      }

      if (tosAreas.length > 0) {
        for (const answerUpdate of answerUpdates) {
          await SubmissionService.updateAnswer(supabase, answerUpdate.id, {
            is_correct: answerUpdate.is_correct,
            points_earned: answerUpdate.points_earned,
          })
        }
      }

      // FIX G: use satisfies for compile-time type safety
      const patch = {
        score:      totalEarned,
        percentage,
        passed,
        status:     'reviewed',
      } satisfies SubmissionUpdate

      await SubmissionService.updateSubmission(supabase, sub.id, patch)

      onUpdate(sub.id, {
        score:      totalEarned,
        percentage,
        passed,
        status:     'reviewed',
      })
      setBulkProgress({ done: i + 1, total: gradeable.length })
    }

    setBulkGrading(false)
    setBulkProgress(null)
  }, [supabase])

  return { bulkGrading, bulkProgress, tosErrors, bulkGradeAll }
}

// ─────────────────────────────────────────────────────────────────────────────
// useReleaseResults
// ─────────────────────────────────────────────────────────────────────────────

export interface UseReleaseResultsReturn {
  releasing:      boolean
  releaseResults: (
    submissions: Submission[],
    onUpdate:    (id: string, patch: Partial<Submission>) => void,
  ) => Promise<void>
}

export function useReleaseResults(): UseReleaseResultsReturn {
  const supabase  = useMemo(() => createClient(), [])
  const [releasing, setReleasing] = useState(false)

  const releaseResults = useCallback(async (
    submissions: Submission[],
    onUpdate:    (id: string, patch: Partial<Submission>) => void,
    onDone?:     () => Promise<void>,   // ← ADD: trigger a refetch after all releases
  ) => {
    const toRelease = submissions.filter(s => RELEASABLE_STATUSES.includes(s.status))
    if (!toRelease.length) {return}

    setReleasing(true)
    const now = new Date().toISOString()
    const failed: string[] = []

    for (const sub of toRelease) {
      const patch = {
        status:      'released',
        released_at: now,
      } satisfies SubmissionUpdate

      // CRITICAL FIX: use .select('id') to detect RLS silent failures
      const { data, error } = await supabase
        .from('submissions')
        .update(patch)
        .eq('id', sub.id)
        .select('id')
        .single()

      if (error || !data) {
        console.error('[releaseResults] failed:', sub.id, error?.message ?? 'no row returned')
        failed.push(sub.id)
        continue
      }

      const { data: meta } = await supabase
        .from('submissions')
        .select('student_id, exams(title)')
        .eq('id', sub.id)
        .single()

      const studentProfileId = meta?.student_id ?? null
      const examTitle = (meta?.exams as { title?: string } | null)?.title ?? 'your exam'

      if (studentProfileId) {
        await createNotification(supabase, {
          userId: studentProfileId,
          type: 'result_released',
          title: 'Your results are ready!',
          message: `Your results for ${examTitle} have been released. Tap to review your answers and score. [submission_id:${sub.id}]`,
        })
      }

      onUpdate(sub.id, { status: 'released' })
    }

    setReleasing(false)

    if (failed.length > 0) {
      console.error(`[releaseResults] ${failed.length} submissions failed to release:`, failed)
    }

    // Refetch from DB to guarantee UI reflects persisted state
    if (onDone) {await onDone()}

  }, [supabase])

  return { releasing, releaseResults }
}
