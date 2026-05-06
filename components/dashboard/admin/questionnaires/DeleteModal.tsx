'use client'
// components/dashboard/admin/questionnaires/DeleteModal.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { Trash2, Loader2 }         from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { modalVariants }           from '@/animations/admin/questionnaires/questionnaires'
import type { UseQuestionnairesReturn } from '@/lib/hooks/admin/questionnaires/useQuestionnaires'
import styles                      from '@/app/(dashboard)/admin/questionnaires/questionnaires.module.css'

type Q = UseQuestionnairesReturn

export function DeleteModal({ q }: { q: Q }) {
  return (
    <AnimatePresence>
      {q.deleteId && (
        <motion.div
          className={styles.modalOverlay}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => { if (e.target === e.currentTarget) {q.setDeleteId(null)} }}
        >
          <motion.div
            className={styles.deleteModal}
            variants={modalVariants} initial="hidden" animate="visible" exit="exit"
          >
            <div className={styles.deleteIcon}><Trash2 size={22} color="#dc2626" /></div>
            <p className={styles.deleteTitle}>Delete Question?</p>
            <p className={styles.deleteBody}>
              This will permanently remove the question. This action cannot be undone.
            </p>
            <div className={styles.deleteActions}>
              <button
                className={styles.btnSecondary}
                onClick={() => q.setDeleteId(null)}
                disabled={q.deleting}
              >
                Cancel
              </button>
              <button
                className={styles.btnDanger}
                onClick={() => void q.handleDelete()}
                disabled={q.deleting}
              >
                {q.deleting ? <Loader2 size={14} className={styles.spinner} /> : <Trash2 size={14} />}
                {q.deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}