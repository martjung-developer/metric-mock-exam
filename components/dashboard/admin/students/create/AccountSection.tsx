// components/dashboard/admin/students/create/AccountSection.tsx
//
// Presentational — receives typed props and fires typed callbacks.
// memo'd to prevent re-rendering when AcademicSection or submit state changes.

'use client'

import { memo } from 'react'
import type { StudentFormData, StudentFormErrors } from '@/lib/types/admin/students/create/student.types'
import styles from '@/app/(dashboard)/admin/students/create/create.module.css'

interface Props {
  form:         Pick<StudentFormData, 'full_name' | 'email' | 'password' | 'school'>
  errors:       Pick<StudentFormErrors, 'full_name' | 'email' | 'password'>
  onChange:     (field: keyof StudentFormData, value: string) => void
}

export const AccountSection = memo(function AccountSection({ form, errors, onChange }: Props) {
  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>Account Information</h2>
      <div className={styles.fieldGrid}>

        {/* Full name */}
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="full_name">
            Full Name <span className={styles.req}>*</span>
          </label>
          <input
            id="full_name"
            className={`${styles.input} ${errors.full_name ? styles.inputError : ''}`}
            type="text"
            placeholder="e.g. Maria Santos"
            value={form.full_name}
            onChange={(e) => onChange('full_name', e.target.value)}
            aria-describedby={errors.full_name ? 'err-full_name' : undefined}
            aria-invalid={!!errors.full_name}
          />
          {errors.full_name && (
            <span id="err-full_name" className={styles.fieldError} role="alert">
              {errors.full_name}
            </span>
          )}
        </div>

        {/* Email */}
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="email">
            Email Address <span className={styles.req}>*</span>
          </label>
          <input
            id="email"
            className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
            type="email"
            placeholder="student@school.edu.ph"
            value={form.email}
            onChange={(e) => onChange('email', e.target.value)}
            aria-describedby={errors.email ? 'err-email' : undefined}
            aria-invalid={!!errors.email}
          />
          {errors.email && (
            <span id="err-email" className={styles.fieldError} role="alert">
              {errors.email}
            </span>
          )}
        </div>

        {/* Password */}
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="password">
            Password <span className={styles.req}>*</span>
          </label>
          <input
            id="password"
            className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
            type="password"
            placeholder="Min. 8 characters"
            value={form.password}
            onChange={(e) => onChange('password', e.target.value)}
            aria-describedby={errors.password ? 'err-password' : undefined}
            aria-invalid={!!errors.password}
            autoComplete="new-password"
          />
          {errors.password && (
            <span id="err-password" className={styles.fieldError} role="alert">
              {errors.password}
            </span>
          )}
        </div>

        {/* School */}
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="school">
            School / Institution
          </label>
          <input
            id="school"
            className={styles.input}
            type="text"
            placeholder="e.g. LCCB"
            value={form.school}
            onChange={(e) => onChange('school', e.target.value)}
          />
        </div>

      </div>
    </div>
  )
})