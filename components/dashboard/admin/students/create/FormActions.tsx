// components/dashboard/admin/students/create/FormActions.tsx
'use client'

import { memo } from 'react'
import Link     from 'next/link'
import { UserPlus } from 'lucide-react'
import styles from '@/app/(dashboard)/admin/students/create/create.module.css'

interface Props {
  saving:      boolean
  cancelHref:  string
}

export const FormActions = memo(function FormActions({ saving, cancelHref }: Props) {
  return (
    <div className={styles.formActions}>
      <Link href={cancelHref} className={styles.btnCancel}>
        Cancel
      </Link>
      <button
        type="submit"
        className={styles.btnSave}
        disabled={saving}
        aria-busy={saving}
      >
        <UserPlus size={15} aria-hidden />
        {saving ? 'Creating…' : 'Create Student'}
      </button>
    </div>
  )
})