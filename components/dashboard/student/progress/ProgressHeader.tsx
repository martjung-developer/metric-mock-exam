// components/dashboard/student/progress/ProgressHeader.tsx
'use client'

import { memo } from 'react'
import { RefreshCw } from 'lucide-react'
import type { FilterRange } from '@/lib/types/student/progress/progress.types'
import { FILTER_OPTIONS }   from '@/lib/types/student/progress/progress.types'
import styles from '@/app/(dashboard)/student/progress/progress.module.css'

interface Props {
  loading:        boolean
  filter:         FilterRange
  onFilterChange: (range: FilterRange) => void
  onRefresh:      () => void
}

export const ProgressHeader = memo(function ProgressHeader({
  loading, filter, onFilterChange, onRefresh,
}: Props) {
  return (
    <div className={styles.header}>
      <div>
        <h1 className={styles.pageTitle}>My Progress</h1>
        <p className={styles.pageSubtitle}>
          Track your performance and improvement over time
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        {/* Refresh button */}
        <button
          className={styles.filterBtn}
          onClick={onRefresh}
          disabled={loading}
          title="Refresh data"
          aria-label="Refresh progress data"
          style={{ padding: '0.4rem 0.7rem', display: 'flex', alignItems: 'center', gap: 5 }}
        >
          <RefreshCw
            size={13}
            style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }}
            aria-hidden
          />
        </button>

        {/* Date range filters */}
        <div className={styles.filterGroup}>
          {FILTER_OPTIONS.map((f) => (
            <button
              key={f.value}
              className={`${styles.filterBtn} ${filter === f.value ? styles.filterBtnActive : ''}`}
              onClick={() => onFilterChange(f.value)}
              aria-pressed={filter === f.value}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
})