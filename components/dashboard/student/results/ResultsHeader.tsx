// components/dashboard/student/results/ResultsHeader.tsx
import { RefreshCw } from 'lucide-react'
import styles from '@/app/(dashboard)/student/results/results.module.css'

interface ResultsHeaderProps {
  refreshing: boolean
  onRefresh: () => void
}

export function ResultsHeader({ refreshing, onRefresh }: ResultsHeaderProps) {
  return (
    <div className={styles.header}>
      <div className={styles.headerLeft}>
        <h1 className={styles.title}>My Results</h1>
        <p className={styles.subtitle}>Scores are shown only after faculty review and release.</p>
      </div>
      <button
        type="button"
        className={styles.refreshBtn}
        onClick={onRefresh}
        disabled={refreshing}
        title="Refresh results"
      >
        <RefreshCw size={16} className={refreshing ? styles.spin : undefined} />
        Refresh
      </button>
    </div>
  )
}
