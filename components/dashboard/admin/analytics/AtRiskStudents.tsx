// components/dashboard/admin/analytics/AtRiskStudents.tsx
// Pure UI — renders the At-Risk Students table card. No data fetching.

import { motion } from 'framer-motion'
import { AlertTriangle, Users } from 'lucide-react'
import type { AtRiskStudent } from '@/lib/types/admin/analytics/analytics.types'
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

interface AtRiskStudentsProps {
  atRisk: AtRiskStudent[]
}

export default function AtRiskStudents({ atRisk }: AtRiskStudentsProps) {
  return (
    <motion.div className={styles.tableCard} variants={cardVariants}>
      <div className={styles.tableCardHeader}>
        <div>
          <h2 className={styles.tableCardTitle}>
            <AlertTriangle
              size={14}
              style={{ marginRight: 5, verticalAlign: 'middle', color: '#dc2626' }}
            />
            At-Risk Students
          </h2>
          <p className={styles.tableCardSub}>Low score or high attempts, low result</p>
        </div>
      </div>

      <div className={styles.tableBody}>
        {atRisk.length === 0 ? (
          <EmptyTable label="No at-risk students" />
        ) : (
          atRisk.map((s, i) => (
            <motion.div
              key={s.student_id}
              className={styles.tableRow}
              custom={i}
              variants={tableRowVariants}
              initial="hidden"
              animate="visible"
            >
              <div className={styles.studentAvatar}>{initials(s.full_name)}</div>
              <div className={styles.studentInfo}>
                <div className={styles.studentName}>{s.full_name}</div>
                <div className={styles.studentMeta}>
                  {s.total_attempts} attempt{s.total_attempts !== 1 ? 's' : ''}
                </div>
              </div>
              <div
                style={{
                  display:       'flex',
                  flexDirection: 'column',
                  alignItems:    'flex-end',
                  gap:           4,
                }}
              >
                <span className={`${styles.scoreChip} ${scoreClass(s.average_score)}`}>
                  {s.average_score.toFixed(1)}%
                </span>
                <span className={styles.riskBadge}>
                  <span className={styles.riskDot} /> At-Risk
                </span>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  )
}