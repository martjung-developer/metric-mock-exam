// components/dashboard/admin/students/create/CreateStudentForm.tsx
//
// Assembles AccountSection + AcademicSection + FormActions into the form card.
// Receives all state and handlers from the page via props —
// this component owns zero state itself.

'use client'

import type { StudentFormData, StudentFormErrors } from '@/lib/types/admin/students/create/student.types'
import type { Program }                            from '@/lib/types/admin/students/program.types'
import { AccountSection }  from './AccountSection'
import { AcademicSection } from './AcademicSection'
import { FormActions }     from './FormActions'
import { ErrorAlert }      from './ErrorAlert'
import styles from '@/app/(dashboard)/admin/students/create/create.module.css'

interface Props {
  form:         StudentFormData
  errors:       StudentFormErrors
  programs:     Program[]
  saving:       boolean
  onChange:     (field: keyof StudentFormData, value: string) => void
  onSubmit:     (e: React.FormEvent) => Promise<void>
}

export function CreateStudentForm({
  form, errors, programs, saving, onChange, onSubmit,
}: Props) {
  return (
    <form className={styles.formCard} onSubmit={onSubmit} noValidate>

      {/* General error */}
      {errors.general && <ErrorAlert message={errors.general} />}

      {/* Account section */}
      <AccountSection
        form={{
          full_name: form.full_name,
          email:     form.email,
          password:  form.password,
          school:    form.school,
        }}
        errors={{
          full_name: errors.full_name,
          email:     errors.email,
          password:  errors.password,
        }}
        onChange={onChange}
      />

      <div className={styles.divider} />

      {/* Academic section */}
      <AcademicSection
        form={{
          student_id: form.student_id,
          program_id: form.program_id,
          year_level: form.year_level,
        }}
        errors={{
          student_id: errors.student_id,
          program_id: errors.program_id,
          year_level: errors.year_level,
        }}
        programs={programs}
        onChange={onChange}
      />

      {/* Actions */}
      <FormActions saving={saving} cancelHref="/admin/students" />

    </form>
  )
}