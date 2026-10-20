// components/dashboard/admin/exams/answer-key/Toast.tsx
'use client'

import { useEffect } from 'react'
import { CheckCircle, AlertCircle, X } from 'lucide-react'
import s from '@/app/(dashboard)/admin/exams/[examId]/answer-key/answer-key.module.css'

interface ToastProps {
  message: string
  type:    'success' | 'error'
  onClose: () => void
}

export function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div className={`${s.toast} ${type === 'success' ? s.toastSuccess : s.toastError}`}>
      {type === 'success'
        ? <CheckCircle size={14} />
        : <AlertCircle size={14} />}
      <span>{message}</span>
      <button onClick={onClose} className={s.toastClose}>
        <X size={12} />
      </button>
    </div>
  )
}