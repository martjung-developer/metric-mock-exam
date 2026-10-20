// components/dashboard/admin/exams/detail/Toast.tsx

import React, { useEffect } from 'react'
import { CheckCircle, AlertCircle, X } from 'lucide-react'
import type { ToastState } from '@/lib/types/admin/exams/detail/exam.types'
import s from '@/app/(dashboard)/admin/exams/[examId]/detail.module.css'

interface ToastProps extends ToastState {
  onClose: () => void
}

export default function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div className={`${s.toast} ${type === 'success' ? s.toastSuccess : s.toastError}`}>
      {type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
      <span>{message}</span>
      <button onClick={onClose} className={s.toastClose}>
        <X size={12} />
      </button>
    </div>
  )
}