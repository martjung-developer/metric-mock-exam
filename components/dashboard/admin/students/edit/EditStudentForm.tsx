// components/dashboard/admin/students/edit/EditStudentForm.tsx
import { AlertCircle } from 'lucide-react'
import type { ProgramOption }     from '@/lib/types/admin/students/edit/program.types'
import type {
  EditStudentForm as EditStudentFormShape,
  EditStudentFormErrors,
} from '@/lib/types/admin/students/edit/student.types'
import { EditStudentFields  } from './EditStudentFields'
import { EditStudentActions } from './EditStudentActions'
import styles from '@/app/(dashboard)/admin/students/[id]/edit/edit.module.css'

interface EditStudentFormProps {
  studentId:    string
  form:         EditStudentFormShape
  formErrors:   EditStudentFormErrors
  programs:     ProgramOption[]
  saving:       boolean
  onChange:     (field: keyof EditStudentFormShape, value: string) => void
  onSubmit:     (e: React.FormEvent<HTMLFormElement>) => Promise<void>
}

export function EditStudentForm({
  studentId,
  form,
  formErrors,
  programs,
  saving,
  onChange,
  onSubmit,
}: EditStudentFormProps) {
  return (
    <form className={styles.formCard} onSubmit={onSubmit} noValidate>

      {/* General error */}
      {formErrors.general && (
        <div className={styles.alertError}>
          <AlertCircle size={15} /> {formErrors.general}
        </div>
      )}

      <EditStudentFields
        form={form}
        formErrors={formErrors}
        programs={programs}
        onChange={onChange}
      />

      {/* Email note */}
      <div className={styles.alertInfo}>
        <AlertCircle size={15} />
        Email address changes are managed through the authentication system
        and cannot be edited here.
      </div>

      <EditStudentActions studentId={studentId} saving={saving} />
    </form>
  )
}