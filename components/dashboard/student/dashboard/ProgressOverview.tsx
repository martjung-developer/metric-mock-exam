// components/dashboard/student/dashboard/ProgressOverview.tsx
'use client'

import Link      from 'next/link'
import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import { card }  from '@/animations/dashboard/dashboardAnimations'
import styles    from '@/app/(dashboard)/student/dashboard/dashboard.module.css'
import type { DashboardProgress } from '@/lib/types/student/dashboard/dashboard.types'

interface ProgressOverviewProps {
  progress: DashboardProgress
  loading:  boolean
}

interface ProgressItemProps {
  label:   string
  pct:     number
  color:   string
  loading: boolean
}

function ProgressItem({ label, pct, color, loading }: ProgressItemProps) {
  return (
    <div className={styles.progressItem}>
      <div className={styles.progressMeta}>
        <span className={styles.progressLabel}>{label}</span>
        {loading ? (
          <div style={{
            width: 30, height: 14, borderRadius: 4,
            background: '#e4ecf3', animation: 'shimmer 1.4s infinite',
          }} />
        ) : (
          <span className={styles.progressPct}>{pct}%</span>
        )}
      </div>
      <div className={styles.progressTrack}>
        <motion.div
          className={styles.progressFill}
          style={{ backgroundColor: loading ? '#e4ecf3' : color }}
          initial={{ width: '0%' }}
          animate={{ width: loading ? '0%' : `${pct}%` }}
          transition={{ duration: 0.7, ease: [0.34, 1.1, 0.64, 1], delay: 0.3 }}
        />
      </div>
    </div>
  )
}

export function ProgressOverview({ progress, loading }: ProgressOverviewProps) {
  const items = [
    { label: 'Mock Exams Completed', pct: progress.mockPct,     color: '#3b82f6' },
    { label: 'Reviewers Finished',   pct: progress.practicePct, color: '#10b981' },
    { label: 'Study Materials Read', pct: progress.materialsPct, color: '#8b5cf6' },
  ]

  return (
    <motion.div className={styles.card} {...card}>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>Progress Overview</h2>
        <Link href="/student/progress" className={styles.cardLink}>Details</Link>
      </div>

      {items.map(({ label, pct, color }) => (
        <ProgressItem key={label} label={label} pct={pct} color={color} loading={loading} />
      ))}

      <Link
        href="/student/progress"
        className={styles.cardLink}
        style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: '0.75rem' }}
      >
        View detailed progress <ChevronRight size={13} />
      </Link>
    </motion.div>
  )
}