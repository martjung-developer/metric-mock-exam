/**
 * components/dashboard/admin/students/ErrorBanner.tsx
 * Pure presentational — no Supabase, no hooks, no business logic.
 */

import { AlertCircle } from 'lucide-react'
import styles from '@/app/(dashboard)/admin/students/students.module.css'

interface ErrorBannerProps {
  message: string
}

export function ErrorBanner({ message }: ErrorBannerProps) {
  return (
    <div className={styles.errorBanner} role="alert">
      <AlertCircle size={15} />
      {message}
    </div>
  )
}