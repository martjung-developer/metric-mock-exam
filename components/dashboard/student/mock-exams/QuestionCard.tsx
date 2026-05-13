// components/dashboard/student/mock-exams/QuestionCard.tsx
import { BookOpen, Flag } from 'lucide-react'
import type { Question } from '@/lib/types/student/mock-exams/mock-exams'
import styles from '@/app/(dashboard)/student/mock-exams/[examId]/mock.module.css'

interface Props {
  question:     Question
  index:        number
  total:        number
  answer:       string | undefined
  isFlagged:    boolean
  onAnswer:     (qId: string, value: string) => void
  onFlag:       () => void
}

export function QuestionCard({ question: q, index, total, answer, isFlagged, onAnswer, onFlag }: Props) {
  return (
    <div className={styles.questionCard} key={q.id}>
      <div className={styles.questionMeta}>
        <span className={styles.qNumber}>Question {index + 1} of {total}</span>
        <div className={styles.qBadges}>
          <span className={styles.ptsBadge}>{q.points} pt{q.points !== 1 ? 's' : ''}</span>
          <span className={styles.typeBadge}>{q.question_type.replace(/_/g, ' ')}</span>
          <button
            className={`${styles.flagToggle} ${isFlagged ? styles.flagToggleActive : ''}`}
            onClick={onFlag}
          >
            <Flag size={12} /> {isFlagged ? 'Flagged' : 'Flag'}
          </button>
        </div>
      </div>

      {q.scenario?.trim() ? (
        <div className={styles.scenarioBlock}>
          <div className={styles.scenarioHeader}>
            <BookOpen size={14} />
            <span>Scenario</span>
          </div>
          <p className={styles.scenarioText}>{q.scenario}</p>
        </div>
      ) : null}

      <p className={styles.questionText}>{q.question_text}</p>

      {/* Multiple Choice */}
      {q.question_type === 'multiple_choice' && q.options && (
        <div className={styles.optionList}>
          {q.options.map((opt) => (
            <button
              key={opt.label}
              className={`${styles.optionBtn} ${answer === opt.label ? styles.optionSelected : ''}`}
              onClick={() => onAnswer(q.id, opt.label)}
            >
              <span className={styles.optLabel}>{opt.label}</span>
              <span className={styles.optText}>{opt.text}</span>
            </button>
          ))}
        </div>
      )}

      {/* True / False */}
      {q.question_type === 'true_false' && (
        <div className={styles.tfRow}>
          {(['true', 'false'] as const).map((v) => (
            <button
              key={v}
              className={`${styles.tfBtn} ${answer === v ? styles.tfSelected : ''}`}
              onClick={() => onAnswer(q.id, v)}
            >
              {v === 'true' ? 'True' : 'False'}
            </button>
          ))}
        </div>
      )}

      {/* Essay / Short Answer */}
      {(q.question_type === 'essay' || q.question_type === 'short_answer') && (
        <textarea
          className={styles.textArea}
          placeholder={q.question_type === 'essay' ? 'Write your answer here…' : 'Short answer…'}
          value={answer ?? ''}
          onChange={(e) => onAnswer(q.id, e.target.value)}
        />
      )}

      {/* Fill in the Blank */}
      {q.question_type === 'fill_blank' && (
        <input
          type="text"
          className={styles.fillInput}
          placeholder="Your answer…"
          value={answer ?? ''}
          onChange={(e) => onAnswer(q.id, e.target.value)}
        />
      )}

      {/* Matching */}
      {q.question_type === 'matching' && q.options && (
        <div className={styles.matchList}>
          {q.options.map((opt) => {
            const parsed = (() => {
              try { return JSON.parse(answer ?? '{}') as Record<string, string> }
              catch { return {} }
            })()
            return (
              <div key={opt.label} className={styles.matchRow}>
                <div className={styles.matchLeft}>{opt.label}. {opt.text}</div>
                <span className={styles.matchArrow}>→</span>
                <input
                  type="text"
                  className={styles.matchInput}
                  placeholder="Match…"
                  value={parsed[opt.label] ?? ''}
                  onChange={(e) => {
                    const updated = { ...parsed, [opt.label]: e.target.value }
                    onAnswer(q.id, JSON.stringify(updated))
                  }}
                />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
