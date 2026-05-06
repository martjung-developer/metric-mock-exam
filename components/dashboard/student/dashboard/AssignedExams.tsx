// components/dashboard/student/dashboard/AssignedExams.tsx
'use client'

import Link      from 'next/link'
import { motion } from 'framer-motion'
import { Clock, PlayCircle } from 'lucide-react'
import { card }  from '@/animations/dashboard/dashboardAnimations'
import styles    from '@/app/(dashboard)/student/dashboard/dashboard.module.css'
import type { AssignedExamItem } from '@/lib/types/student/dashboard/dashboard.types'
import { formatRelative } from '@/lib/utils/student/dashboard/dashboard.calculations'

interface AssignedExamsProps {
  assignedExams: AssignedExamItem[]
  loading:       boolean
}

function SkeletonRow() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.65rem',
      padding: '0.55rem 0.75rem', background: '#f8fafc',
      borderRadius: 9, border: '1.5px solid #edf0f5',
    }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: '#e4ecf3' }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ width: '60%', height: 12, borderRadius: 4, background: '#e4ecf3' }} />
        <div style={{ width: '40%', height: 10, borderRadius: 4, background: '#edf0f5' }} />
      </div>
    </div>
  )
}

export function AssignedExams({ assignedExams, loading }: AssignedExamsProps) {
  return (
    <motion.div className={styles.card} {...card}>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>Assigned to You</h2>
        {assignedExams.length > 0 && (
          <Link href="/student/mock-exams" className={styles.cardLink}>View all →</Link>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <SkeletonRow />
          <SkeletonRow />
        </div>
      ) : assignedExams.length === 0 ? (
        <div className={styles.assignedEmpty}>
          <Clock size={32} strokeWidth={1.5} color="#cbd5e1" />
          <p className={styles.assignedEmptyText}>No assignments yet</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {assignedExams.slice(0, 3).map((item) => (
            <Link
              key={item.id}
              href={`/student/mock-exams/${item.examId}`}
              style={{
                display:       'flex',
                alignItems:    'center',
                gap:           '0.65rem',
                padding:       '0.55rem 0.75rem',
                background:    '#f8fafc',
                borderRadius:  9,
                border:        '1.5px solid #edf0f5',
                textDecoration: 'none',
                transition:    'border-color 0.15s',
              }}
            >
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: '#dbeafe', display: 'flex',
                alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <PlayCircle size={16} color="#1d4ed8" />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontSize: '0.8rem', fontWeight: 600, color: '#0d2540', margin: 0,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {item.examTitle}
                </p>
                <p style={{ fontSize: '0.72rem', color: '#7a8fa8', margin: 0 }}>
                  Assigned {formatRelative(item.assignedAt)}
                  {item.deadline !== null && (
                    <> · Due {formatRelative(item.deadline)}</>
                  )}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </motion.div>
  )
}