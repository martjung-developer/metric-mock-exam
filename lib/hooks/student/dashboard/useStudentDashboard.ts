// lib/hooks/student/dashboard/useStudentDashboard.ts
// ─────────────────────────────────────────────────────────────────────────────
// Orchestrates data fetching for the student dashboard.
// Single source of truth — no duplicated fetch logic in components.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient }           from '@/lib/supabase/client'
import { useUser }                from '@/lib/context/AuthContext'
import {
  fetchDashboardSubmissions,
  fetchExamsByIds,
  fetchActiveAssignments,
  fetchStudentProgramId,
}                                 from '@/lib/services/student/dashboard/dashboard.service'
import {
  buildExamMap,
  mapToStats,
  mapToRecentActivity,
  mapToAssignedExams,
}                                 from '@/lib/utils/student/dashboard/dashboard.mapper'
import { computeProgress }        from '@/lib/utils/student/dashboard/dashboard.calculations'
import {
  EMPTY_DASHBOARD,
} from '@/lib/types/student/dashboard/dashboard.types'
import type {
  DashboardData,
  UseDashboardReturn,
} from '@/lib/types/student/dashboard/dashboard.types'

export function useStudentDashboard(): UseDashboardReturn {
  const supabase = useMemo(() => createClient(), [])
  const { user, loading: authLoading } = useUser()

  const [data,    setData]    = useState<DashboardData>(EMPTY_DASHBOARD)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (user === null || user === undefined) {return}

    setLoading(true)
    setError(null)

    try {
      // 1. Fetch program_id (needed for assignment query)
      const programId = await fetchStudentProgramId(supabase, user.id)

      // 2. Fetch submissions + assignments in parallel
      const [submissions, assignments] = await Promise.all([
        fetchDashboardSubmissions(supabase, user.id),
        fetchActiveAssignments(supabase, user.id, programId),
      ])

      // 3. Collect all exam IDs from both sources
      const submissionExamIds = submissions
        .map((s) => s.exam_id)
        .filter((id): id is string => id !== null)

      const assignmentExamIds = assignments.map((a) => a.exam_id)

      const allExamIds = Array.from(new Set([...submissionExamIds, ...assignmentExamIds]))

      // 4. Batch fetch exam metadata
      const exams   = await fetchExamsByIds(supabase, allExamIds)
      const examMap = buildExamMap(exams)

      // 5. Map to UI types
      const stats    = mapToStats(submissions, examMap)
      const progress = computeProgress(
        submissions.filter((s) => {
          const exam = s.exam_id !== null ? examMap.get(s.exam_id) : undefined
          return exam?.exam_type === 'mock'
        }).length,
        submissions.filter((s) => {
          const exam = s.exam_id !== null ? examMap.get(s.exam_id) : undefined
          return exam?.exam_type === 'practice'
        }).length,
      )

      const recentActivity = mapToRecentActivity(submissions, examMap, 5)
      const assignedExams  = mapToAssignedExams(assignments, examMap)

      setData({ stats, progress, recentActivity, assignedExams })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard.')
    } finally {
      setLoading(false)
    }
  }, [supabase, user])

  // Initial fetch (and re-fetch when auth resolves)
  useEffect(() => {
    if (authLoading) {return}
    void refresh()
  }, [authLoading, refresh])

  return { data, loading: authLoading || loading, error, refresh }
}