/**
 * components/dashboard/admin/exams/assignments/UnassignModal.tsx
 *
 * Pure presentational component.
 * Renders the unassign confirmation modal.
 */

'use client'

import { Loader2, Trash2, Users } from 'lucide-react'
import type { Assignment }        from '@/lib/types/admin/exams/assignments/assignments.types'
import s from '@/app/(dashboard)/admin/exams/[examId]/assignments/assignments.module.css'

interface UnassignModalProps {
  target:      Assignment
  unassigning: boolean
  onConfirm:   () => void
  onCancel:    () => void
}

export function UnassignModal({
  target,
  unassigning,
  onConfirm,
  onCancel,
}: UnassignModalProps) {
  return (
    <div className={s.modalOverlay}>
      <div className={s.modal}>
        <div className={s.modalIcon}>
          <Users size={22} color="var(--danger)" />
        </div>

        <h2 className={s.modalTitle}>Unassign Student?</h2>

        <p className={s.modalBody}>
          Remove <strong>{target.student.full_name}</strong> from this exam?
          Their submission data will be preserved.
        </p>

        <div className={s.modalActions}>
          <button
            className={s.btnSecondary}
            onClick={onCancel}
            disabled={unassigning}
          >
            Cancel
          </button>

          <button
            className={s.btnDanger}
            onClick={onConfirm}
            disabled={unassigning}
          >
            {unassigning ? (
              <>
                <Loader2 size={13} className={s.spinner} /> Removing…
              </>
            ) : (
              <>
                <Trash2 size={13} /> Unassign
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}