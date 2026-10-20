// components/dashboard/admin/students/create/SuccessState.tsx
'use client'

import { CheckCircle2 } from 'lucide-react'
import styles from '@/app/(dashboard)/admin/students/create/create.module.css'

interface Props {
  fullName: string
}

export function SuccessState({ fullName }: Props) {
  return (
    <div className={styles.successWrap} role="status" aria-live="polite">
      <div className={styles.successCard}>
        <CheckCircle2 size={48} color="#059669" strokeWidth={1.5} aria-hidden />
        <h2 className={styles.successTitle}>Student Created!</h2>
        <p className={styles.successText}>
          <strong>{fullName}</strong> has been added as a student. Redirecting…
        </p>
      </div>
    </div>
  )
}