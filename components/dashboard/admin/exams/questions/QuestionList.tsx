// components/dashboard/admin/exams/questions/QuestionList.tsx
// Pure UI — renders all groups or an empty/loading state.

import { HelpCircle, Loader2, Plus } from 'lucide-react'
import { QuestionGroup } from './QuestionGroup'
import type {
  GroupedQuestions,
  Question,
  QuestionType,
} from '@/lib/types/admin/exams/questions/questions.types'
import { GROUP_ORDER } from '@/lib/types/admin/exams/questions/questions.types'
import s from '@/app/(dashboard)/admin/exams/[examId]/questions/questions.module.css'
import type { JSX } from 'react/jsx-dev-runtime'

interface QuestionListProps {
  questions:       Question[]
  grouped:         GroupedQuestions
  loading:         boolean
  expandedTypes:   Set<QuestionType>
  onToggleExpand:  (type: QuestionType) => void
  onAddInGroup:    (type: QuestionType) => void
  onAddFirst:      ()                   => void
  onEdit:          (q: Question)        => void
  onDelete:        (q: Question)        => void
}

export function QuestionList({
  questions,
  grouped,
  loading,
  expandedTypes,
  onToggleExpand,
  onAddInGroup,
  onAddFirst,
  onEdit,
  onDelete,
}: QuestionListProps): JSX.Element {
  if (loading) {
    return (
      <div className={s.loadingState}>
        <Loader2 size={22} className={s.spinner} />
        <p>Loading questions…</p>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className={s.emptyState}>
        <div className={s.emptyIcon}>
          <HelpCircle size={24} color="var(--text-muted)" />
        </div>
        <p className={s.emptyTitle}>No questions yet</p>
        <p className={s.emptySub}>Click &quot;Add Question&quot; to create your first question.</p>
        <button
          className={`${s.btnPrimary} ${s.addFirstBtn}`}
          onClick={onAddFirst}
        >
          <Plus size={14} /> Add First Question
        </button>
      </div>
    )
  }

  return (
    <div className={s.groups}>
      {GROUP_ORDER.map((type: QuestionType) => {
        const allOfType = questions.filter((q) => q.question_type === type)
        if (allOfType.length === 0) {return null}

        // Respect filtered subset from parent
        const visibleQuestions = grouped[type] ?? []

        return (
          <QuestionGroup
            key={type}
            type={type}
            allOfType={allOfType}
            visibleQuestions={visibleQuestions}
            isExpanded={expandedTypes.has(type)}
            onToggleExpand={onToggleExpand}
            onAddInGroup={onAddInGroup}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        )
      })}
    </div>
  )
}
