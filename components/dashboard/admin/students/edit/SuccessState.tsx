// components/dashboard/admin/students/edit/SuccessState.tsx
import { CheckCircle2 } from 'lucide-react'
import styles from '@/app/(dashboard)/admin/students/[id]/edit/edit.module.css'

interface SuccessStateProps {
  fullName: string
}

export function SuccessState({ fullName }: SuccessStateProps) {
  return (
    <div className={styles.successWrap}>
      <div className={styles.successCard}>
        <CheckCircle2 size={48} color="#059669" strokeWidth={1.5} />
        <h2 className={styles.successTitle}>Changes Saved!</h2>
        <p className={styles.successText}>
          <strong>{fullName}</strong>&rsquo;s profile has been updated. Redirecting…
        </p>
      </div>
    </div>
  )
}