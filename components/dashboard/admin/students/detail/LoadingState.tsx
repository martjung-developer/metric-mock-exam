// components/dashboard/admin/students/detail/LoadingState.tsx
import styles from '@/app/(dashboard)/admin/students/[id]/student-detail.module.css'

export function LoadingState() {
  return (
    <div className={styles.loadingWrap}>
      <div className={styles.loadingSpinner} />
      <p>Loading student…</p>
    </div>
  )
}