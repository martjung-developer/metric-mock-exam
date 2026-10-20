// lib/hooks/student/results/useResultsStats.ts
import { useMemo } from 'react'
import type { SummaryStats } from '@/lib/types/student/results/results.types'

export function useResultsStats(stats: SummaryStats) {
  return useMemo(() => {
    const passRate = stats.totalExams > 0
      ? Math.round((stats.passed / stats.totalExams) * 100)
      : null

    return { passRate }
  }, [stats])
}