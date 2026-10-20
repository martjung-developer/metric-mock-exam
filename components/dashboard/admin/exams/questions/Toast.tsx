// components/dashboard/admin/exams/questions/Toast.tsx
// Pure UI — self-dismissing toast notification.

import { AlertCircle, CheckCircle2, X } from 'lucide-react'
import type { JSX} from 'react';
import { useEffect } from 'react'
import type { ToastState } from '@/lib/types/admin/exams/questions/questions.types'
import s from '@/app/(dashboard)/admin/exams/[examId]/questions/questions.module.css'

interface ToastProps {
  toast: ToastState
  onClose: () => void
}

export function Toast({ toast, onClose }: ToastProps): JSX.Element {
  useEffect(() => {
    const t = setTimeout(onClose, 3000)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div className={`${s.toast} ${toast.type === 'success' ? s.toastSuccess : s.toastError}`}>
      {toast.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
      <span>{toast.message}</span>
      <button onClick={onClose} className={s.toastClose}>
        <X size={11} />
      </button>
    </div>
  )
}
