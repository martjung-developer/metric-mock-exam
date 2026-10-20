// components/dashboard/student/progress/RecentExamsTable.tsx
'use client'

import { memo } from 'react'
import type {
  RecentExamItem,
  ProgressSubmissionStatus,
} from '@/lib/types/student/progress/progress.types'
import styles from '@/app/(dashboard)/student/progress/progress.module.css'

// ── Status badge ──────────────────────────────────────────────────────────────

interface BadgeProps {
  status: ProgressSubmissionStatus
  passed: boolean | null
}

function StatusBadge({ status, passed }: BadgeProps) {
  if (status === 'in_progress') {
    return (
      <span className={styles.badge}
        style={{ background: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd' }}>
        In Progress
      </span>
    )
  }
  if (status === 'submitted') {
    return (
      <span className={styles.badge}
        style={{ background: '#fffbeb', color: '#92400e', border: '1px solid #fde68a' }}>
        Submitted
      </span>
    )
  }
  if (status === 'graded') {
    return (
      <span className={styles.badge}
        style={{ background: '#f5f3ff', color: '#5b21b6', border: '1px solid #ddd6fe' }}>
        Under Review
      </span>
    )
  }
  // released
  if (passed === true)  {return <span className={`${styles.badge} ${styles.badgePassed}`}>Passed</span>}
  if (passed === false) {return <span className={`${styles.badge} ${styles.badgeFailed}`}>Failed</span>}
  return (
    <span className={styles.badge}
      style={{ background: '#f0f5fa', color: '#64748b', border: '1px solid #e2e8f0' }}>
      Released
    </span>
  )
}

// ── Table ─────────────────────────────────────────────────────────────────────

interface Props {
  items: RecentExamItem[]
}

export const RecentExamsTable = memo(function RecentExamsTable({ items }: Props) {
  if (items.length === 0) {
    return <p style={{ fontSize: '0.8rem', color: '#9ca3af' }}>No recent exams.</p>
  }

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Exam</th>
            <th>Score</th>
            <th>Status</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>
                <p className={styles.examTitle}>{item.title}</p>
                {item.category && (
                  <p className={styles.examCategory}>{item.category}</p>
                )}
              </td>
              <td>
                {item.score !== null ? (
                  <span
                    className={styles.scoreVal}
                    style={{ color: item.score >= 75 ? '#10b981' : '#ef4444' }}
                  >
                    {item.score}
                    <span className={styles.scoreTotal}>/100</span>
                  </span>
                ) : (
                  <span className={styles.scoreTotal}>—</span>
                )}
              </td>
              <td>
                <StatusBadge status={item.status} passed={item.passed} />
              </td>
              <td>
                <span className={styles.examDate}>
                  {item.submittedAt
                    ? new Date(item.submittedAt).toLocaleDateString('en-PH', {
                        month: 'short',
                        day:   'numeric',
                      })
                    : '—'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
})