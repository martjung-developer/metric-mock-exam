// components/dashboard/admin/students/StudentsTable.tsx
import type { Students } from '@/lib/types/admin/students/student.types'
import { StudentRow }   from './StudentRow'
import { LoadingSkeleton } from './LoadingSkeleton'
import { EmptyState }      from './EmptyState'
import styles from '@/app/(dashboard)/admin/students/students.module.css'

interface StudentsTableProps {
  paginated:  Students[]
  loading:    boolean
  activeTab:  string
  search:     string
  onDelete:   (s: Students) => void
}

export function StudentsTable({ paginated, loading, activeTab, search, onDelete }: StudentsTableProps) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr><th>Student</th><th>Student ID</th><th>Program / Year</th><th>Joined</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {loading       ? <LoadingSkeleton />
           : paginated.length === 0 ? <EmptyState activeTab={activeTab} search={search} />
           : paginated.map((s) => <StudentRow key={s.id} student={s} onDelete={onDelete} />)}
        </tbody>
      </table>
    </div>
  )
}