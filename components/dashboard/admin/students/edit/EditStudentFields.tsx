// components/dashboard/admin/students/edit/EditStudentFields.tsx
import type { ProgramOption }     from '@/lib/types/admin/students/edit/program.types'
import type {
  EditStudentForm,
  EditStudentFormErrors,
} from '@/lib/types/admin/students/edit/student.types'
import styles from '@/app/(dashboard)/admin/students/[id]/edit/edit.module.css'

interface EditStudentFieldsProps {
  form:         EditStudentForm
  formErrors:   EditStudentFormErrors
  programs:     ProgramOption[]
  onChange:     (field: keyof EditStudentForm, value: string) => void
}

export function EditStudentFields({
  form,
  formErrors,
  programs,
  onChange,
}: EditStudentFieldsProps) {
  return (
    <>
      {/* ── Personal Information ── */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Personal Information</h2>
        <div className={styles.fieldGrid}>

          <div className={`${styles.fieldGroup} ${styles.fieldGroupFull}`}>
            <label className={styles.label}>
              Full Name <span className={styles.req}>*</span>
            </label>
            <input
              className={`${styles.input} ${formErrors.full_name ? styles.inputError : ''}`}
              type="text"
              placeholder="Full name"
              value={form.full_name}
              onChange={(e) => onChange('full_name', e.target.value)}
            />
            {formErrors.full_name && (
              <span className={styles.fieldError}>{formErrors.full_name}</span>
            )}
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>School / Institution</label>
            <input
              className={styles.input}
              type="text"
              placeholder="e.g. LCCB"
              value={form.school}
              onChange={(e) => onChange('school', e.target.value)}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Target Exam</label>
            <input
              className={styles.input}
              type="text"
              placeholder="e.g. Nursing Board"
              value={form.target_exam}
              onChange={(e) => onChange('target_exam', e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className={styles.divider} />

      {/* ── Academic Information ── */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Academic Information</h2>
        <div className={styles.fieldGrid}>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Student ID Number</label>
            <input
              className={styles.input}
              type="text"
              placeholder="e.g. 2024-00123"
              value={form.student_id}
              onChange={(e) => onChange('student_id', e.target.value)}
            />
            <span className={styles.fieldHint}>School-assigned ID number</span>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Program</label>
            <select
              className={styles.select}
              value={form.program_id}
              onChange={(e) => onChange('program_id', e.target.value)}
            >
              <option value="">— No Program —</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} — {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Year Level</label>
            <select
              className={styles.select}
              value={form.year_level}
              onChange={(e) => onChange('year_level', e.target.value)}
            >
              <option value="">— Not Set —</option>
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
            </select>
          </div>
        </div>
      </div>
    </>
  )
}