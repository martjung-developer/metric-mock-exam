// components/dashboard/student/profile/ProfileRecentResults.tsx
'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ClipboardList, CheckCircle2, Calendar } from 'lucide-react'
import { fadeUp, tableRowVariants }  from '@/animations/profile/profile'
import { formatDate, getScoreColor } from '@/lib/utils/student/profile/profile'
import type { SubmissionRow }        from '@/lib/services/student/profile/profile.service'
import styles from '@/app/(dashboard)/student/profile/profile.module.css'

interface Props {
  submissions: SubmissionRow[]
}

export function ProfileRecentResults({ submissions }: Props) {
  return (
    <motion.div
      className={styles.tableCard}
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      transition={{ delay: 0.28 }}
    >
      <div className={styles.tableHead}>
        <span className={styles.tableHeadTitle}>
          <ClipboardList size={15} color="#1e3a5f" strokeWidth={2} /> Recent Results
        </span>
        <span className={styles.tableHeadHint}>last 5 released exams</span>
      </div>

      <AnimatePresence mode="wait">
        {submissions.length === 0 ? (
          <motion.div
            key="empty"
            className={styles.emptyState}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className={styles.emptyIconWrap}>
              <ClipboardList size={22} color="#94a3b8" strokeWidth={1.5} />
            </div>
            <p className={styles.emptyTitle}>No released results yet</p>
            <p className={styles.emptyText}>
              Complete a mock exam or reviewer and your results will appear here once your faculty releases them.
            </p>
          </motion.div>
        ) : (
          <motion.div key="table" className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Exam</th>
                  <th>Category</th>
                  <th>Score</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((s, i) => (
                  <motion.tr
                    key={i}
                    custom={i}
                    variants={tableRowVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <td style={{ maxWidth: 220 }}>
                      <span style={{
                        fontWeight: 600, color: '#111827', fontSize: '0.82rem',
                        display: 'block', overflow: 'hidden',
                        textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {s.exam_title}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 500 }}>
                        {s.category_name}
                      </span>
                    </td>
                    <td>
                      {s.percentage !== null ? (
                        <span className={styles.scoreVal} style={{ color: getScoreColor(s.percentage) }}>
                          {Math.round(s.percentage)}<span className={styles.scoreTotal}>%</span>
                        </span>
                      ) : (
                        <span className={styles.scoreTotal}>—</span>
                      )}
                    </td>
                    <td>
                      {s.passed === true ? (
                        <span className={`${styles.badge} ${styles.badgePassed}`}>
                          <CheckCircle2 size={10} /> Passed
                        </span>
                      ) : s.passed === false ? (
                        <span className={`${styles.badge} ${styles.badgeFailed}`}>Failed</span>
                      ) : (
                        <span
                          className={styles.badge}
                          style={{ background: '#f0f5fa', color: '#64748b', border: '1px solid #e2e8f0' }}
                        >
                          Released
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={styles.dateVal}>
                        <Calendar size={10} style={{ marginRight: 3, verticalAlign: 'middle' }} />
                        {formatDate(s.submitted_at)}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
