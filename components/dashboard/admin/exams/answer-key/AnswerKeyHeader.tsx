// components/dashboard/admin/exams/answer-key/AnswerKeyHeader.tsx
import Link from 'next/link'
import { Key, ArrowLeft, Save, RotateCcw, Loader2, Eye, EyeOff } from 'lucide-react'
import type { ExamMeta } from '@/lib/types/admin/exams/answer-key/answerKey.types'
import s from '@/app/(dashboard)/admin/exams/[examId]/answer-key/answer-key.module.css'

interface AnswerKeyHeaderProps {
  examId:         string
  examMeta:       ExamMeta | null
  totalDefined:   number
  totalQuestions: number
  dirty:          boolean
  saving:         boolean
  previewMode:    boolean
  onTogglePreview: () => void
  onSave:          () => Promise<void>
  onReset:         () => void
}

export function AnswerKeyHeader({
  examId,
  examMeta,
  totalDefined,
  totalQuestions,
  dirty,
  saving,
  previewMode,
  onTogglePreview,
  onSave,
  onReset,
}: AnswerKeyHeaderProps) {
  return (
    <div className={s.header}>
      <Link href={`/admin/exams/${examId}`} className={s.backBtn}>
        <ArrowLeft size={14} /> Back to Exam
      </Link>

      <div className={s.headerMain}>
        <div className={s.headerLeft}>
          <div className={s.headerIcon}>
            <Key size={20} color="#fff" />
          </div>
          <div>
            <h1 className={s.heading}>Answer Key</h1>
            <p className={s.headingSub}>
              {examMeta?.title ?? 'Loading…'} · {totalDefined}/{totalQuestions} answers defined
            </p>
          </div>
        </div>

        <div className={s.headerActions}>
          <button
            className={`${s.previewToggle} ${previewMode ? s.previewToggleActive : ''}`}
            onClick={onTogglePreview}
          >
            {previewMode ? <EyeOff size={13} /> : <Eye size={13} />}
            {previewMode ? 'Edit Mode' : 'Preview'}
          </button>

          {dirty && (
            <button className={s.btnSecondary} onClick={onReset} disabled={saving}>
              <RotateCcw size={13} /> Discard
            </button>
          )}

          <button
            className={s.btnPrimary}
            onClick={onSave}
            disabled={saving || !dirty}
          >
            {saving
              ? <><Loader2 size={13} className={s.spinner} /> Saving…</>
              : <><Save size={13} /> Save Answer Key</>}
          </button>
        </div>
      </div>
    </div>
  )
}