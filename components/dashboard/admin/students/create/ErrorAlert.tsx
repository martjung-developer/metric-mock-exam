// components/dashboard/admin/students/create/ErrorAlert.tsx
'use client'

import { AlertCircle } from 'lucide-react'
import styles from '@/app/(dashboard)/admin/students/create/create.module.css'

interface Props {
  message: string
}

export function ErrorAlert({ message }: Props) {
  return (
    <div className={styles.alertError} role="alert" aria-live="assertive">
      <AlertCircle size={15} aria-hidden />
      {message}
    </div>
  )
}