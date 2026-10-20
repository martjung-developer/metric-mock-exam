// components/dashboard/admin/analytics/TopStudents.tsx
// Pure UI — renders the Top Students table card. No data fetching.

import { motion } from 'framer-motion'
import { Award, Users } from 'lucide-react'
import type { TopStudent } from '@/lib/types/admin/analytics/analytics.types'
import { cardVariants, tableRowVariants } from '@/animations/admin/analytics/analytics'
import styles from '@/app/(dashboard)/admin/analytics/analytics.module.css'

// ── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
}

function scoreClass(score: number): string {
  if (score >= 75) {
    return styles.scoreHigh
  }
  if (score >= 50) {
    return styles.scoreMid
  }
  return styles.scoreLow
}

function rankClass(i: number): string {
  if (i === 0) {
    return styles.rankGold
  }
  if (i === 1) {
    return styles.rankSilver
  }
  if (i === 2) {
    return styles.rankBronze
  }
  return ''
}

// ── Empty State ──────────────────────────────────────────────────────────────

function EmptyTable({ label }: { label: string }) {
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyIcon}><Users size={18} color="#8a9ab5" /></div>
      <p className={styles.emptyTitle}>{label}</p>
    </div>
  )
}

// ── Main Component ───────────────────────────────────────────────────────────

interface TopStudentsProps {
  topStudents: TopStudent[]
}

export default function TopStudents({ topStudents }: TopStudentsProps) {
  return (
    <motion.div className={styles.tableCard} variants={cardVariants}>
      <div className={styles.tableCardHeader}>
        <div>
          <h2 className={styles.tableCardTitle}>
            <Award
              size={14}
              style={{ marginRight: 5, verticalAlign: 'middle', color: '#d97706' }}
            />
            Top Students
          </h2>
          <p className={styles.tableCardSub}>Sorted by average score (released exams)</p>
        </div>
      </div>

      <div className={styles.tableBody}>
        {topStudents.length === 0 ? (
          <EmptyTable label="No data available" />
        ) : (
          topStudents.map((s, i) => (
            <motion.div
              key={s.student_id}
              className={styles.tableRow}
              custom={i}
              variants={tableRowVariants}
              initial="hidden"
              animate="visible"
            >
              <div className={`${styles.rankBadge} ${rankClass(i)}`}>{i + 1}</div>
              <div className={styles.studentAvatar}>{initials(s.full_name)}</div>
              <div className={styles.studentInfo}>
                <div className={styles.studentName}>{s.full_name}</div>
                <div className={styles.studentMeta}>
                  {s.total_attempts} attempt{s.total_attempts !== 1 ? 's' : ''}
                </div>
              </div>
              <span className={`${styles.scoreChip} ${scoreClass(s.average_score)}`}>
                {s.average_score.toFixed(1)}%
              </span>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  )
}