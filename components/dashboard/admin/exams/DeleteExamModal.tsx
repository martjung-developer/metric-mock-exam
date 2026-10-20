// components/dashboard/admin/exams/DeleteExamModal.tsx
import { Trash2, Loader2 } from 'lucide-react'
import type { Exam } from '@/lib/types/admin/exams/exam.types'
import s from '@/app/(dashboard)/admin/exams/exams.module.css'

interface DeleteExamModalProps {
  exam:      Exam
  deleting:  boolean
  onCancel:  () => void
  onConfirm: () => void
}

export function DeleteExamModal({
  exam,
  deleting,
  onCancel,
  onConfirm,
}: DeleteExamModalProps) {
  return (
    <div className={s.modalOverlay}>
      <div className={s.modal}>
        <div className={s.modalIcon}>
          <Trash2 size={22} color="var(--danger)" />
        </div>
        <h2 className={s.modalTitle}>Delete Exam?</h2>
        <p className={s.modalBody}>
          Are you sure you want to delete <strong>&quot;{exam.title}&quot;</strong>?
          This will also remove all questions, assignments, and submissions.
          This action cannot be undone.
        </p>
        <div className={s.modalActions}>
          <button
            className={s.btnSecondary}
            onClick={onCancel}
            disabled={deleting}
          >
            Cancel
          </button>
          <button
            className={s.btnDanger}
            onClick={onConfirm}
            disabled={deleting}
          >
            {deleting
              ? <><Loader2 size={13} className={s.spinner} /> Deleting…</>
              : <><Trash2 size={13} /> Delete</>}
          </button>
        </div>
      </div>
    </div>
  )
}