// lib/hooks/admin/exams/detail/useExamDetail.ts
// Manages data-fetching state for the Exam Detail page.
// Delegates all Supabase work to the service layer.

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  getExamById,
  getCategories,
  getPrograms,
  getExamStats,
} from '@/lib/services/admin/exams/detail/exam.service'
import { mapRawToExamDetail } from '@/lib/utils/admin/exams/detail/mappers'
import type {
  ExamDetail,
  CategoryOption,
  ProgramOption,
  UseExamDetailReturn,
} from '@/lib/types/admin/exams/detail/exam.types'

export function useExamDetail(examId: string | undefined): UseExamDetailReturn {
  const [exam,       setExam]       = useState<ExamDetail | null>(null)
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [programs,   setPrograms]   = useState<ProgramOption[]>([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState<string | null>(null)

  useEffect(() => {
    if (!examId) {return}

    let cancelled = false

    async function fetchAll() {
      setLoading(true)
      setError(null)

      try {
        const db = createClient()

        // ── Step 1: Exam row + categories + programs (parallel) ──────────────
        const [raw, cats, progs] = await Promise.all([
          getExamById(db, examId),
          getCategories(db),
          getPrograms(db),
        ])

        if (cancelled) {return}

        // ── Step 2: Stats (depends on knowing the exam exists) ───────────────
        const stats = await getExamStats(db, examId)

        if (cancelled) {return}

        setExam(mapRawToExamDetail(raw, stats))
        setCategories(cats)
        setPrograms(progs)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load exam.')
        }
      } finally {
        if (!cancelled) {setLoading(false)}
      }
    }

    void fetchAll()

    return () => {
      cancelled = true
    }
  }, [examId])

  // Stable setter exposed so the edit hook can apply optimistic updates
  const stableSetExam = useCallback(
    (updater: (prev: ExamDetail | null) => ExamDetail | null) => {
      setExam(updater)
    },
    [],
  )

  return { exam, categories, programs, loading, error, setExam: stableSetExam }
}