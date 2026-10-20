// components/dashboard/admin/students/detail/SubmissionsTable.tsx
import { FileText } from 'lucide-react'
import type { Submission } from '@/lib/types/admin/students/[examId]/submission.types'
import { formatDate }      from '@/lib/utils/admin/students/format'
import styles from '@/app/(dashboard)/admin/students/[id]/student-detail.module.css'

interface Props {
  submissions: Submission[]
}

// All statuses that carry a final score
const GRADED_STATUSES = new Set(['graded', 'reviewed', 'released'])

const STATUS_STYLES: Record<string, { background: string; color: string }> = {
  released:    { background: '#f0fdf4', color: '#15803d' },
  graded:      { background: '#f5f3ff', color: '#7c3aed' },
  reviewed:    { background: '#eff6ff', color: '#1d4ed8' },
  submitted:   { background: '#fffbeb', color: '#d97706' },
  in_progress: { background: '#f0f9ff', color: '#0369a1' },
}

export function SubmissionsTable({ submissions }: Props) {
  if (submissions.length === 0) {
    return (
      <div className={styles.emptyTab}>
        <FileText size={32} strokeWidth={1.3} color="#cbd5e1" />
        <p className={styles.emptyTabTitle}>No submissions yet</p>
        <p className={styles.emptyTabText}>This student hasn&apos;t submitted any exams.</p>
      </div>
    )
  }

  return (
    <>
      <div className={styles.tableCardHeader}>
        <h3 className={styles.tableCardTitle}>Exam Submissions</h3>
      </div>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Exam</th>
            <th>Type</th>
            <th>Score</th>
            <th>Result</th>
            <th>Status</th>
            <th>Submitted</th>
          </tr>
        </thead>
        <tbody>
          {submissions.map((s) => {
            const hasScore    = GRADED_STATUSES.has(s.status)
            const statusStyle = STATUS_STYLES[s.status] ?? STATUS_STYLES['in_progress']

            return (
              <tr key={s.id}>
                <td className={styles.cellBold}>{s.exam_title}</td>
                <td>
                  <span className={`${styles.typeBadge} ${s.exam_type === 'mock' ? styles.typeMock : styles.typePractice}`}>
                    {s.exam_type}
                  </span>
                </td>

                {/* Score */}
                <td>
                  {hasScore && s.percentage !== null ? (
                    <strong style={{ color: s.percentage >= 75 ? '#059669' : '#dc2626' }}>
                      {Math.round(s.percentage)}%
                    </strong>
                  ) : (
                    <span className={styles.cellMuted}>—</span>
                  )}
                </td>

                {/* Result */}
                <td>
                  {hasScore ? (
                    s.passed === true ? (
                      <span style={{ color: '#059669', fontWeight: 700, fontSize: '0.78rem' }}>✓ Passed</span>
                    ) : s.passed === false ? (
                      <span style={{ color: '#dc2626', fontWeight: 700, fontSize: '0.78rem' }}>✗ Failed</span>
                    ) : (
                      <span className={styles.cellMuted}>—</span>
                    )
                  ) : (
                    <span className={styles.cellMuted}>Pending</span>
                  )}
                </td>

                {/* Status */}
                <td>
                  <span className={styles.statusBadge} style={statusStyle}>
                    {s.status}
                  </span>
                </td>

                {/* Submitted date */}
                <td>{formatDate(s.submitted_at)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </>
  )
}