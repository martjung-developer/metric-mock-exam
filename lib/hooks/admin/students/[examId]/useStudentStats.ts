// lib/hooks/admin/students/[examId]/useStudentStats.ts
import { useMemo } from 'react'
import type { Submission } from '@/lib/types/admin/students/[examId]/submission.types'

export interface StudentStats {
  releasedCount: number
  avgScore:      number | null
  passedCount:   number
}

export function useStudentStats(submissions: Submission[]): StudentStats {
  return useMemo(() => {
    // "Graded" family = graded | reviewed | released (all have a final score)
    const graded = submissions.filter((s) =>
      s.status === 'graded' || s.status === 'reviewed' || s.status === 'released'
    )

    const scores = graded
      .map((s) => s.percentage)
      .filter((v): v is number => v !== null)

    const avgScore = scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : null

    const passedCount = graded.filter((s) => s.passed === true).length

    return { releasedCount: graded.length, avgScore, passedCount }
  }, [submissions])
}