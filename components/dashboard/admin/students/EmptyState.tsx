// components/dashboard/admin/students/EmptyState.tsx
import Link from 'next/link'
import { GraduationCap, UserPlus } from 'lucide-react'
import { ALL_TAB } from '@/lib/utils/admin/students/constants'
import styles from '@/app/(dashboard)/admin/students/students.module.css'

interface EmptyStateProps {
  activeTab: string
  search:    string
}

export function EmptyState({ activeTab, search }: EmptyStateProps) {
  const message =
    activeTab !== ALL_TAB ? 'No students enrolled in this program yet.'
    : search               ? 'No results match your search.'
                           : 'No students have been added yet.'

  return (
    <tr><td colSpan={5}>
      <div className={styles.emptyState}>
        <GraduationCap size={38} strokeWidth={1.3} color="#cbd5e1" />
        <p className={styles.emptyTitle}>No students found</p>
        <p className={styles.emptyText}>{message}</p>
        {activeTab === ALL_TAB && !search && (
          <Link href="/admin/students/create" className={styles.emptyBtn}>
            <UserPlus size={14} /> Add First Student
          </Link>
        )}
      </div>
    </td></tr>
  )
}