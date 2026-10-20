// components/dashboard/student/mock-exams/ExamTopBar.tsx
import { Clock, Send, History } from 'lucide-react'
import { formatTime } from '@/lib/utils/student/mock-exams/mock-exams'
import styles from '@/app/(dashboard)/student/mock-exams/[examId]/mock.module.css'

interface Props {
  title:          string
  current:        number
  total:          number
  timeLeft:       number
  timerWarning:   boolean
  timerCritical:  boolean
  submitting:     boolean
  saveStatus:     'idle' | 'saving' | 'saved'
  tabViolations:  number
  onSubmit:       () => void
  onViewHistory:  () => void
}

export function ExamTopBar({
  title, current, total, timeLeft, timerWarning, timerCritical,
  submitting, saveStatus, tabViolations, onSubmit, onViewHistory,
}: Props) {
  const timerCls = timerCritical ? styles.timerCrit : timerWarning ? styles.timerWarn : ''

  return (
    <div className={styles.topBar}>
      <div className={styles.topLeft}>
        <span className={styles.examTitle}>{title}</span>
        <span className={styles.mockBadge}>Mock Exam</span>
        {saveStatus !== 'idle' && (
          <span className={styles.saveStatus} data-status={saveStatus}>
            {saveStatus === 'saving' ? 'Saving…' : '✓ Saved'}
          </span>
        )}
        {tabViolations > 0 && (
          <span className={styles.violationBadge}>
            ⚠ {tabViolations} tab switch{tabViolations !== 1 ? 'es' : ''} detected
          </span>
        )}
      </div>
      <div className={styles.topCenter}>
        <span className={styles.progressLabel}>{current + 1} / {total}</span>
        <span className={`${styles.timer} ${timerCls}`}>
          <Clock size={13} /> {formatTime(timeLeft)}
        </span>
      </div>
      <div className={styles.topRight}>
        <button className={styles.btnHistory} onClick={onViewHistory} title="View attempt history">
          <History size={14} />
        </button>
        <button className={styles.btnTopSubmit} onClick={onSubmit} disabled={submitting}>
          <Send size={13} /> Submit
        </button>
      </div>
    </div>
  )
}