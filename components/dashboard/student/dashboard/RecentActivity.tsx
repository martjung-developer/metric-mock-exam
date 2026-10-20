// components/dashboard/student/dashboard/RecentActivity.tsx
'use client'

import Link      from 'next/link'
import { motion } from 'framer-motion'
import { ClipboardList, CheckCircle2, AlertCircle, Clock } from 'lucide-react'
import { card }  from '@/animations/dashboard/dashboardAnimations'
import styles    from '@/app/(dashboard)/student/dashboard/dashboard.module.css'
import type { RecentActivityItem } from '@/lib/types/student/dashboard/dashboard.types'
import { formatRelative }         from '@/lib/utils/student/dashboard/dashboard.calculations'

interface RecentActivityProps {
  items:   RecentActivityItem[]
  loading: boolean
}

function SkeletonRow() {
  return (
    <div className={styles.dashboardRow}>
      <div className={styles.activitySkeletonDot} />
      <div className={styles.activitySkeletonBody}>
        <div className={styles.activitySkeletonTitle} />
        <div className={styles.activitySkeletonMeta} />
      </div>
      <div className={styles.activitySkeletonScore} />
    </div>
  )
}

function ActivityIcon({ item }: { item: RecentActivityItem }) {
  if (item.status === 'submitted') {
    return <Clock size={15} color="#d97706" />
  }
  // graded / reviewed / released — score is known
  if (item.passed === true)  {return <CheckCircle2 size={15} color="#059669" />}
  if (item.passed === false) {return <AlertCircle  size={15} color="#dc2626" />}
  // graded but passed is null (shouldn't happen but safe fallback)
  return <Clock size={15} color="#7c3aed" />
}

function ScoreChip({ item }: { item: RecentActivityItem }) {
  if (item.status === 'submitted') {
    return (
      <span style={{ fontSize: '0.72rem', color: '#d97706', fontWeight: 600 }}>
        Pending
      </span>
    )
  }
  if (item.percentage !== null) {
    return (
      <span style={{
        fontSize:   '0.75rem',
        fontWeight: 700,
        color:      item.percentage >= 75 ? '#059669' : '#dc2626',
      }}>
        {item.percentage}%
      </span>
    )
  }
  // Score not available (e.g. essay grading pending)
  return (
    <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>—</span>
  )
}

export function RecentActivity({ items, loading }: RecentActivityProps) {
  return (
    <motion.div className={styles.card} {...card}>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>Recent Activity</h2>
        <Link href="/student/results" className={styles.cardLink}>View all →</Link>
      </div>

      {loading ? (
        <div className={styles.dashboardList}>
          {Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)}
        </div>
      ) : items.length === 0 ? (
        <div className={styles.emptyState}>
          <ClipboardList size={36} strokeWidth={1.5} color="#cbd5e1" />
          <p className={styles.emptyTitle}>No activity yet</p>
          <p className={styles.emptyText}>
            Take your first exam or reviewer to get started.
          </p>
          <Link href="/student/mock-exams" className={styles.emptyBtn}>
            Browse Exams →
          </Link>
        </div>
      ) : (
        <div className={styles.dashboardList}>
          {items.map((item) => (
            <div
              key={item.id}
              className={styles.dashboardRow}
            >
              <ActivityIcon item={item} />

              <div style={{ flex: 1, minWidth: 0 }}>
                <p className={styles.dashboardRowTitle}>
                  {item.examTitle}
                </p>
                <p className={styles.dashboardRowMeta}>
                  {item.examType === 'mock' ? 'Mock Exam' : 'Reviewer'}{' '}
                  · {formatRelative(item.submittedAt)}
                </p>
              </div>

              <ScoreChip item={item} />
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}
