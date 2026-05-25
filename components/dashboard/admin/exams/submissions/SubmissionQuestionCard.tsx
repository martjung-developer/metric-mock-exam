import { CheckCircle2, Clock, FileText, XCircle } from 'lucide-react'
import css from './GradingModal.module.css'

export interface SubmissionQuestionChoice {
  label: string
  text: string
}

interface SubmissionQuestionCardProps {
  questionId: string
  index: number
  points: number
  scenario: string | null
  stem: string
  options: SubmissionQuestionChoice[]
  correctLabel: string | null
  studentLabel: string | null
}

function normalizeLabel(value: string | null): string | null {
  if (!value) {return null}
  return value.trim().toLowerCase()
}

export function SubmissionQuestionCard({
  questionId,
  index,
  points,
  scenario,
  stem,
  options,
  correctLabel,
  studentLabel,
}: SubmissionQuestionCardProps) {
  const normCorrect = normalizeLabel(correctLabel)
  const normStudent = normalizeLabel(studentLabel)
  const unanswered = !normStudent
  const isCorrect = !unanswered && normCorrect !== null && normStudent === normCorrect

  return (
    <div className={css.questionCard}>
      <div className={css.questionCardHeader}>
        <span className={css.questionNumber}>Question {index + 1}</span>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <span className={css.pointsBadge}>{points} pt</span>
          {unanswered ? (
            <span className={css.pendingPill}><Clock size={12} /> Unanswered</span>
          ) : isCorrect ? (
            <span className={css.correctPill}><CheckCircle2 size={12} /> Correct</span>
          ) : (
            <span className={css.wrongPill}><XCircle size={12} /> Wrong</span>
          )}
        </div>
      </div>

      {scenario && (
        <div className={css.scenarioBlock}>
          <div className={css.scenarioLabel}><FileText size={14} /> SCENARIO</div>
          <div className={css.scenarioText}>{scenario}</div>
        </div>
      )}

      <div className={css.questionStem}>{stem}</div>

      <div className={css.choices}>
        {options.map((opt) => {
          const optLabel = normalizeLabel(opt.label)
          const isCorrectOption = normCorrect !== null && optLabel === normCorrect
          const isStudentOption = normStudent !== null && optLabel === normStudent
          const isWrongStudent = isStudentOption && !isCorrectOption

          return (
            <div
              key={`${questionId}-${opt.label}`}
              className={`${css.choiceRow} ${isCorrectOption ? css.choiceRowCorrect : ''} ${isWrongStudent ? css.choiceRowWrong : ''}`}
            >
              <span className={`${css.choiceLetter} ${isCorrectOption ? css.choiceLetterCorrect : ''} ${isWrongStudent ? css.choiceLetterWrong : ''}`}>
                {opt.label}
              </span>
              <span className={`${css.choiceText} ${isCorrectOption ? css.choiceTextCorrect : ''} ${isWrongStudent ? css.choiceTextWrong : ''}`}>
                {opt.text}
              </span>
              {isCorrectOption && <CheckCircle2 size={16} className={css.choiceIcon} />}
              {isWrongStudent && <XCircle size={16} className={css.choiceIcon} />}
            </div>
          )
        })}
      </div>

      {unanswered && (
        <div className={css.unansweredBanner}>
          <Clock size={14} /> Not answered
        </div>
      )}
    </div>
  )
}

