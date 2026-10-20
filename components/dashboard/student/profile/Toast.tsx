/**
 * components/dashboard/student/profile/Toast.tsx
 *
 * Stacked animated toast notifications fixed to bottom-right.
 * Purely presentational — receives all state from the parent via props.
 */

'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, AlertCircle, X } from 'lucide-react'
import type { AvatarToast }        from '@/lib/hooks/student/profile/useAvatarUpload'
import styles from './css/Toast.module.css'

interface ToastProps {
  toasts:    AvatarToast[]
  onDismiss: (id: number) => void
}

export function Toast({ toasts, onDismiss }: ToastProps) {
  return (
    <div
      className={styles.stack}
      aria-live="polite"
      aria-atomic="false"
      role="region"
      aria-label="Notifications"
    >
      <AnimatePresence initial={false}>
        {toasts.map(t => (
          <motion.div
            key={t.id}
            layout
            className={`${styles.toast} ${t.variant === 'success' ? styles.success : styles.error}`}
            initial={{ opacity: 0, y: 20, scale: 0.94 }}
            animate={{ opacity: 1, y: 0,  scale: 1    }}
            exit={{    opacity: 0, y: 10, scale: 0.94 }}
            transition={{ duration: 0.22, ease: [0.34, 1.2, 0.64, 1] }}
          >
            <span className={styles.icon} aria-hidden="true">
              {t.variant === 'success'
                ? <CheckCircle2 size={15} />
                : <AlertCircle  size={15} />}
            </span>
            <span className={styles.message}>{t.message}</span>
            <button
              className={styles.close}
              onClick={() => onDismiss(t.id)}
              aria-label="Dismiss notification"
            >
              <X size={12} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}