// components/dashboard/admin/students/edit/ErrorState.tsx
import { AlertCircle } from 'lucide-react'
import styles from '@/app/(dashboard)/admin/students/[id]/edit/edit.module.css'

interface ErrorStateProps {
  message: string
  onBack:  () => void
}

export function ErrorState({ message, onBack }: ErrorStateProps) {
  return (
    <div className={styles.loadingWrap}>
      <AlertCircle size={28} color="#dc2626" />
      <p style={{ color: '#991b1b' }}>{message}</p>
      <button className={styles.btnSave} onClick={onBack}>Go back</button>
    </div>
  )
}