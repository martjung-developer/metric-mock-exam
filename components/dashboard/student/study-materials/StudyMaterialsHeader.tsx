// components/dashboard/student/study-materials/StudyMaterialsHeader.tsx
import { BookOpen, RefreshCw } from 'lucide-react'
import styles from '@/app/(dashboard)/student/study-materials/study-materials.module.css'

interface StudyMaterialsHeaderProps {
  totalCount: number
  loading:    boolean
  onRefresh:  () => void
}

export function StudyMaterialsHeader({
  totalCount,
  loading,
  onRefresh,
}: StudyMaterialsHeaderProps) {
  return (
    <div className={styles.header}>
      <div>
        <h1 className={styles.title}>Study Materials</h1>
        <p className={styles.subtitle}>Browse and access learning resources by program</p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span className={styles.totalPill}>
          <BookOpen size={13} strokeWidth={2} />
          {loading ? '—' : totalCount} Materials
        </span>
        <button
          className={styles.refreshBtn}
          onClick={onRefresh}
          disabled={loading}
          aria-label="Refresh"
          title="Refresh"
        >
          <RefreshCw size={14} className={loading ? styles.spinning : ''} />
        </button>
      </div>
    </div>
  )
}