/**
 * components/dashboard/student/profile/Modal.tsx
 *
 * Accessible base modal wrapper.
 * - Closes on Escape key
 * - Locks body scroll while open
 * - Backdrop click-to-close (optional — pass onClose to enable)
 * - Animated with framer-motion
 */

'use client'

import { useEffect, type ReactNode } from 'react'
import { motion, AnimatePresence }   from 'framer-motion'
import styles from './css/Modal.module.css'

export interface ModalProps {
  open:       boolean
  onClose:    () => void
  /** Accessible label shown to screen readers */
  title:      string
  /** Max panel width in px (default 520) */
  maxWidth?:  number
  children:   ReactNode
}

export function Modal({
  open,
  onClose,
  title,
  maxWidth = 520,
  children,
}: ModalProps) {
  // Escape key
  useEffect(() => {
    if (!open) {return}
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {onClose()}
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  // Scroll lock
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={styles.backdrop}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={e => { if (e.target === e.currentTarget) {onClose()} }}
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <motion.div
            className={styles.panel}
            style={{ maxWidth }}
            initial={{ opacity: 0, scale: 0.96, y: 14 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{    opacity: 0, scale: 0.96, y: 8  }}
            transition={{ duration: 0.22, ease: [0.34, 1.2, 0.64, 1] }}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}