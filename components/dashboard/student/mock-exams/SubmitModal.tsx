// components/dashboard/student/mock-exams/SubmitModal.tsx
import { AlertTriangle } from 'lucide-react'
import styles from '@/app/(dashboard)/student/mock-exams/[examId]/mock.module.css'

interface Props {
  answeredCount:   number
  skippedCount:    number
  unansweredCount: number
  submitting:      boolean
  onCancel:        () => void
  onConfirm:       () => void
}

export function SubmitModal({
  answeredCount, skippedCount, unansweredCount, submitting, onCancel, onConfirm,
}: Props) {
  return (
    <div className={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) {onCancel()} }}>
      <div className={styles.modal}>
        <div className={styles.modalIcon} style={{ background: '#fffbeb', border: '2px solid #fde68a' }}>
          <AlertTriangle size={24} color="#d97706" />
        </div>
        <h2 className={styles.modalTitle}>Submit Exam?</h2>
        <p className={styles.modalBody}>
          Once submitted you cannot change your answers. Your exam will be reviewed by faculty before results are released.
        </p>
        <div className={styles.modalStatRow}>
          <div className={styles.modalStat}>
            <span className={styles.modalStatVal} style={{ color: '#059669' }}>{answeredCount}</span>
            <span className={styles.modalStatLbl}>Answered</span>
          </div>
          <div className={styles.modalStat}>
            <span className={styles.modalStatVal} style={{ color: '#d97706' }}>{skippedCount}</span>
            <span className={styles.modalStatLbl}>Skipped</span>
          </div>
          <div className={styles.modalStat}>
            <span className={styles.modalStatVal} style={{ color: '#dc2626' }}>{unansweredCount}</span>
            <span className={styles.modalStatLbl}>Unanswered</span>
          </div>
        </div>
        <div className={styles.modalActions}>
          <button className={styles.btnModalCancel} onClick={onCancel}>Keep reviewing</button>
          <button
            className={styles.btnModalConfirm}
            onClick={onConfirm}
            disabled={submitting}
          >
            {submitting ? 'Submitting…' : 'Submit now'}
          </button>
        </div>
      </div>
    </div>
  )
}