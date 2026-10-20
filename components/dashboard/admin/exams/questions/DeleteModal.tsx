// components/dashboard/admin/exams/questions/DeleteModal.tsx
// Pure UI — confirmation dialog for question deletion.

import { Loader2, Trash2 } from 'lucide-react'
import type { Question } from '@/lib/types/admin/exams/questions/questions.types'
import s from '@/app/(dashboard)/admin/exams/[examId]/questions/questions.module.css'
import type { JSX } from 'react/jsx-dev-runtime'

interface DeleteModalProps {
  target:    Question
  deleting:  boolean
  onConfirm: () => void
  onCancel:  () => void
}

export function DeleteModal({
  target,
  deleting,
  onConfirm,
  onCancel,
}: DeleteModalProps): JSX.Element {
  return (
    <div className={s.modalOverlay}>
      <div className={s.deleteModal}>
        <div className={s.deleteModalIcon}>
          <Trash2 size={22} color="var(--danger)" />
        </div>
        <h2 className={s.modalTitle}>Delete Question?</h2>
        <p className={s.deleteModalBody}>
          This question and all associated answers will be permanently deleted.
        </p>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
          &ldquo;{target.question_text.slice(0, 80)}{target.question_text.length > 80 ? '…' : ''}&rdquo;
        </p>
        <div className={s.modalActions}>
          <button className={s.btnSecondary} onClick={onCancel} disabled={deleting}>
            Cancel
          </button>
          <button className={s.btnDanger} onClick={onConfirm} disabled={deleting}>
            {deleting
              ? <><Loader2 size={13} className={s.spinner} /> Deleting…</>
              : <><Trash2 size={13} /> Delete</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}