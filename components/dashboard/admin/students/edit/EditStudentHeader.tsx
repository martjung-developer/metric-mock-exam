// components/dashboard/admin/students/edit/EditStudentHeader.tsx
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'
import styles from '@/app/(dashboard)/admin/students/[id]/edit/edit.module.css'

interface EditStudentHeaderProps {
  studentId:   string
  displayName: string
}

export function EditStudentHeader({ studentId, displayName }: EditStudentHeaderProps) {
  return (
    <div className={styles.header}>
      <Link href={`/admin/students/${studentId}`} className={styles.backLink}>
        <ArrowLeft size={15} /> Back to {displayName}
      </Link>
      <div className={styles.headerInfo}>
        <div className={styles.headerIcon}>
          <Save size={20} strokeWidth={1.75} />
        </div>
        <div>
          <h1 className={styles.title}>Edit Student</h1>
          <p className={styles.subtitle}>Update profile and academic information</p>
        </div>
      </div>
    </div>
  )
}