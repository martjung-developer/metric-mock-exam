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
    <div className={styles.dashboardRow}>
      <div className={styles.assignedSkeletonIcon} />
      <div className={styles.activitySkeletonBody}>
        <div className={styles.assignedSkeletonTitle} />
        <div className={styles.assignedSkeletonMeta} />
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
        <div className={styles.dashboardList}>
          <SkeletonRow />
          <SkeletonRow />
        </div>
      ) : assignedExams.length === 0 ? (
        <div className={styles.assignedEmpty}>
          <Clock size={32} strokeWidth={1.5} color="#cbd5e1" />
          <p className={styles.assignedEmptyText}>No assignments yet</p>
        </div>
      ) : (
        <div className={styles.dashboardList}>
          {assignedExams.slice(0, 3).map((item) => (
            <Link
              key={item.id}
              href={`/student/mock-exams/${item.examId}`}
              className={styles.assignedRow}
            >
              <div className={styles.assignedIconBox}>
                <PlayCircle size={16} color="#1d4ed8" />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <p className={styles.dashboardRowTitle}>
                  {item.examTitle}
                </p>
                <p className={styles.dashboardRowMeta}>
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
