// components/dashboard/admin/students/DeleteStudentModal.tsx
import { Trash2 } from 'lucide-react'
import type { Students } from '@/lib/types/admin/students/student.types'
import styles from '@/app/(dashboard)/admin/students/students.module.css'

interface DeleteStudentModalProps {
  student:   Students
  deleting:  boolean
  onConfirm: () => void
  onCancel:  () => void
}

export function DeleteStudentModal({ student, deleting, onConfirm, onCancel }: DeleteStudentModalProps) {
  return (
    <div className={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) {onCancel()} }}>
      <div className={styles.modal}>
        <div className={styles.modalIcon} style={{ background: '#fee2e2', border: '2px solid #fca5a5' }}>
          <Trash2 size={22} color="#dc2626" />
        </div>
        <h2 className={styles.modalTitle}>Delete Student?</h2>
        <p className={styles.modalBody}>
          This will permanently remove <strong>{student.full_name ?? student.email}</strong> and all their data. This cannot be undone.
        </p>
        <div className={styles.modalActions}>
          <button className={styles.btnModalCancel} onClick={onCancel}>Cancel</button>
          <button className={styles.btnModalDanger} onClick={onConfirm} disabled={deleting}>
            {deleting ? 'Deleting…' : 'Delete Student'}
          </button>
        </div>
      </div>
    </div>
  )
}