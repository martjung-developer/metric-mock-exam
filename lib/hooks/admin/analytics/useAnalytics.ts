// lib/hooks/admin/analytics/useAnalytics.ts
// Custom hook encapsulating all state and data-fetching for the analytics dashboard.
// Calls service functions — no direct Supabase queries here.

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/lib/context/AuthContext'
import {
  fetchPrograms,
  fetchCountStats,
  fetchExamIdsForProgram,
  fetchAllSubmissions,
  fetchReleasedSubmissions,
  fetchExamMetadata,
  fetchProfileNames,
  fetchProgramNames,
  computeOverview,
  computeProgramPerformance,
  computeExamPerformance,
  computeStudentAnalytics,
  computeEngagement,
} from '@/lib/services/admin/analytics/analytics.service'
import type {
  AnalyticsData,
  UseAnalyticsReturn,
} from '@/lib/types/admin/analytics/analytics.types'

// ── Empty state ─────────────────────────────────────────────────────────────

const EMPTY_DATA: AnalyticsData = {
  overview:    null,
  programPerf: [],
  examPerf:    [],
  topStudents: [],
  atRisk:      [],
  engagement:  null,
  programs:    [],
}

// ── Hook ────────────────────────────────────────────────────────────────────

export function useAnalytics(): UseAnalyticsReturn {
  const supabase = useMemo(() => createClient(), [])
  const { user, profile, loading: authLoading } = useUser()

  const [data,            setData]            = useState<AnalyticsData>(EMPTY_DATA)
  const [loading,         setLoading]         = useState(true)
  const [error,           setError]           = useState<string | null>(null)
  const [refreshed,       setRefreshed]       = useState<Date | null>(null)
  const [selectedProgram, setSelectedProgram] = useState('all')
  const [viewerSchoolId, setViewerSchoolId] = useState<string | null>(null)
  const [viewerSchoolLoaded, setViewerSchoolLoaded] = useState(false)

  // Stable ref so fetchAll always sees latest selectedProgram
  const selectedProgramRef = useRef(selectedProgram)
  useEffect(() => {
    selectedProgramRef.current = selectedProgram
  }, [selectedProgram])

  useEffect(() => {
    if (authLoading || !user) {
      return
    }

    let cancelled = false

    void (async () => {
      const role =
        (user.user_metadata?.role as string | undefined) ??
        (user.app_metadata?.role  as string | undefined) ??
        profile?.role

      const metaSchoolId =
        (user.user_metadata?.school_id as string | undefined) ??
        (user.app_metadata?.school_id  as string | undefined) ??
        profile?.school_id ??
        null

      if (metaSchoolId) {
        if (!cancelled) {
          setViewerSchoolId(metaSchoolId)
          setViewerSchoolLoaded(true)
        }
        return
      }

      if (role !== 'faculty' && role !== 'admin') {
        if (!cancelled) {
          setViewerSchoolId(null)
          setViewerSchoolLoaded(true)
        }
        return
      }

      const { data } = role === 'faculty'
        ? await supabase
            .from('faculty')
            .select('school_id')
            .eq('user_id', user.id)
            .maybeSingle()
        : await supabase
            .from('admins')
            .select('school_id')
            .eq('user_id', user.id)
            .maybeSingle()

      if (!cancelled) {
        setViewerSchoolId(data?.school_id ?? null)
        setViewerSchoolLoaded(true)
      }
    })()

    return () => { cancelled = true }
  }, [authLoading, profile?.role, profile?.school_id, supabase, user])

  const fetchAll = useCallback(async () => {
    if (!viewerSchoolLoaded) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      // ── Step 1: Programs filter list + count stats (parallel) ──────────────
      const programs = await fetchPrograms(supabase, viewerSchoolId)
      const scopedProgramIds = viewerSchoolId ? programs.map((program) => program.id) : undefined
      const { totalStudents, totalExams } = await fetchCountStats(
        supabase,
        viewerSchoolId,
        scopedProgramIds,
      )

      const program = selectedProgramRef.current

      // ── Step 2: Resolve exam IDs for program filter ────────────────────────
      let examIds: string[] | undefined = scopedProgramIds

      if (program !== 'all') {
        const ids = await fetchExamIdsForProgram(supabase, program)

        if (ids.length === 0) {
          // No exams for this program — show zeros
          setData({
            ...EMPTY_DATA,
            programs,
            overview: {
              totalStudents,
              totalExams: 0,
              totalAttempts: 0,
              releasedAttempts: 0,
              averageScore: 0,
            },
            engagement: {
              totalAttempts: 0,
              releasedAttempts: 0,
              totalTimeMinutes: 0,
              avgTimePerAttempt: 0,
              avgAttemptsPerStudent: 0,
            },
          })
          setLoading(false)
          return
        }

        examIds = ids
      }

      // ── Step 3: Submissions (parallel) ────────────────────────────────────
      const [allSubs, releasedSubs] = await Promise.all([
        fetchAllSubmissions(supabase, examIds),
        fetchReleasedSubmissions(supabase, examIds),
      ])

      // ── Step 4: Exam metadata ─────────────────────────────────────────────
      const allExamIds = [
        ...new Set([
          ...allSubs.map((r) => r.exam_id),
          ...releasedSubs.map((r) => r.exam_id),
        ].filter((id): id is string => id !== null)),
      ]

      const examMetadata = await fetchExamMetadata(supabase, allExamIds)

      // ── Step 5: Program + profile lookups (parallel) ─────────────────────
      const programIds = [
        ...new Set(
          examMetadata
            .map((e) => e.program_id)
            .filter((id): id is string => id !== null),
        ),
      ]

      const studentIds = [
        ...new Set(
          releasedSubs
            .map((r) => r.student_id)
            .filter((id): id is string => id !== null),
        ),
      ]

      const [programNameRows, profileNameRows] = await Promise.all([
        fetchProgramNames(supabase, programIds),
        fetchProfileNames(supabase, studentIds),
      ])

      // ── Step 6: Compute derived data ──────────────────────────────────────
      const overview    = computeOverview(totalStudents, totalExams, allSubs, releasedSubs)
      const programPerf = computeProgramPerformance(releasedSubs, examMetadata, programNameRows)
      const examPerf    = computeExamPerformance(releasedSubs, examMetadata)
      const engagement  = computeEngagement(allSubs, releasedSubs)
      const { topStudents, atRisk } = computeStudentAnalytics(releasedSubs, profileNameRows)

      setData({ overview, programPerf, examPerf, topStudents, atRisk, engagement, programs })
      setRefreshed(new Date())
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load analytics.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [supabase, viewerSchoolId, viewerSchoolLoaded]) // selectedProgram is accessed via ref inside fetchAll

  // Re-run when selectedProgram changes
  useEffect(() => {
    // Load analytics for the currently selected program.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchAll()
  }, [fetchAll, selectedProgram])

  const refresh = useCallback(() => {
    void fetchAll()
  }, [fetchAll])

  return {
    data,
    loading,
    error,
    refreshed,
    selectedProgram,
    setSelectedProgram,
    refresh,
  }
}
