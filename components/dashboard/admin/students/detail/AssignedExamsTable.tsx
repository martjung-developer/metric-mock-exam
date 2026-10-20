// components/dashboard/admin/students/detail/AssignedExamsTable.tsx
import { BookOpen } from 'lucide-react'
import type { AssignedExam } from '@/lib/types/admin/students/[examId]/exam.types'
import { formatDate }        from '@/lib/utils/admin/students/format'
import styles from '@/app/(dashboard)/admin/students/[id]/student-detail.module.css'

interface Props {
  exams: AssignedExam[]
}

export function AssignedExamsTable({ exams }: Props) {
  if (exams.length === 0) {
    return (
      <div className={styles.emptyTab}>
        <BookOpen size={32} strokeWidth={1.3} color="#cbd5e1" />
        <p className={styles.emptyTabTitle}>No exams assigned</p>
        <p className={styles.emptyTabText}>This student has no exam assignments yet.</p>
      </div>
    )
  }

  return (
    <>
      <div className={styles.tableCardHeader}>
        <h3 className={styles.tableCardTitle}>Assigned Exams</h3>
      </div>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Exam</th>
            <th>Type</th>
            <th>Assigned</th>
            <th>Deadline</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {exams.map((e) => (
            <tr key={e.id}>
              <td className={styles.cellBold}>{e.exam_title}</td>
              <td>
                <span className={`${styles.typeBadge} ${e.exam_type === 'mock' ? styles.typeMock : styles.typePractice}`}>
                  {e.exam_type}
                </span>
              </td>
              <td>{formatDate(e.assigned_at)}</td>
              <td>
                {e.deadline
                  ? formatDate(e.deadline)
                  : <span className={styles.cellMuted}>No deadline</span>}
              </td>
              <td>
                <span className={`${styles.statusDot} ${e.is_active ? styles.statusActive : styles.statusInactive}`}>
                  {e.is_active ? 'Active' : 'Inactive'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}