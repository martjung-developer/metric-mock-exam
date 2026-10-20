// components/dashboard/admin/exams/submissions/GradingPanel.tsx
import { Settings, Zap, Pencil, Users, Send, Loader2, RotateCcw } from 'lucide-react'
import type { GradingMode } from '@/lib/types/admin/exams/submissions/submission.types'
import type { AnswerKeyEntry } from '@/lib/types/admin/exams/submissions/answer.types'
import s from '@/app/(dashboard)/admin/exams/[examId]/submissions/submissions.module.css'

// ── GradingPanel ──────────────────────────────────────────────────────────────

interface GradingPanelProps {
  gradingMode:      GradingMode
  savingMode:       boolean
  bulkGrading:      boolean
  bulkProgress:     { done: number; total: number } | null
  releasing:        boolean
  gradeableCount:   number
  reviewedCount:    number
  answerKeyLoading: boolean
  showAnswerKey:    boolean
  answerKeyLoaded:  boolean
  onModeChange:     (mode: GradingMode) => void
  onBulkGrade:      () => void
  onRelease:        () => void
  onToggleAnswerKey: () => void
}

export function GradingPanel({
  gradingMode, savingMode, bulkGrading, bulkProgress, releasing,
  gradeableCount, reviewedCount, answerKeyLoading, showAnswerKey,
  onModeChange, onBulkGrade, onRelease, onToggleAnswerKey,
}: GradingPanelProps) {
  return (
    <div className={s.gradingPanel}>
      <div className={s.gradingPanelLeft}>
        <div className={s.modeBlock}>
          <span className={s.modeLabel}><Settings size={12} /> Mode</span>
          <div className={s.modeToggle}>
            <button
              className={`${s.modeBtn} ${gradingMode === 'auto' ? s.modeBtnActive : ''}`}
              onClick={() => onModeChange('auto')}
              disabled={savingMode}
            >
              <Zap size={12} /> Auto
            </button>
            <button
              className={`${s.modeBtn} ${gradingMode === 'manual' ? s.modeBtnActiveManual : ''}`}
              onClick={() => onModeChange('manual')}
              disabled={savingMode}
            >
              <Pencil size={12} /> Manual
            </button>
          </div>
          <span className={s.modeHint}>
            {gradingMode === 'auto' ? 'Uses stored correct answers' : 'Faculty overrides answer key'}
          </span>
        </div>

        {gradingMode === 'manual' && (
          <button
            className={s.answerKeyToggle}
            onClick={onToggleAnswerKey}
            disabled={answerKeyLoading}
          >
            {answerKeyLoading ? <Loader2 size={12} className={s.spinner} /> : <Pencil size={12} />}
            {showAnswerKey ? 'Hide' : 'Edit'} Answer Key
          </button>
        )}
      </div>

      <div className={s.gradingPanelRight}>
        <button
          className={s.btnGrade}
          onClick={onBulkGrade}
          disabled={bulkGrading || gradeableCount === 0}
          title={gradeableCount === 0 ? 'No gradeable submissions' : `Grade ${gradeableCount} submissions`}
        >
          {bulkGrading
            ? <><Loader2 size={13} className={s.spinner} /> {bulkProgress?.done}/{bulkProgress?.total}</>
            : <><Users size={13} /> Grade All ({gradeableCount})</>}
        </button>

        <button
          className={s.btnRelease}
          onClick={onRelease}
          disabled={releasing || reviewedCount === 0}
          title={reviewedCount === 0 ? 'No reviewed submissions to release' : `Release ${reviewedCount} results`}
        >
          {releasing
            ? <><Loader2 size={13} className={s.spinner} /> Releasing…</>
            : <><Send size={13} /> Release ({reviewedCount})</>}
        </button>
      </div>
    </div>
  )
}

// ── AnswerKeyPanel ────────────────────────────────────────────────────────────

interface AnswerKeyPanelProps {
  answerKey:    AnswerKeyEntry[]
  onReset:      () => void
  onUpdateEntry: (questionId: string, value: string | null) => void
}

export function AnswerKeyPanel({ answerKey, onReset, onUpdateEntry }: AnswerKeyPanelProps) {
  return (
    <div className={s.answerKeyPanel}>
      <div className={s.answerKeyHeader}>
        <span className={s.answerKeyTitle}><Pencil size={12} /> Manual Answer Key</span>
        <span className={s.answerKeyHint}>Overrides stored answers for grading. Leave blank to use original.</span>
        <button className={s.answerKeyResetBtn} onClick={onReset} title="Reset to stored answers">
          <RotateCcw size={12} /> Reset
        </button>
      </div>
      <div className={s.answerKeyGrid}>
        {answerKey.map((entry, i) => (
          <div key={entry.question_id} className={s.answerKeyRow}>
            <span className={s.answerKeyQNum}>Q{entry.order_number ?? i + 1}</span>
            <span className={s.answerKeyQText}>
              {entry.question_text.slice(0, 60)}{entry.question_text.length > 60 ? '…' : ''}
            </span>
            <input
              className={s.answerKeyInput}
              value={entry.correct_answer ?? ''}
              placeholder="e.g. A, true, answer…"
              onChange={e => onUpdateEntry(entry.question_id, e.target.value || null)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}