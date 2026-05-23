/**
 * components/dashboard/admin/students/StudentsHeader.tsx
 * Pure presentational — no Supabase, no hooks, no business logic.
 */

import { GraduationCap } from 'lucide-react'
import styles from '@/app/(dashboard)/admin/students/students.module.css'

interface StudentsHeaderProps {
  totalCount: number
  loading:    boolean
}

export function StudentsHeader({ totalCount, loading }: StudentsHeaderProps) {
  return (
    <div className={styles.header}>
      <div className={styles.headerLeft}>
        <div className={styles.headerIcon}>
          <GraduationCap size={22} strokeWidth={1.75} />
        </div>
        <div>
          <h1 className={styles.title}>Students</h1>
          <p className={styles.subtitle}>
            {loading
              ? '…'
              : `${totalCount} enrolled student${totalCount !== 1 ? 's' : ''}`}
          </p>
        </div>
      </div>
{/*
      <Link href="/admin/students/create" className={styles.btnAdd}>
        <UserPlus size={15} strokeWidth={2.2} />
        Add Student
      </Link>
      */}
    </div>
  )
}