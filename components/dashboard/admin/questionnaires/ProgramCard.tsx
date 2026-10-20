// components/dashboard/admin/questionnaires/ProgramCard.tsx
import { motion } from 'framer-motion'
import { GraduationCap, ChevronRight as ChevRight } from 'lucide-react'
import type { DisplayQuestion, ProgramOption } from '@/lib/types/admin/questionnaires/questionnaires'
import type { ProgramColorScheme } from '@/lib/constants/admin/questionnaires/questionnaires.constants'
import { TYPE_ORDER, TYPE_COLORS } from '@/lib/constants/admin/questionnaires/questionnaires.constants'
import styles from '@/app/(dashboard)/admin/questionnaires/questionnaires.module.css'

interface Props {
  program:     ProgramOption
  questions:   DisplayQuestion[]
  colorScheme: ProgramColorScheme
  onClick:     () => void
}

export function ProgramCard({ program, questions, colorScheme, onClick }: Props) {
  const total  = questions.length
  const byType = TYPE_ORDER.reduce<Record<string, number>>((acc, t) => {
    acc[t] = questions.filter((q) => q.question_type === t).length
    return acc
  }, {})
  const topTypes    = TYPE_ORDER.filter((t) => byType[t] > 0).slice(0, 3)
  const extraCount  = TYPE_ORDER.filter((t) => byType[t] > 0).length - 3

  return (
    <motion.button
      className={styles.programCard}
      style={{ background: colorScheme.bg, borderColor: colorScheme.border }}
      onClick={onClick}
      whileHover={{ y: -3, boxShadow: '0 8px 28px rgba(13,21,35,0.12)' }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.18 }}
    >
      <div className={styles.programCardTop}>
        <div className={styles.programIconWrap} style={{ background: colorScheme.accent }}>
          <GraduationCap size={16} color="#fff" />
        </div>
        <ChevRight size={14} color={colorScheme.accent} className={styles.programCardArrow} />
      </div>

      <div className={styles.programCardCode} style={{ color: colorScheme.accent }}>{program.code}</div>
      <div className={styles.programCardName}>{program.name}</div>

      <div className={styles.programCardCount}>
        <span className={styles.programCardCountNum} style={{ color: colorScheme.accent }}>{total}</span>
        <span className={styles.programCardCountLabel}>question{total !== 1 ? 's' : ''}</span>
      </div>

      {topTypes.length > 0 ? (
        <div className={styles.programCardTypes}>
          {topTypes.map((t) => (
            <span
              key={t}
              className={styles.programCardTypePill}
              style={{ background: TYPE_COLORS[t].bg, color: TYPE_COLORS[t].color }}
            >
              {byType[t]}{' '}
              {t === 'multiple_choice' ? 'MCQ' :
               t === 'true_false'     ? 'T/F' :
               t === 'fill_blank'     ? 'Fill' :
               t === 'short_answer'   ? 'Short' :
               t.charAt(0).toUpperCase() + t.slice(1)}
            </span>
          ))}
          {extraCount > 0 && (
            <span className={styles.programCardTypePill} style={{ background: '#f1f5f9', color: '#64748b' }}>
              +{extraCount} more
            </span>
          )}
        </div>
      ) : (
        <div className={styles.programCardEmpty}>No questions yet</div>
      )}
    </motion.button>
  )
}