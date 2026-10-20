// components/dashboard/admin/exams/answer-key/AnswerInput.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Renders the correct input widget for each question type.
// Pure UI — receives callbacks, touches no state directly.
// ─────────────────────────────────────────────────────────────────────────────
import { RotateCcw, Pencil, FileText } from 'lucide-react'
import type { AnswerKeyEntry } from '@/lib/types/admin/exams/answer-key/answerKey.types'
import { effectiveAnswer }     from '@/lib/types/admin/exams/answer-key/answerKey.types'
import s from '@/app/(dashboard)/admin/exams/[examId]/answer-key/answer-key.module.css'

interface AnswerInputProps {
  entry:           AnswerKeyEntry
  previewMode:     boolean
  onSetOverride:   (questionId: string, value: string | null) => void
  onOpenRubric:    (entry: AnswerKeyEntry) => void
}

export function AnswerInput({
  entry,
  previewMode,
  onSetOverride,
  onOpenRubric,
}: AnswerInputProps) {
  const val        = effectiveAnswer(entry)
  const isOverridden = entry.override !== null

  // ── Preview mode ────────────────────────────────────────────────────────────
  if (previewMode) {
    return (
      <div className={`${s.previewAnswer} ${val ? s.previewAnswerFilled : s.previewAnswerEmpty}`}>
        {val || <span className={s.noAnswer}>No answer set</span>}
      </div>
    )
  }

  // ── Edit mode ───────────────────────────────────────────────────────────────
  switch (entry.question_type) {
    case 'multiple_choice':
      return (
        <div className={s.mcqAnswerGroup}>
          {(entry.options ?? []).map((opt) => (
            <button
              key={opt.label}
              type="button"
              className={`${s.mcqOption} ${val === opt.label ? s.mcqOptionSelected : ''}`}
              onClick={() => onSetOverride(entry.question_id, opt.label)}
              title={opt.text}
            >
              <span className={s.mcqLabel}>{opt.label}</span>
              <span className={s.mcqText}>
                {opt.text.length > 30 ? opt.text.slice(0, 30) + '…' : opt.text}
              </span>
            </button>
          ))}
          {isOverridden && (
            <button
              className={s.clearOverride}
              onClick={() => onSetOverride(entry.question_id, null)}
            >
              <RotateCcw size={11} /> Reset
            </button>
          )}
        </div>
      )

    case 'true_false':
      return (
        <div className={s.tfAnswerGroup}>
          <button
            type="button"
            className={`${s.tfBtn} ${val === 'true' ? s.tfBtnTrue : ''}`}
            onClick={() => onSetOverride(entry.question_id, 'true')}
          >
            True
          </button>
          <button
            type="button"
            className={`${s.tfBtn} ${val === 'false' ? s.tfBtnFalse : ''}`}
            onClick={() => onSetOverride(entry.question_id, 'false')}
          >
            False
          </button>
          {isOverridden && (
            <button
              className={s.clearOverride}
              onClick={() => onSetOverride(entry.question_id, null)}
            >
              <RotateCcw size={11} />
            </button>
          )}
        </div>
      )

    case 'fill_blank':
      return (
        <div className={s.textAnswerWrap}>
          <input
            className={`${s.textAnswerInput} ${isOverridden ? s.textAnswerInputOverridden : ''}`}
            value={val}
            placeholder="Enter expected answer…"
            onChange={(e) => onSetOverride(entry.question_id, e.target.value)}
          />
          {isOverridden && (
            <button
              className={s.clearOverride}
              onClick={() => onSetOverride(entry.question_id, null)}
              title="Reset to stored"
            >
              <RotateCcw size={11} />
            </button>
          )}
        </div>
      )

    case 'short_answer':
      return (
        <div className={s.manualAnswerWrap}>
          <div className={s.manualTag}><Pencil size={11} /> Manual Grading</div>
          <textarea
            className={`${s.shortAnswerTextarea} ${isOverridden ? s.textAnswerInputOverridden : ''}`}
            rows={2}
            value={val}
            placeholder="Keyword list or model answer for reference…"
            onChange={(e) => onSetOverride(entry.question_id, e.target.value)}
          />
          <button className={s.rubricBtn} onClick={() => onOpenRubric(entry)}>
            <FileText size={11} />
            {entry.explanation ? 'Edit Rubric' : 'Add Rubric'}
            {entry.explanation && <span className={s.rubricBadge}>✓</span>}
          </button>
        </div>
      )

    case 'essay':
      return (
        <div className={s.manualAnswerWrap}>
          <div className={s.manualTag}><Pencil size={11} /> Manual + AI-Assisted</div>
          <p className={s.essayNote}>
            Essay grading uses rubrics and optional AI scoring. Set a rubric to guide graders.
          </p>
          <button
            className={`${s.rubricBtn} ${entry.explanation ? s.rubricBtnFilled : ''}`}
            onClick={() => onOpenRubric(entry)}
          >
            <FileText size={11} />
            {entry.explanation ? 'Edit Rubric' : 'Add Rubric'}
            {entry.explanation && <span className={s.rubricBadge}>✓</span>}
          </button>
          <div className={s.aiFuturePlaceholder}>
            🤖 AI keyword scoring — coming soon
          </div>
        </div>
      )

    case 'matching':
      return (
        <div className={s.manualAnswerWrap}>
          <div className={s.manualTag}><Pencil size={11} /> Manual Grading</div>
          <textarea
            className={`${s.shortAnswerTextarea} ${isOverridden ? s.textAnswerInputOverridden : ''}`}
            rows={3}
            value={val}
            placeholder={`JSON pairs, e.g.\n[{"left":"Term","right":"Definition"}]`}
            onChange={(e) => onSetOverride(entry.question_id, e.target.value)}
          />
        </div>
      )
  }
}