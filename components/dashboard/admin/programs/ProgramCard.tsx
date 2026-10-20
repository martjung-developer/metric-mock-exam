/**
 * components/admin/programs/ProgramCard.tsx
 *
 * Individual program card.
 * Pure UI — all state callbacks come from the parent (ProgramGrid → page).
 */

import { motion }         from 'framer-motion'
import { GraduationCap, Eye, UserPlus, ClipboardList } from 'lucide-react'

import { ProgramDescriptionEditor } from './ProgramDescriptionEditor'
import type { ProgramDisplay, DescriptionEditState, EditingId } from '@/lib/types/admin/programs/programs.types'

import styles from '@/app/(dashboard)/admin/programs/programs.module.css'
import {
  cardVariants,
  buttonVariants,
} from '@/animations/admin/programs/programs'

// Per-card accent palette — mirrors the original constants
const ACCENT_COLORS = [
  '#3b82f6','#10b981','#8b5cf6','#f59e0b',
  '#0891b2','#ec4899','#6366f1','#059669','#f97316',
]
const ICON_BG = [
  'rgba(59,130,246,0.12)','rgba(16,185,129,0.12)','rgba(139,92,246,0.12)',
  'rgba(245,158,11,0.12)','rgba(8,145,178,0.12)','rgba(236,72,153,0.12)',
  'rgba(99,102,241,0.12)','rgba(5,150,105,0.12)','rgba(249,115,22,0.12)',
]

interface ProgramCardProps {
  program:   ProgramDisplay
  /** Global index used only for accent colour cycling. */
  colorIndex: number
  editState:  DescriptionEditState
  onView:     (prog: ProgramDisplay) => void
  onStartEdit:(id: EditingId, currentDesc: string | null) => void
  onChangeDesc:(value: string) => void
  onSave:     (programId: string) => void
  onCancel:   () => void
}

export function ProgramCard({
  program,
  colorIndex,
  editState,
  onView,
  onStartEdit,
  onChangeDesc,
  onSave,
  onCancel,
}: ProgramCardProps) {
  const accentColor = ACCENT_COLORS[colorIndex % ACCENT_COLORS.length]
  const iconBg      = ICON_BG[colorIndex % ICON_BG.length]
  const isActive    = program.studentCount > 0
  const isEditing   = editState.editingId === program.id

  return (
    <motion.div
      className={styles.card}
      variants={cardVariants}
      whileHover="hover"
      layout
    >
      {/* Top accent bar */}
      <div className={styles.cardAccent} style={{ background: accentColor }} />

      {/* Header */}
      <div className={styles.cardHeader}>
        <div className={styles.cardIconWrap} style={{ background: iconBg }}>
          <GraduationCap size={20} color={accentColor} strokeWidth={1.75} />
        </div>
        <div className={styles.cardBadges}>
          <span
            className={`${styles.statusBadge} ${
              isActive ? styles.statusActive : styles.statusInactive
            }`}
          >
            {isActive && <span className={styles.activeDot} />}
            {isActive ? 'Active' : 'No students'}
          </span>
          <span className={styles.degreeBadge}>{program.degree_type}</span>
        </div>
      </div>

      {/* Body */}
      <div className={styles.cardBody}>
        <p className={styles.programCode}>{program.code}</p>
        <h3 className={styles.programName}>{program.name}</h3>
        <p className={styles.programFullName}>
          {program.major
            ? `${program.full_name} — Major in ${program.major}`
            : program.full_name}
        </p>

        {/* Inline description editor */}
        <ProgramDescriptionEditor
          description={program.description}
          isEditing={isEditing}
          editDesc={editState.editDesc}
          savingDesc={editState.savingDesc}
          saveDescError={editState.saveDescError}
          saveDescOk={editState.saveDescOk}
          onStartEdit={() => onStartEdit(program.id, program.description)}
          onChangeDesc={onChangeDesc}
          onSave={() => onSave(program.id)}
          onCancel={onCancel}
          variant="card"
        />

        {/* Stat row */}
        <div className={styles.cardStats}>
          <div className={styles.cardStat}>
            <span className={styles.cardStatValue}>{program.studentCount}</span>
            <span className={styles.cardStatLabel}>Students</span>
          </div>
          <div className={styles.cardStatDivider} />
          <div className={styles.cardStat}>
            <span className={styles.cardStatValue}>{program.examCount}</span>
            <span className={styles.cardStatLabel}>Exams</span>
          </div>
          <div className={styles.cardStatDivider} />
          <div className={styles.cardStat}>
            <span className={styles.cardStatValue}>{program.years ?? 4}</span>
            <span className={styles.cardStatLabel}>Years</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        <motion.button
          className={`${styles.btnAction} ${styles.btnActionPrimary}`}
          variants={buttonVariants}
          initial="idle"
          whileTap="tap"
          onClick={() => onView(program)}
        >
          <Eye size={13} /> View
        </motion.button>
        <motion.button
          className={styles.btnAction}
          variants={buttonVariants}
          initial="idle"
          whileTap="tap"
          onClick={() => onView(program)}
        >
          <UserPlus size={13} /> Students
        </motion.button>
        <motion.button
          className={styles.btnAction}
          variants={buttonVariants}
          initial="idle"
          whileTap="tap"
          onClick={() => onView(program)}
        >
          <ClipboardList size={13} /> Exams
        </motion.button>
      </div>
    </motion.div>
  )
}