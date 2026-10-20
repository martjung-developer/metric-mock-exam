// components/dashboard/admin/study-materials/DeleteModal.tsx
'use client'

import { Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { StudyMaterial } from '@/lib/types/admin/study-materials/study-materials'
import styles from '@/app/(dashboard)/admin/study-materials/study-materials.module.css'
import {
  overlayVariants,
  modalVariants,
  buttonVariants,
} from '@/animations/admin/study-materials/study-materials'

interface Props {
  target:      StudyMaterial | null
  submitting:  boolean
  onConfirm:   () => Promise<void>
  onClose:     () => void
}

export function DeleteModal({ target, submitting, onConfirm, onClose }: Props) {
  return (
    <AnimatePresence>
      {target && (
        <motion.div
          className={styles.modalOverlay}
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={(e) => { if (e.target === e.currentTarget) { onClose() } }}
        >
          <motion.div
            className={styles.modal}
            style={{ maxWidth: 400 }}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className={styles.deleteBody}>
              <div className={styles.deleteIcon}>
                <Trash2 size={20} color="#ef4444" />
              </div>
              <h2 className={styles.deleteTitle}>Delete Material</h2>
              <p className={styles.deleteDesc}>
                Are you sure you want to delete{' '}
                <strong>&quot;{target.title}&quot;</strong>?{' '}
                This action cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  className={styles.btnSecondary}
                  onClick={onClose}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <motion.button
                  className={styles.btnDanger}
                  variants={buttonVariants}
                  initial="idle"
                  whileHover="hover"
                  whileTap="tap"
                  onClick={onConfirm}
                  disabled={submitting}
                >
                  {submitting ? 'Deleting…' : 'Yes, Delete'}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}