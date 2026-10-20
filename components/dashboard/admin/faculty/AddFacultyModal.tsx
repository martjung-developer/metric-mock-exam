// components/dashboard/admin/faculty/AddFacultyModal.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Loader2, UserPlus, Eye, EyeOff } from 'lucide-react'
import { useCreateFaculty }                 from '@/lib/hooks/admin/faculty/useCreateFaculty'
import {
  validateFacultyForm,
  hasErrors,
  getProgramsForDepartment,
}                                           from '@/lib/utils/admin/faculty/validateFacultyForm'
import {
  DEPARTMENT_PROGRAMS,
  ROLE_TYPE_OPTIONS,
  ROLE_TYPE_LABELS,
}                                           from '@/lib/types/admin/faculty'
import type {
  CreateFacultyPayload,
  FacultyDepartment,
  FacultyProgram,
  FacultyProgramSelection,
  FacultyRoleType,
  ProgramOption,
}                                           from '@/lib/types/admin/faculty'
import { createClient }                     from '@/lib/supabase/client'
import styles                               from '@/components/dashboard/admin/faculty/css/AddFacultyModal.module.css'

interface AddFacultyModalProps {
  open:      boolean
  onClose:   () => void
  onSuccess: (facultyId: string) => void
}

const BLANK: CreateFacultyPayload = {
  fullName:   '',
  email:      '',
  facultyId:  '',
  password:   '',
  department: '' as FacultyDepartment,
  programs:   [],
  roleTypes:  [],
}

