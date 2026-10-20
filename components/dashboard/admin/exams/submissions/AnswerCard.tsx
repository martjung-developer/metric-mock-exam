// components/dashboard/admin/exams/submissions/AnswerCard.tsx
import { ThumbsUp, ThumbsDown, MinusCircle } from 'lucide-react'
import type { AnswerDetail, AnswerKeyEntry } from '@/lib/types/admin/exams/submissions/answer.types'
import type { GradingMode, SubmissionStatus } from '@/lib/types/admin/exams/submissions/submission.types'
import { TYPE_ICONS, AUTO_TYPES } from '@/lib/utils/admin/submissions/constants'
import s from '@/app/(dashboard)/admin/exams/[examId]/submissions/submissions.module.css'

interface AnswerCardProps {
  ans:          AnswerDetail
  index:        number
  gradingMode:  GradingMode
  viewStatus:   SubmissionStatus
  answerKey:    AnswerKeyEntry[]
  onCorrectToggle: (id: string, correct: boolean) => void
  onPointsChange:  (id: string, pts: number)      => void
  onFeedbackChange:(id: string, fb: string)        => void
}

export function AnswerCard({
  ans, index, gradingMode, viewStatus, answerKey,
  onCorrectToggle, onPointsChange, onFeedbackChange,
}: AnswerCardProps) {
  const q = ans.question
  if (!q) {return null}

  const Icon        = TYPE_ICONS[q.question_type]
  const isManual    = !AUTO_TYPES.includes(q.question_type)
  const isPending   = ans.is_correct === null
  const isCorrect   = ans.is_correct === true
  const isWrong     = ans.is_correct === false
  const canOverride = ['submitted', 'graded', 'reviewed'].includes(viewStatus)

  const effectiveCorrect = gradingMode === 'manual'
    ? (answerKey.find(k => k.question_id === ans.question_id)?.correct_answer ?? q.correct_answer)
    : q.correct_answer

  return (
    <div className={`${s.answerCard} ${isPending ? s.answerPending : isCorrect ? s.answerCorrect : isWrong ? s.answerWrong : ''}`}>
      {/* Header */}
      <div className={s.answerCardHeader}>
        <div className={s.answerQNum}>Q{q.order_number ?? index + 1}</div>
        <div className={s.answerQText}>{q.question_text}</div>
        <div className={s.answerMeta}>
          <span className={s.answerTypePill}><Icon size={10} />{q.question_type.replace(/_/g, ' ')}</span>
          <span className={s.answerPointsPill}>{q.points} pt{q.points !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Body */}
      <div className={s.answerCardBody}>
        {/* MCQ */}
        {q.question_type === 'multiple_choice' && q.options && (
          <div className={s.mcqOptions}>
            {q.options.map(opt => {
              const isStudentAns  = ans.answer_text === opt.label
              const isCorrectOpt  = effectiveCorrect === opt.label
              return (
                <div key={opt.label} className={`${s.mcqOpt} ${
                  isCorrectOpt && isStudentAns  ? s.mcqOptCorrect :
                  isStudentAns && !isCorrectOpt ? s.mcqOptWrong :
                  isCorrectOpt && !isStudentAns ? s.mcqOptCorrectUnchosen : ''
                }`}>
                  <span className={s.mcqOptLabel}>{opt.label}</span>
                  <span>{opt.text}</span>
                  {isStudentAns && <span className={s.mcqOptTag}>Student</span>}
                  {isCorrectOpt && !isStudentAns && <span className={s.mcqOptTagCorrect}>Correct</span>}
                </div>
              )
            })}
          </div>
        )}

        {/* T/F */}
        {q.question_type === 'true_false' && (
          <div className={s.tfAnswerRow}>
            <span className={s.tfAnswerLabel}>Student:</span>
            <span className={`${s.tfAnswerValue} ${ans.answer_text === effectiveCorrect ? s.tfCorrect : s.tfWrong}`}>
              {ans.answer_text ? ans.answer_text.charAt(0).toUpperCase() + ans.answer_text.slice(1) : '—'}
            </span>
            {ans.answer_text !== effectiveCorrect && (
              <>
                <span className={s.tfAnswerLabel}>&nbsp;· Correct:</span>
                <span className={s.tfCorrect}>
                  {effectiveCorrect ? effectiveCorrect.charAt(0).toUpperCase() + effectiveCorrect.slice(1) : '—'}
                </span>
              </>
            )}
          </div>
        )}

        {/* Text types */}
        {['short_answer', 'essay', 'fill_blank'].includes(q.question_type) && (
          <div className={s.textAnswer}>
            <p className={s.textAnswerLabel}>Student&apos;s Answer:</p>
            <div className={s.textAnswerBox}>
              {ans.answer_text || <span className={s.na}>No answer provided</span>}
            </div>
            {effectiveCorrect && q.question_type === 'fill_blank' && (
              <p className={s.textAnswerExpected}>Expected: <strong>{effectiveCorrect}</strong></p>
            )}
          </div>
        )}

        {/* Manual grading controls */}
        {canOverride && (isManual || gradingMode === 'manual') && (
          <div className={s.manualGradeRow}>
            <span className={s.manualGradeLabel}>Mark:</span>
            <button
              className={`${s.markBtn} ${isCorrect ? s.markBtnCorrect : ''}`}
              onClick={() => onCorrectToggle(ans.id, true)}
            ><ThumbsUp size={11} /> Correct</button>
            <button
              className={`${s.markBtn} ${isWrong ? s.markBtnWrong : ''}`}
              onClick={() => onCorrectToggle(ans.id, false)}
            ><ThumbsDown size={11} /> Wrong</button>
            <div className={s.pointsControl}>
              <input
                type="number"
                className={s.pointsInput}
                min={0}
                max={q.points}
                value={ans.points_earned ?? 0}
                onChange={e => onPointsChange(ans.id, Number(e.target.value))}
              />
              <span className={s.pointsMax}>/ {q.points} pts</span>
            </div>
          </div>
        )}

        {/* Status pill */}
        <div className={s.answerStatusRow}>
          {isPending
            ? <span className={s.pendingPill}><MinusCircle size={11} /> Pending Review</span>
            : isCorrect
            ? <span className={s.correctPill}><ThumbsUp size={11} /> Correct · {ans.points_earned ?? q.points} pts</span>
            : <span className={s.wrongPill}><ThumbsDown size={11} /> Incorrect · 0 pts</span>}
          {q.explanation && <span className={s.explanationPill}>💡 Has explanation</span>}
        </div>

        {q.explanation && <div className={s.explanationBox}>{q.explanation}</div>}

        {canOverride && (
          <input
            className={s.feedbackInput}
            placeholder="Feedback for this answer (optional)…"
            value={ans.feedback}
            onChange={e => onFeedbackChange(ans.id, e.target.value)}
          />
        )}
        {ans.feedback && !canOverride && (
          <div className={s.feedbackBox}><strong>Feedback:</strong> {ans.feedback}</div>
        )}

        {q.question_type === 'essay' && isPending && (
          <div className={s.aiFuturePlaceholder}>
            {/* FUTURE: sendToPythonService(ans.answer_text) */}
            🤖 AI-assisted grading coming soon
          </div>
        )}
      </div>
    </div>
  )
}