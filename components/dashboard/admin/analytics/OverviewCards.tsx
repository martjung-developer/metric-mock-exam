// components/dashboard/admin/analytics/OverviewCards.tsx
// Pure UI — renders the 4 top stat cards. No data fetching.

import React from 'react'
import { motion } from 'framer-motion'
import { Users, BookOpen, Activity, TrendingUp } from 'lucide-react'
import type { OverviewStats } from '@/lib/types/admin/analytics/analytics.types'
import { cardVariants, sectionVariants } from '@/animations/admin/analytics/analytics'
import styles from '@/app/(dashboard)/admin/analytics/analytics.module.css'

interface OverviewCardsProps {
  overview: OverviewStats | null
}

interface StatCardDef {
  icon:  React.ReactNode
  bg:    string
  value: string
  label: string
}

export default function OverviewCards({ overview }: OverviewCardsProps) {
  const cards: StatCardDef[] = [
    {
      icon:  <Users    size={18} color="#fff" strokeWidth={2.2} />,
      bg:    '#0d2540',
      value: overview?.totalStudents.toLocaleString() ?? '—',
      label: 'Total Students',
    },
    {
      icon:  <BookOpen size={18} color="#fff" strokeWidth={2.2} />,
      bg:    '#4f5ff7',
      value: overview?.totalExams.toLocaleString() ?? '—',
      label: 'Total Exams',
    },
    {
      icon:  <Activity size={18} color="#fff" strokeWidth={2.2} />,
      bg:    '#0891b2',
      value: overview
        ? `${overview.releasedAttempts.toLocaleString()} / ${overview.totalAttempts.toLocaleString()}`
        : '—',
      label: 'Released / Total Attempts',
    },
    {
      icon:  <TrendingUp size={18} color="#fff" strokeWidth={2.2} />,
      bg:    '#059669',
      value: overview ? `${overview.averageScore.toFixed(1)}%` : '—',
      label: 'Avg Score (Released)',
    },
  ]

  return (
    <motion.div
      className={styles.overviewGrid}
      variants={sectionVariants}
      initial="hidden"
      animate="visible"
    >
      {cards.map((stat, i) => (
        <motion.div key={i} className={styles.statCard} variants={cardVariants}>
          <div className={styles.statIconWrap} style={{ background: stat.bg }}>
            {stat.icon}
          </div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{stat.value}</div>
            <div className={styles.statLabel}>{stat.label}</div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  )
}