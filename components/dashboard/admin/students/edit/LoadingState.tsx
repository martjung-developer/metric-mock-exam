// components/dashboard/admin/students/edit/LoadingState.tsx
import styles from '@/app/(dashboard)/admin/students/[id]/edit/edit.module.css'

export function LoadingState() {
  return (
    <div className={styles.loadingWrap}>
      <div className={styles.loadingSpinner} />
      <p>Loading student data…</p>
    </div>
  )
}