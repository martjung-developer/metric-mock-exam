// components/dashboard/admin/analytics/EngagementCard.tsx
// Pure UI — renders the Engagement metrics card. No data fetching.

import React from 'react'
import { motion } from 'framer-motion'
import { Clock, Activity, Award, Users } from 'lucide-react'
import type { EngagementStats } from '@/lib/types/admin/analytics/analytics.types'
import { cardVariants } from '@/animations/admin/analytics/analytics'
import styles from '@/app/(dashboard)/admin/analytics/analytics.module.css'

// ── Metric Definition ────────────────────────────────────────────────────────

interface MetricDef {
  icon:  React.ReactNode
  bg:    string
  label: string
  sub:   string
  value: string
  unit:  string
}

function buildMetrics(engagement: EngagementStats | null): MetricDef[] {
  const timeValue = (() => {
    if (!engagement) {
      return '—'
    }
    return engagement.totalTimeMinutes >= 60
      ? `${(engagement.totalTimeMinutes / 60).toFixed(1)}h`
      : `${engagement.totalTimeMinutes}m`
  })()

  return [
    {
      icon:  <Activity size={15} color="#fff" />,
      bg:    '#0891b2',
      label: 'Total Attempts',
      sub:   'All submitted exams',
      value: engagement?.totalAttempts.toLocaleString() ?? '—',
      unit:  'attempts',
    },
    {
      icon:  <Award size={15} color="#fff" />,
      bg:    '#059669',
      label: 'Released Attempts',
      sub:   'Scores visible to students',
      value: engagement?.releasedAttempts.toLocaleString() ?? '—',
      unit:  'released',
    },
    {
      icon:  <Clock size={15} color="#fff" />,
      bg:    '#7c3aed',
      label: 'Total Time Spent',
      sub:   'Cumulative across all students',
      value: timeValue,
      unit:  'total time',
    },
    {
      icon:  <Users size={15} color="#fff" />,
      bg:    '#d97706',
      label: 'Avg Attempts / Student',
      sub:   'Engagement depth',
      value: engagement?.avgAttemptsPerStudent.toString() ?? '—',
      unit:  'per student',
    },
  ]
}

// ── Main Component ───────────────────────────────────────────────────────────

interface EngagementCardProps {
  engagement: EngagementStats | null
}

export default function EngagementCard({ engagement }: EngagementCardProps) {
  const metrics = buildMetrics(engagement)

  return (
    <motion.div className={styles.engagementCard} variants={cardVariants}>
      <div className={styles.engagementHeader}>
        <h2 className={styles.engagementTitle}>
          <Clock
            size={14}
            style={{ marginRight: 5, verticalAlign: 'middle', color: '#0891b2' }}
          />
          Engagement
        </h2>
        <p className={styles.engagementSub}>Attempt &amp; time metrics (all submissions)</p>
      </div>

      <div className={styles.engagementBody}>
        {metrics.map((m, i) => (
          <div key={i} className={styles.engagementMetric}>
            <div className={styles.engagementMetricLeft}>
              <div
                className={styles.engagementMetricIcon}
                style={{ background: m.bg }}
              >
                {m.icon}
              </div>
              <div>
                <div className={styles.engagementMetricLabel}>{m.label}</div>
                <div className={styles.engagementMetricSub}>{m.sub}</div>
              </div>
            </div>
            <div>
              <div className={styles.engagementMetricValue}>{m.value}</div>
              <div className={styles.engagementMetricUnit}>{m.unit}</div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}