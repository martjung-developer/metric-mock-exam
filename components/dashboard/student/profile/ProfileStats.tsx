// components/dashboard/student/profile/ProfileStats.tsx
'use client'

import { motion }  from 'framer-motion'
import { FileText, TrendingUp, Trophy, CheckCircle2 } from 'lucide-react'
import { staggerContainer, fadeUp, statCardVariants } from '@/animations/profile/profile'
import { getPassRateFillClass } from '@/lib/utils/student/profile/profile'
import type { SubmissionRow }   from '@/lib/services/student/profile/profile.service'
import styles from '@/app/(dashboard)/student/profile/profile.module.css'

interface Props {
  submissions:  SubmissionRow[]
  totalTaken:   number
  animate:      boolean
}

export function ProfileStats({ submissions, totalTaken, animate }: Props) {
  // ── Derived stats ───────────────────────────────────────────────────────────
  const scores       = submissions.map((s) => s.percentage).filter((v): v is number => v !== null)
  const averageScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null
  const highestScore = scores.length > 0 ? Math.round(Math.max(...scores)) : null
  const passedCount  = submissions.filter((s) => s.passed === true).length
  const passRate     = submissions.length > 0
    ? Math.round((passedCount / submissions.length) * 100)
    : null

  const STAT_MINI = [
    { Icon: FileText,     iconColor: '#2563eb', iconBg: '#eff6ff', label: 'Exams Taken',   value: String(totalTaken),                             empty: totalTaken === 0        },
    { Icon: TrendingUp,   iconColor: '#059669', iconBg: '#f0fdf4', label: 'Average Score', value: averageScore !== null ? `${averageScore}%` : '—', empty: averageScore === null },
    { Icon: Trophy,       iconColor: '#d97706', iconBg: '#fffbeb', label: 'Highest Score', value: highestScore !== null ? `${highestScore}%` : '—', empty: highestScore === null },
    { Icon: CheckCircle2, iconColor: '#dc2626', iconBg: '#fef2f2', label: 'Pass Rate',     value: passRate     !== null ? `${passRate}%`     : '—', empty: passRate     === null },
  ] as const

  return (
    <motion.div className={styles.card} variants={fadeUp}>
      <div className={styles.cardHead}>
        <span className={styles.cardTitle}>
          <span className={styles.cardTitleIcon}>
            <TrendingUp size={14} color="#1e3a5f" />
          </span>
          Exam Performance
        </span>
      </div>

      <motion.div
        className={styles.statsGrid}
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {STAT_MINI.map((s) => (
          <motion.div key={s.label} className={styles.statMini} variants={statCardVariants}>
            <div className={styles.statMiniIcon} style={{ background: s.iconBg }}>
              <s.Icon size={16} color={s.iconColor} strokeWidth={2} />
            </div>
            <div className={`${styles.statMiniValue} ${s.empty ? styles.statMiniValueEmpty : ''}`}>
              {s.value}
            </div>
            <div className={styles.statMiniLabel}>{s.label}</div>
          </motion.div>
        ))}
      </motion.div>

      {submissions.length > 0 && (
        <div className={styles.progressSection}>
          <div className={styles.progressLabel}>
            <span className={styles.progressLabelText}>Pass Rate</span>
            <span className={styles.progressLabelPct}>{passRate ?? 0}%</span>
          </div>
          <div className={styles.progressTrack}>
            <div
              className={`${styles.progressFill} ${getPassRateFillClass(passRate ?? 0)}`}
              style={{ width: animate ? `${passRate ?? 0}%` : '0%' }}
            />
          </div>
        </div>
      )}
    </motion.div>
  )
}