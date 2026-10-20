// components/dashboard/student/mock-exams/MockExamsHeader.tsx
//
// FIXED: accepts lockedCount and shows it in stat pills
// ─────────────────────────────────────────────────────────────────────────────

import styles from '@/app/(dashboard)/student/mock-exams/mock-exams.module.css'

interface Props {
  availableCount:  number
  completedCount:  number
  inProgressCount: number
  lockedCount:     number
  total:           number
}

export function MockExamsHeader({
  availableCount, completedCount, inProgressCount, lockedCount,
}: Props) {
  return (
    <div className={styles.header}>
      <div>
        <h1 className={styles.title}>Mock Exams</h1>
        <p className={styles.subtitle}>Take board-style exams assigned by your faculty</p>
      </div>
      <div className={styles.headerRight}>
        <div className={styles.statPills}>
          <span className={styles.statPill} data-type="available">
            <span className={styles.dot} />
            {availableCount} Available
          </span>
          {inProgressCount > 0 && (
            <span className={styles.statPill} data-type="in-progress">
              <span className={styles.dotInProgress} />
              {inProgressCount} In Progress
            </span>
          )}
          {completedCount > 0 && (
            <span className={styles.statPill} data-type="completed">
              <span className={styles.dotCompleted} />
              {completedCount} Completed
            </span>
          )}
          {lockedCount > 0 && (
            <span className={styles.statPill} data-type="locked" style={{
              background: '#fef2f2', border: '1.5px solid #fecaca', color: '#dc2626',
            }}>
              <span style={{
                width: 7, height: 7, borderRadius: '50%',
                background: '#dc2626', display: 'inline-block', marginRight: 5,
              }} />
              {lockedCount} Locked
            </span>
          )}
        </div>
      </div>
    </div>
  )
}