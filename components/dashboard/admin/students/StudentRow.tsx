// components/dashboard/admin/students/StudentRow.tsx
import Link from 'next/link'
import { Eye, Pencil, Trash2 } from 'lucide-react'
import type { Students } from '@/lib/types/admin/students/student.types'
import { getInitials, avatarColor } from '@/lib/utils/admin/students/helpers'
import { formatDate, yearLabel }    from '@/lib/utils/admin/students/format'
import styles from '@/app/(dashboard)/admin/students/students.module.css'

interface StudentRowProps {
  student:   Students
  onDelete:  (s: Students) => void
}

export function StudentRow({ student: s, onDelete }: StudentRowProps) {
  const initials        = getInitials(s.full_name, s.email)
  const { bg, color }   = avatarColor(s.id)
  return (
    <tr className={styles.row}>
      <td>
        <div className={styles.studentCell}>
          <div className={styles.avatar} style={{ background: bg, color }}>{initials}</div>
          <div>
            <p className={styles.studentName}>{s.full_name ?? '—'}</p>
            <p className={styles.studentEmail}>{s.email}</p>
          </div>
        </div>
      </td>
      <td><span className={styles.idBadge}>{s.student_id ?? '—'}</span></td>
      <td>
        {s.program_code
          ? <div><span className={styles.programBadge}>{s.program_code}</span><span className={styles.yearLabel}>{yearLabel(s.year_level)}</span></div>
          : <span className={styles.noProgramLabel}>No program</span>}
      </td>
      <td><span className={styles.dateLabel}>{formatDate(s.created_at)}</span></td>
      <td>
        <div className={styles.actions}>
          <Link href={`/admin/students/${s.id}`}      className={styles.actionBtn} title="View"><Eye size={15} /></Link>
          <Link href={`/admin/students/${s.id}/edit`} className={styles.actionBtn} title="Edit"><Pencil size={15} /></Link>
          <button className={`${styles.actionBtn} ${styles.actionBtnDanger}`} onClick={() => onDelete(s)}><Trash2 size={15} /></button>
        </div>
      </td>
    </tr>
  )
}