// components/dashboard/student/results/ResultsTable.tsx
'use client'

import type { ResultRow }  from '@/lib/types/student/results/results.types'
import { ResultsRow }      from './ResultsRow'
import { ResultsSkeleton } from './ResultsSkeleton'
import styles from '@/app/(dashboard)/student/results/results.module.css'

interface Props {
  results: ResultRow[]
  loading: boolean
}

export function ResultsTable({ results, loading }: Props) {
  if (loading) {return <ResultsSkeleton />}
  return (
    <div className={styles.resultGrid}>
      {results.map((row) => <ResultsRow key={row.id} row={row} />)}
    </div>
  )
}
