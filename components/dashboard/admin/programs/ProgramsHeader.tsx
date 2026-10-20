/**
 * components/admin/programs/ProgramsHeader.tsx
 *
 * Pure presentational component — no Supabase, no hooks, no business logic.
 */

import { GraduationCap } from 'lucide-react'
import styles from '@/app/(dashboard)/admin/programs/programs.module.css'

interface ProgramsHeaderProps {
  totalCount:       number
  onRefresh:        () => void
}

export function ProgramsHeader({ totalCount, onRefresh }: ProgramsHeaderProps) {
  return (
    <div className={styles.header}>
      <div className={styles.headerLeft}>
        <div className={styles.headerIcon}>
          <GraduationCap size={20} color="#fff" />
        </div>
        <div>
          <h1 className={styles.heading}>Programs</h1>
          <p className={styles.headingSub}>
            {totalCount} degree program{totalCount !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
      <div className={styles.headerActions}>
        <button className={styles.btnSecondary} onClick={onRefresh}>
          Refresh
        </button>
      </div>
    </div>
  )
}