export default function AddFacultyModal({ open, onClose, onSuccess }: AddFacultyModalProps) {
  const [form,      setForm]      = useState<CreateFacultyPayload>(BLANK)
  const [showPassword, setShowPassword] = useState(false)
  const [programOptions, setProgramOptions] = useState<ProgramOption[]>([])
  const [,  setTouched]   = useState<Partial<Record<keyof CreateFacultyPayload, boolean>>>({})
  const [submitted, setSubmitted] = useState(false)

  const { create, loading, error: apiError, clearError } = useCreateFaculty()

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm(BLANK)
      setShowPassword(false)
      setTouched({})
      setSubmitted(false)
      clearError()
    }
  }, [open, clearError])

  useEffect(() => {
    if (!open) { return }
    const supabase = createClient()
    void (async () => {
      const { data } = await supabase
        .from('programs')
        .select('id, code, name, schools(code, name)')
        .order('code', { ascending: true })

      const mapped: ProgramOption[] = (data ?? []).map((row) => {
        const school = Array.isArray(row.schools) ? row.schools[0] : row.schools
        return {
          id: row.id,
          code: row.code,
          name: row.name,
          school_code: school?.code ?? '',
          school_name: school?.name ?? '',
        }
      })
      setProgramOptions(mapped)
    })()
  }, [open])

  // Department change clears program selections (this is what enforces
  // "one school only" — department IS the school boundary here).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm((prev) => ({ ...prev, programs: [] }))
  }, [form.department])

  const availableProgramCodes = getProgramsForDepartment(form.department)
  const availableProgramOptions = programOptions.filter((p) =>
    availableProgramCodes.includes(p.code as FacultyProgram),
  )
  const errors     = validateFacultyForm(form)
  const showErrors = submitted

  function field<K extends keyof CreateFacultyPayload>(key: K) {
    return {
      value: form[key],
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm((prev) => ({ ...prev, [key]: e.target.value }))
        setTouched((prev) => ({ ...prev, [key]: true }))
        clearError()
      },
      onBlur: () => setTouched((prev) => ({ ...prev, [key]: true })),
    }
  }

  function toggleRoleType(value: FacultyRoleType) {
    setForm((prev) => ({
      ...prev,
      roleTypes: prev.roleTypes.includes(value)
        ? prev.roleTypes.filter((r) => r !== value)
        : [...prev.roleTypes, value],
    }))
    setTouched((prev) => ({ ...prev, roleTypes: true }))
    clearError()
  }

  function toggleProgram(opt: ProgramOption) {
    setForm((prev) => {
      const exists = prev.programs.find((p) => p.programId === opt.id)
      if (exists) {
        return { ...prev, programs: prev.programs.filter((p) => p.programId !== opt.id) }
      }
      const sel: FacultyProgramSelection = {
        programId: opt.id,
        code: opt.code as FacultyProgram,
        isProgramHead: false,
      }
      return { ...prev, programs: [...prev.programs, sel] }
    })
    setTouched((prev) => ({ ...prev, programs: true }))
    clearError()
  }

  function toggleProgramHead(programId: string) {
    setForm((prev) => ({
      ...prev,
      programs: prev.programs.map((p) =>
        p.programId === programId ? { ...p, isProgramHead: !p.isProgramHead } : p,
      ),
    }))
  }

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setSubmitted(true)
      if (hasErrors(validateFacultyForm(form))) { return }

      const result = await create(form)
      if (result.success && result.faculty_id) {
        onSuccess(result.faculty_id)
        onClose()
      }
    },
    [form, create, onSuccess, onClose],
  )

  if (!open) { return null }

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className={styles.modal}>

        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon} aria-hidden="true">
              <UserPlus size={16} color="#3b82f6" strokeWidth={2} />
            </div>
            <h2 id="modal-title" className={styles.title}>Add Faculty Member</h2>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
            <X size={16} />
          </button>
        </div>

        {apiError && <div className={styles.errorBanner} role="alert">{apiError}</div>}

        <form className={styles.form} onSubmit={handleSubmit} noValidate>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="fm-fullName">Full Name</label>
            <input
              id="fm-fullName" type="text" placeholder="e.g. Jean Erezo"
              className={`${styles.input} ${showErrors && errors.fullName ? styles.inputError : ''}`}
              autoComplete="off" {...field('fullName')}
            />
            {showErrors && errors.fullName && <span className={styles.fieldError}>{errors.fullName}</span>}
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="fm-email">Email Address</label>
            <input
              id="fm-email" type="email" placeholder="faculty@school.edu.ph"
              className={`${styles.input} ${showErrors && errors.email ? styles.inputError : ''}`}
              autoComplete="off" {...field('email')}
            />
            {showErrors && errors.email && <span className={styles.fieldError}>{errors.email}</span>}
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="fm-facultyId">Faculty ID Number</label>
            <input
              id="fm-facultyId" type="text" placeholder="e.g. SBIT-202261"
              className={`${styles.input} ${showErrors && errors.facultyId ? styles.inputError : ''}`}
              autoComplete="off" {...field('facultyId')}
            />
            {showErrors && errors.facultyId && <span className={styles.fieldError}>{errors.facultyId}</span>}
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="fm-password">Password</label>
            <div className={styles.passwordWrap}>
              <input
                id="fm-password" type={showPassword ? 'text' : 'password'}
                placeholder="Enter temporary password"
                className={`${styles.input} ${showErrors && errors.password ? styles.inputError : ''}`}
                autoComplete="new-password" {...field('password')}
              />
              <button
                type="button" className={styles.passwordToggle}
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {showErrors && errors.password && <span className={styles.fieldError}>{errors.password}</span>}
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="fm-department">Department</label>
            <select
              id="fm-department"
              className={`${styles.select} ${showErrors && errors.department ? styles.inputError : ''}`}
              value={form.department}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, department: e.target.value as FacultyDepartment, programs: [] }))
                setTouched((prev) => ({ ...prev, department: true }))
                clearError()
              }}
              onBlur={() => setTouched((prev) => ({ ...prev, department: true }))}
            >
              <option value="">Select department</option>
              {DEPARTMENT_PROGRAMS.map((d) => (
                <option key={d.department} value={d.department}>{d.department}</option>
              ))}
            </select>
            {showErrors && errors.department && <span className={styles.fieldError}>{errors.department}</span>}
            <span className={styles.hint}>A faculty member&apos;s programs must all belong to one department/school.</span>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Programs</label>
            <div
              className={`${styles.roleCheckGroup} ${showErrors && errors.programs ? styles.roleCheckGroupError : ''}`}
              role="group"
              aria-label="Programs"
            >
              {!form.department && (
                <span className={styles.hint}>Select a department first.</span>
              )}
              {availableProgramOptions.map((opt) => {
                const sel = form.programs.find((p) => p.programId === opt.id)
                return (
                  <div key={opt.id} className={styles.programRow}>
                    <label className={styles.roleCheckItem}>
                      <input
                        type="checkbox"
                        checked={Boolean(sel)}
                        onChange={() => toggleProgram(opt)}
                      />
                      <span>{opt.code} — {opt.name}</span>
                    </label>
                    {sel && (
                      <label className={styles.programHeadInline}>
                        <input
                          type="checkbox"
                          checked={sel.isProgramHead}
                          onChange={() => toggleProgramHead(opt.id)}
                        />
                        <span>Program Head</span>
                      </label>
                    )}
                  </div>
                )
              })}
            </div>
            {showErrors && errors.programs && <span className={styles.fieldError}>{errors.programs}</span>}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Role Type</label>
            <div
              className={`${styles.roleCheckGroup} ${showErrors && errors.roleTypes ? styles.roleCheckGroupError : ''}`}
              role="group" aria-label="Role type"
            >
              {ROLE_TYPE_OPTIONS.map((val) => (
                <label key={val} className={styles.roleCheckItem}>
                  <input
                    type="checkbox"
                    checked={form.roleTypes.includes(val)}
                    onChange={() => toggleRoleType(val)}
                  />
                  <span>{ROLE_TYPE_LABELS[val]}</span>
                </label>
              ))}
            </div>
            {showErrors && errors.roleTypes && <span className={styles.fieldError}>{errors.roleTypes}</span>}
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? (<><Loader2 size={14} className={styles.spinner} /> Creating…</>) : 'Create Faculty'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}