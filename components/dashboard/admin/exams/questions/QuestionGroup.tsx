// components/dashboard/admin/exams/questions/QuestionGroup.tsx
// Pure UI — collapsible group header + list of QuestionRows.

import { ChevronDown, ChevronRight, FilePenLine, Plus, Zap } from 'lucide-react'
import { QuestionRow } from './QuestionRow'
import type { Question, QuestionType } from '@/lib/types/admin/exams/questions/questions.types'
import { TYPE_META } from '@/lib/utils/admin/questions/helpers'
import s from '@/app/(dashboard)/admin/exams/[examId]/questions/questions.module.css'
import type { JSX } from 'react/jsx-dev-runtime'

interface QuestionGroupProps {
  type: QuestionType
  allOfType: Question[]
  visibleQuestions: Question[]
  isExpanded: boolean
  onToggleExpand: (type: QuestionType) => void
  onAddInGroup: (type: QuestionType) => void
  onEdit: (q: Question) => void
  onDelete: (q: Question) => void
  selected?: ReadonlySet<string>
  onToggleSelect?: (id: string) => void
}

export function QuestionGroup({
  type,
  allOfType,
  visibleQuestions,
  isExpanded,
  onToggleExpand,
  onAddInGroup,
  onEdit,
  onDelete,
  selected,
  onToggleSelect,
}: QuestionGroupProps): JSX.Element {
  const meta = TYPE_META[type]
  const Icon = meta.icon
  const count = allOfType.length
  const pts = allOfType.reduce((sum, q) => sum + q.points, 0)

  return (
    <div className={`${s.group} ${s[`group_${meta.color}`]}`}>
      <div className={s.groupHeader}>
        <button className={s.groupToggle} onClick={() => onToggleExpand(type)}>
          {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
          <div className={`${s.groupIcon} ${s[`groupIcon_${meta.color}`]}`}>
            <Icon size={15} />
          </div>
          <div className={s.groupTitleBlock}>
            <span className={s.groupTitle}>{meta.label}</span>
            <span className={s.groupMeta}>{meta.description}</span>
          </div>
        </button>

        <div className={s.groupHeaderRight}>
          <div className={`${s.groupModeBadge} ${meta.autoGrade ? s.groupModeBadgeAuto : s.groupModeBadgeManual}`}>
            {meta.autoGrade ? <Zap size={11} /> : <FilePenLine size={11} />}
            {meta.autoGrade ? 'Auto' : 'Manual'}
          </div>
          <div className={s.groupStats}>
            <span className={s.groupCount}>{count} question{count !== 1 ? 's' : ''}</span>
            <span className={s.groupPts}>{pts} pts</span>
          </div>
          <button
            className={s.addInGroupBtn}
            onClick={() => onAddInGroup(type)}
            title={`Add ${meta.label} question`}
          >
            <Plus size={13} />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className={s.groupBody}>
          {visibleQuestions.length === 0 ? (
            <div className={s.groupEmpty}>
              <p>No questions match your search in this category.</p>
            </div>
          ) : (
            visibleQuestions.map((q, idx) => (
              <QuestionRow
                key={q.id}
                question={q}
                displayIndex={idx}
                onEdit={onEdit}
                onDelete={onDelete}
                selected={selected?.has(q.id) ?? false}
                onToggleSelect={onToggleSelect ? () => onToggleSelect(q.id) : undefined}
              />
            ))
          )}

          <button
            className={s.addInGroupFooter}
            onClick={() => onAddInGroup(type)}
          >
            <Plus size={13} /> Add {meta.label} Question
          </button>
        </div>
      )}
    </div>
  )
}
