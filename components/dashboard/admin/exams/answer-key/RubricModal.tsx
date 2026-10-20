// components/dashboard/admin/exams/answer-key/RubricModal.tsx
'use client'

import { useState } from 'react'
import { Pencil, Save, X, Info } from 'lucide-react'
import type { AnswerKeyEntry } from '@/lib/types/admin/exams/answer-key/answerKey.types'
import s from '@/app/(dashboard)/admin/exams/[examId]/answer-key/answer-key.module.css'

interface RubricModalProps {
  entry:   AnswerKeyEntry
  onSave:  (questionId: string, rubric: string) => void
  onClose: () => void
}

export function RubricModal({ entry, onSave, onClose }: RubricModalProps) {
  const [text, setText] = useState(entry.explanation ?? '')

  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) {onClose()}
  }

  return (
    <div className={s.modalOverlay} onClick={handleOverlayClick}>
      <div className={s.rubricModal}>
        {/* Header */}
        <div className={s.rubricModalHeader}>
          <div>
            <h3 className={s.rubricModalTitle}>
              <Pencil size={15} /> Rubric / Scoring Guide
            </h3>
            <p className={s.rubricModalSub}>
              Q{entry.order_number ?? '?'} ·{' '}
              {entry.question_text.slice(0, 80)}
              {entry.question_text.length > 80 ? '…' : ''}
            </p>
          </div>
          <button className={s.modalClose} onClick={onClose}>
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className={s.rubricModalBody}>
          <div className={s.rubricInfo}>
            <Info size={12} />
            <span>
              Rubrics guide faculty when manually grading essay and short-answer
              questions. They are shown to graders but not to students.
            </span>
          </div>
          <label className={s.rubricLabel}>Rubric / Expected Response</label>
          <textarea
            className={s.rubricTextarea}
            rows={8}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`e.g.\n• 3 pts — Correctly defines the term AND gives an example\n• 2 pts — Correct definition, no example\n• 1 pt  — Partially correct\n• 0 pts — Incorrect or blank`}
          />
          <p className={s.rubricHint}>
            This text is also shown to students as an &ldquo;explanation&rdquo; after results
            are released. Remove grading-specific notes before releasing if needed.
          </p>
        </div>

        {/* Footer */}
        <div className={s.rubricModalFooter}>
          <button className={s.btnSecondary} onClick={onClose}>
            Cancel
          </button>
          <button
            className={s.btnPrimary}
            onClick={() => { onSave(entry.question_id, text); onClose() }}
          >
            <Save size={13} /> Save Rubric
          </button>
        </div>
      </div>
    </div>
  )
}