// components/dashboard/student/mock-exams/ExamSidebar.tsx
import { Target } from 'lucide-react'
import { resolveQState } from '@/lib/utils/student/mock-exams/mock-exams'
import type { Question, AnswerMap, StateMap } from '@/lib/types/student/mock-exams/mock-exams'
import styles from '@/app/(dashboard)/student/mock-exams/[examId]/mock.module.css'

interface Props {
  questions:       Question[]
  current:         number
  answers:         AnswerMap
  qStates:         StateMap
  answeredCount:   number
  skippedCount:    number
  unansweredCount: number
  onSelect:        (idx: number) => void
  onJumpUnanswered: () => void
}

const STATE_LABELS: Record<string, string> = {
  answered:        'Answered',
  skipped:         'Skipped',
  flagged:         'Flagged',
  'flagged-answered': 'Flagged+Ans',
  current:         'Current',
}

const LEGEND = [
  { label: 'Answered', color: '#10b981' },
  { label: 'Skipped',  color: '#f59e0b' },
  { label: 'Flagged',  color: '#8b5cf6' },
  { label: 'Current',  color: '#0d2540' },
]

export function ExamSidebar({
  questions, current, answers, qStates,
  answeredCount, skippedCount, unansweredCount,
  onSelect, onJumpUnanswered,
}: Props) {
  return (
    <div className={styles.sidebar}>
      <div className={styles.sidebarHead}>
        <div className={styles.sidebarHeading}>Questions</div>
        <div className={styles.progressStats}>
          <span className={styles.progressStat} style={{ color: '#10b981' }}>
            {answeredCount} answered
          </span>
          <span className={styles.progressStat} style={{ color: '#f59e0b' }}>
            {skippedCount} skipped
          </span>
          <span className={styles.progressStat} style={{ color: '#ef4444' }}>
            {unansweredCount} left
          </span>
        </div>
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{ width: `${questions.length ? (answeredCount / questions.length) * 100 : 0}%` }}
          />
        </div>
        <div className={styles.legend}>
          {LEGEND.map((l) => (
            <div key={l.label} className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: l.color }} />
              {l.label}
            </div>
          ))}
        </div>
        {unansweredCount > 0 && (
          <button className={styles.jumpBtn} onClick={onJumpUnanswered}>
            <Target size={12} strokeWidth={2.5} />
            Jump to Unanswered
          </button>
        )}
      </div>

      <div className={styles.palette}>
        {questions.map((pq, idx) => {
          const state = resolveQState(pq.id, answers, qStates)
          const isCur = idx === current
          const stateLabel = isCur ? 'Current' : (STATE_LABELS[state] ?? state)
          return (
            <button
              key={pq.id}
              className={`${styles.palBtn} ${
                isCur                          ? styles.palCurrent        :
                state === 'answered'           ? styles.palAnswered       :
                state === 'skipped'            ? styles.palSkipped        :
                state === 'flagged'            ? styles.palFlagged        :
                state === 'flagged-answered'   ? styles.palFlaggedAnswered:
                ''
              }`}
              onClick={() => onSelect(idx)}
              title={`Q${idx + 1}: ${stateLabel}`}
            >
              {idx + 1}
              {(state === 'flagged' || state === 'flagged-answered') && !isCur && (
                <span className={styles.flagPip} />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}