// components/dashboard/admin/exams/questions/StatsStrip.tsx
// Pure UI — shows per-type question counts.

import type { Question, QuestionType } from '@/lib/types/admin/exams/questions/questions.types'
import { GROUP_ORDER, TYPE_META } from '@/lib/utils/admin/questions/helpers'
import s from '@/app/(dashboard)/admin/exams/[examId]/questions/questions.module.css'
import type { JSX } from 'react/jsx-dev-runtime'

interface StatsStripProps {
  questions: Question[]
}

export function StatsStrip({ questions }: StatsStripProps): JSX.Element | null {
  if (questions.length === 0) {return null}

  return (
    <div className={s.statsStrip}>
      {GROUP_ORDER.map((type: QuestionType) => {
        const count = questions.filter((q) => q.question_type === type).length
        if (count === 0) {return null}

        const meta = TYPE_META[type]
        const Icon = meta.icon

        return (
          <div key={type} className={`${s.statChip} ${s[`statChip_${meta.color}`]}`}>
            <Icon size={11} />
            <span>{meta.label}</span>
            <strong>{count}</strong>
          </div>
        )
      })}
    </div>
  )
}