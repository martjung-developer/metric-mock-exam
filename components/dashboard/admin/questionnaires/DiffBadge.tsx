// app/(dashboard)/admin/questionnaires/DiffBadge.tsx
import type { DifficultyLevel } from '@/lib/types/admin/questionnaires/questionnaires'
import { DIFFICULTY_LABELS } from '@/lib/constants/admin/questionnaires/questionnaires.constants'
import styles from '@/app/(dashboard)/admin/questionnaires/questionnaires.module.css'

export function DiffBadge({ diff }: { diff: DifficultyLevel }) {
  const cls =
    diff === 'easy'   ? styles.diffEasy   :
    diff === 'medium' ? styles.diffMedium : styles.diffHard
  return (
    <span className={`${styles.diffBadge} ${cls}`}>
      {DIFFICULTY_LABELS[diff]}
    </span>
  )
}