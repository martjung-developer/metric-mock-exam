// components/dashboard/student/help/ErrorState.tsx

import React from 'react'
import { AlertTriangle } from 'lucide-react'
import styles from '@/app/(dashboard)/student/help/help.module.css'

interface ErrorStateProps {
  message: string
}

export default function ErrorState({ message }: ErrorStateProps) {
  return (
    <div className={styles.page}>
      <div className={styles.emptyFaq} style={{ marginTop: '4rem' }}>
        <AlertTriangle size={36} strokeWidth={1.4} color="#dc2626" />
        <p className={styles.emptyTitle}>Something went wrong</p>
        <p className={styles.emptyText}>{message}</p>
      </div>
    </div>
  )
}