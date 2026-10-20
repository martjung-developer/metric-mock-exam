/**
 * components/dashboard/admin/students/LoadingSkeleton.tsx
 * Pure presentational — renders shimmer skeleton table rows while data loads.
 */

import styles from '@/app/(dashboard)/admin/students/students.module.css'

const SKELETON_ROWS = 5

export function LoadingSkeleton() {
  return (
    <>
      {Array.from({ length: SKELETON_ROWS }).map((_, i) => (
        <tr key={i} className={styles.skeletonRow}>
          <td><div className={styles.skeletonCell} /></td>
          <td><div className={styles.skeletonCell} style={{ width: 80 }} /></td>
          <td><div className={styles.skeletonCell} style={{ width: 120 }} /></td>
          <td><div className={styles.skeletonCell} style={{ width: 90 }} /></td>
          <td><div className={styles.skeletonCell} style={{ width: 80 }} /></td>
        </tr>
      ))}
    </>
  )
}