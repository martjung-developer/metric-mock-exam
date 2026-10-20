// components/dashboard/admin/exams/answer-key/CoverageBar.tsx
import { AlertCircle } from 'lucide-react'
import s from '@/app/(dashboard)/admin/exams/[examId]/answer-key/answer-key.module.css'

interface CoverageBarProps {
  totalDefined:    number
  totalQuestions:  number
  coveragePercent: number
}

export function CoverageBar({
  totalDefined,
  totalQuestions,
  coveragePercent,
}: CoverageBarProps) {
  const missing = totalQuestions - totalDefined

  return (
    <div className={s.coverageBar}>
      <div className={s.coverageBarLeft}>
        <span className={s.coverageLabel}>Answer Coverage</span>
        <span className={s.coverageValue}>{coveragePercent}%</span>
        <span className={s.coverageDetail}>
          {totalDefined} of {totalQuestions} questions
        </span>
      </div>

      <div className={s.coverageTrack}>
        <div
          className={`${s.coverageFill} ${coveragePercent === 100 ? s.coverageFillComplete : ''}`}
          style={{ width: `${coveragePercent}%` }}
        />
      </div>

      {coveragePercent < 100 && (
        <div className={s.coverageWarning}>
          <AlertCircle size={12} />
          {missing} answer{missing !== 1 ? 's' : ''} missing — auto-grading will skip these questions
        </div>
      )}
    </div>
  )
}