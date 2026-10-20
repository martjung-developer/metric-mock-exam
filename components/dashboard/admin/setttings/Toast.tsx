// components/dashboard/admin/settings/Toast.tsx
//
// Pure UI — renders the floating toast notification.
// Visibility is controlled by the parent (AnimatePresence in page.tsx).

import { CheckCircle2, XCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { toastVariants } from '@/animations/admin/settings/settings'
import type { ToastState } from '@/lib/types/admin/settings/settings.types'
import s from '@/app/(dashboard)/admin/settings/settings.module.css'
import type { JSX } from 'react'

interface ToastProps {
  toast: ToastState
}

export function Toast({ toast }: ToastProps): JSX.Element {
  return (
    <motion.div
      className={`${s.toast} ${toast.type === 'success' ? s.toastSuccess : s.toastError}`}
      variants={toastVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <span className={s.toastIcon}>
        {toast.type === 'success'
          ? <CheckCircle2 size={16} />
          : <XCircle size={16} />
        }
      </span>
      {toast.message}
    </motion.div>
  )
}