// components/dashboard/admin/exams/answer-key/QuestionRow.tsx
// ─────────────────────────────────────────────────────────────────────────────
// CHANGES FROM PREVIOUS VERSION:
//   + Shows scenario block above question text when entry.scenario is set
//   + No prop interface changes — scenario comes from AnswerKeyEntry
// ─────────────────────────────────────────────────────────────────────────────
'use client'

import { BookOpen, Edit3, Pencil } from 'lucide-react'
import type { AnswerKeyEntry } from '@/lib/types/admin/exams/answer-key/answerKey.types'
import { effectiveAnswer, AUTO_TYPES } from '@/lib/types/admin/exams/answer-key/answerKey.types'
import s from '@/app/(dashboard)/admin/exams/[examId]/answer-key/answer-key.module.css'

interface QuestionRowProps {
  entry:         AnswerKeyEntry
  index:         number
  previewMode:   boolean
  onSetOverride: (questionId: string, value: string | null) => void
  onOpenRubric:  (entry: AnswerKeyEntry) => void
}

export function QuestionRow({
  entry,
  index,
  previewMode,
  onSetOverride,
  onOpenRubric,
}: QuestionRowProps) {
  const isAuto    = AUTO_TYPES.includes(entry.question_type)
  const effective = effectiveAnswer(entry)
  const isDirty   =
    entry.override !== null && entry.override !== (entry.correct_answer ?? '')
  const scenario  = (entry.scenario ?? '').trim()

  return (
    <div className={`${s.questionRow} ${isDirty ? s.questionRowDirty : ''}`}>
      {/* Order index */}
      <div className={s.questionIndex}>{index + 1}</div>

      {/* Main content */}
      <div className={s.questionMain}>
        {/* Scenario block — only when present */}
        {scenario.length > 0 && (
          <div style={{
            display:      'flex',
            alignItems:   'flex-start',
            gap:          6,
            marginBottom: '0.4rem',
            padding:      '0.35rem 0.6rem',
            background:   '#eff6ff',
            border:       '1px solid #bfdbfe',
            borderRadius: 7,
            fontSize:     '0.74rem',
            color:        '#1e40af',
            lineHeight:   1.5,
          }}>
            <BookOpen size={12} style={{ flexShrink: 0, marginTop: 2 }} />
            <span>{scenario}</span>
          </div>
        )}

        <p className={s.questionText}>{entry.question_text}</p>

        {/* MCQ options */}
        {entry.question_type === 'multiple_choice' && entry.options && (
          <div className={s.optionsGrid}>
            {entry.options.map((opt) => (
              <span
                key={opt.label}
                className={`${s.optChip} ${
                  effective === opt.label ? s.optChipCorrect : ''
                }`}
              >
                {opt.label}: {opt.text}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Answer / rubric control */}
      <div className={s.answerControl}>
        {isAuto ? (
          previewMode ? (
            <span className={s.answerPreview}>
              {effective || <span className={s.answerEmpty}>—</span>}
            </span>
          ) : (
            <div className={s.answerInputWrap}>
              <input
  className={`${s.answerInput} ${isDirty ? s.answerInputDirty : ''}`}
  value={entry.override ?? (entry.correct_answer ?? '')}
  placeholder="Enter answer…"
  onChange={(e) =>
    onSetOverride(entry.question_id, e.target.value)
  }
/>
              {isDirty && (
                <button
                  className={s.answerRevert}
                  title="Revert to saved"
                  onClick={() => onSetOverride(entry.question_id, null)}
                >
                  <Edit3 size={11} />
                </button>
              )}
            </div>
          )
        ) : (
          <button
            className={s.rubricBtn}
            onClick={() => onOpenRubric(entry)}
          >
            <Pencil size={12} />
            {entry.explanation ? 'Edit Rubric' : 'Add Rubric'}
          </button>
        )}
      </div>
    </div>
  )
}