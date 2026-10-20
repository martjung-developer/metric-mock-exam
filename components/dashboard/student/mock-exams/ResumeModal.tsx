// components/dashboard/student/mock-exams/ResumeModal.tsx
import { RotateCcw, PlayCircle } from 'lucide-react'
import styles from '@/app/(dashboard)/student/mock-exams/[examId]/mock.module.css'

interface Props {
  onResume:  () => void
  onRestart: () => void
}

export function ResumeModal({ onResume, onRestart }: Props) {
  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.modalIcon} style={{ background: '#eff6ff', border: '2px solid #bfdbfe' }}>
          <RotateCcw size={24} color="#1d4ed8" />
        </div>
        <h2 className={styles.modalTitle}>Resume Your Exam?</h2>
        <p className={styles.modalBody}>
          You have an existing in-progress session for this exam. Would you like to continue where you left off, or start fresh?
        </p>
        <div className={styles.modalActions}>
          <button className={styles.btnModalCancel} onClick={onRestart}>
            <RotateCcw size={13} style={{ marginRight: 4 }} /> Start Fresh
          </button>
          <button className={styles.btnModalConfirm} onClick={onResume}>
            <PlayCircle size={13} style={{ marginRight: 4 }} /> Resume Exam
          </button>
        </div>
      </div>
    </div>
  )
}