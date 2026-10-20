// components/dashboard/student/mock-exams/ExamNavigation.tsx
import { ChevronLeft, ChevronRight, SkipForward, Send } from 'lucide-react'
import styles from '@/app/(dashboard)/student/mock-exams/[examId]/mock.module.css'

interface Props {
  current:    number
  total:      number
  submitting: boolean
  onPrev:     () => void
  onNext:     () => void
  onSkip:     () => void
  onSubmit:   () => void
}

export function ExamNavigation({ current, total, submitting, onPrev, onNext, onSkip, onSubmit }: Props) {
  const isLast = current === total - 1

  return (
    <div className={styles.navBar}>
      <div className={styles.navLeft}>
        <button className={styles.btnNav} onClick={onPrev} disabled={current === 0}>
          <ChevronLeft size={15} /> Previous
        </button>
      </div>
      <div className={styles.navRight}>
        <button className={styles.btnSkip} onClick={onSkip}>
          <SkipForward size={14} /> Skip
        </button>
        {!isLast ? (
          <button className={styles.btnNav} onClick={onNext}>
            Next <ChevronRight size={15} />
          </button>
        ) : (
          <button className={styles.btnSubmit} onClick={onSubmit} disabled={submitting}>
            <Send size={14} /> {submitting ? 'Submitting…' : 'Submit Exam'}
          </button>
        )}
      </div>
    </div>
  )
}