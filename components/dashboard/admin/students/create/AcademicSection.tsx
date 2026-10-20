// components/dashboard/admin/students/create/AcademicSection.tsx
'use client'

import { memo } from 'react'
import type { StudentFormData, StudentFormErrors } from '@/lib/types/admin/students/create/student.types'
import type { Program }                            from '@/lib/types/admin/students/program.types'
import styles from '@/app/(dashboard)/admin/students/create/create.module.css'

interface Props {
  form:     Pick<StudentFormData, 'student_id' | 'program_id' | 'year_level'>
  errors:   Pick<StudentFormErrors, 'student_id' | 'program_id' | 'year_level'>
  programs: Program[]
  onChange: (field: keyof StudentFormData, value: string) => void
}

export const AcademicSection = memo(function AcademicSection({
  form, errors, programs, onChange,
}: Props) {
  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>Academic Information</h2>
      <div className={styles.fieldGrid}>

        {/* Student ID */}
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="student_id">
            Student ID Number
          </label>
          <input
            id="student_id"
            className={`${styles.input} ${errors.student_id ? styles.inputError : ''}`}
            type="text"
            placeholder="e.g. 2024-00123"
            value={form.student_id}
            onChange={(e) => onChange('student_id', e.target.value)}
          />
          <span className={styles.fieldHint}>The school-assigned ID (optional)</span>
          {errors.student_id && (
            <span className={styles.fieldError} role="alert">{errors.student_id}</span>
          )}
        </div>

        {/* Program */}
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="program_id">
            Program
          </label>
          <select
            id="program_id"
            className={`${styles.select} ${errors.program_id ? styles.inputError : ''}`}
            value={form.program_id}
            onChange={(e) => onChange('program_id', e.target.value)}
          >
            <option value="">— Select Program —</option>
            {programs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} — {p.name}
              </option>
            ))}
          </select>
          {errors.program_id && (
            <span className={styles.fieldError} role="alert">{errors.program_id}</span>
          )}
        </div>

        {/* Year level */}
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="year_level">
            Year Level
          </label>
          <select
            id="year_level"
            className={`${styles.select} ${errors.year_level ? styles.inputError : ''}`}
            value={form.year_level}
            onChange={(e) => onChange('year_level', e.target.value)}
          >
            <option value="">— Select Year —</option>
            <option value="1">1st Year</option>
            <option value="2">2nd Year</option>
            <option value="3">3rd Year</option>
            <option value="4">4th Year</option>
          </select>
          {errors.year_level && (
            <span className={styles.fieldError} role="alert">{errors.year_level}</span>
          )}
        </div>

      </div>
    </div>
  )
})