// components/dashboard/admin/exams/answer-key/AnswerKeyGroup.tsx
// ─────────────────────────────────────────────────────────────────────────────
// FIXED: corrected template literal syntax errors introduced by doc formatting:
//   - `${s.group}` → s.group (direct property access, same result)
//   - `entries.map` link artefact → entries.map
// Structure, props, and logic are identical to the intended version.
// ─────────────────────────────────────────────────────────────────────────────

import {
  CheckSquare, ToggleLeft, AlignLeft, FileText, List, Hash,
  ChevronDown, ChevronRight, Zap, Pencil,
} from 'lucide-react'
import type { QuestionType }   from '@/lib/types/database'
import type { AnswerKeyEntry } from '@/lib/types/admin/exams/answer-key/answerKey.types'
import {
  effectiveAnswer,
  AUTO_TYPES,
  TYPE_META,
} from '@/lib/types/admin/exams/answer-key/answerKey.types'
import { QuestionRow } from './QuestionRow'
import s from '@/app/(dashboard)/admin/exams/[examId]/answer-key/answer-key.module.css'
import type { ElementType } from 'react'

const TYPE_ICONS: Record<QuestionType, ElementType> = {
  multiple_choice: CheckSquare,
  true_false:      ToggleLeft,
  short_answer:    AlignLeft,
  essay:           FileText,
  matching:        List,
  fill_blank:      Hash,
}

interface AnswerKeyGroupProps {
  type:          QuestionType
  entries:       AnswerKeyEntry[]
  isExpanded:    boolean
  previewMode:   boolean
  onToggle:      (type: QuestionType) => void
  onSetOverride: (questionId: string, value: string | null) => void
  onOpenRubric:  (entry: AnswerKeyEntry) => void
}

export function AnswerKeyGroup({
  type,
  entries,
  isExpanded,
  previewMode,
  onToggle,
  onSetOverride,
  onOpenRubric,
}: AnswerKeyGroupProps) {
  const meta   = TYPE_META[type]
  const Icon   = TYPE_ICONS[type]
  const isAuto = AUTO_TYPES.includes(type)
  const defined = entries.filter((e) => !!effectiveAnswer(e)).length

  return (
    <div className={`${s.group} ${s[`group_${meta.color}`]}`}>
      <button className={s.groupHeader} onClick={() => onToggle(type)}>
        <div className={s.groupHeaderLeft}>
          <div className={`${s.groupIcon} ${s[`groupIcon_${meta.color}`]}`}>
            <Icon size={15} />
          </div>
          <div>
            <span className={s.groupTitle}>{meta.label}</span>
            <span className={s.groupCount}>
              {entries.length} question{entries.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        <div className={s.groupHeaderRight}>
          <div className={`${s.groupMode} ${isAuto ? s.groupModeAuto : s.groupModeManual}`}>
            {isAuto
              ? <><Zap size={10} /> Auto</>
              : <><Pencil size={10} /> Manual</>}
          </div>
          <div className={s.groupProgress}>
            <span
              className={
                defined === entries.length
                  ? s.groupProgressComplete
                  : s.groupProgressPartial
              }
            >
              {defined}/{entries.length}
            </span>
          </div>
          {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
        </div>
      </button>

      {isExpanded && (
        <div className={s.groupBody}>
          {entries.map((entry, idx) => (
            <QuestionRow
              key={entry.question_id}
              entry={entry}
              index={idx}
              previewMode={previewMode}
              onSetOverride={onSetOverride}
              onOpenRubric={onOpenRubric}
            />
          ))}
        </div>
      )}
    </div>
  )
}