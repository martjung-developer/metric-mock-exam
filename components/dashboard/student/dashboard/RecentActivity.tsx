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
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.65rem',
      padding: '0.55rem 0.75rem', background: '#f8fafc',
      borderRadius: 9, border: '1.5px solid #edf0f5',
    }}>
      <div style={{ width: 15, height: 15, borderRadius: '50%', background: '#e4ecf3' }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ width: '55%', height: 12, borderRadius: 4, background: '#e4ecf3' }} />
        <div style={{ width: '35%', height: 10, borderRadius: 4, background: '#edf0f5' }} />
      </div>
      <div style={{ width: 36, height: 14, borderRadius: 4, background: '#e4ecf3' }} />
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {items.map((item) => (
            <div
              key={item.id}
              style={{
                display:      'flex',
                alignItems:   'center',
                gap:          '0.65rem',
                padding:      '0.55rem 0.75rem',
                background:   '#f8fafc',
                borderRadius: 9,
                border:       '1.5px solid #edf0f5',
              }}
            >
              <ActivityIcon item={item} />

              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontSize:     '0.8rem',
                  fontWeight:   600,
                  color:        '#0d2540',
                  margin:       0,
                  overflow:     'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace:   'nowrap',
                }}>
                  {item.examTitle}
                </p>
                <p style={{ fontSize: '0.72rem', color: '#7a8fa8', margin: 0 }}>
                  {item.examType === 'mock' ? 'Mock Exam' : 'Practice'}{' '}
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