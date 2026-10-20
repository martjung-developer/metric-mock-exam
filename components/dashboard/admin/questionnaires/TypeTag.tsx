// app/(dashboard)/admin/questionnaires/TypeTag.tsx
import type { QuestionType } from '@/lib/types/database'
import { TYPE_COLORS, TYPE_LABELS } from '@/lib/constants/admin/questionnaires/questionnaires.constants'
import styles from '@/app/(dashboard)/admin/questionnaires/questionnaires.module.css'

export function TypeTag({ type }: { type: QuestionType }) {
  const c = TYPE_COLORS[type]
  return (
    <span
      className={styles.typeTag}
      style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}` }}
    >
      {TYPE_LABELS[type]}
    </span>
  )
}