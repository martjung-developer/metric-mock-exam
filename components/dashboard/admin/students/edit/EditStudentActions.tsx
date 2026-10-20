// components/dashboard/admin/students/edit/EditStudentActions.tsx
import Link from 'next/link'
import { Save } from 'lucide-react'
import styles from '@/app/(dashboard)/admin/students/[id]/edit/edit.module.css'

interface EditStudentActionsProps {
  studentId: string
  saving:    boolean
}

export function EditStudentActions({ studentId, saving }: EditStudentActionsProps) {
  return (
    <div className={styles.formActions}>
      <Link href={`/admin/students/${studentId}`} className={styles.btnCancel}>
        Cancel
      </Link>
      <button type="submit" className={styles.btnSave} disabled={saving}>
        <Save size={14} />
        {saving ? 'Saving…' : 'Save Changes'}
      </button>
    </div>
  )
}