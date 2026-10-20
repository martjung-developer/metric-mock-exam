// lib/utils/admin/faculty/validateFacultyForm.ts
import type {
  CreateFacultyPayload,
  FacultyDepartment,
  DepartmentPrograms,
} from '@/lib/types/admin/faculty'
import { DEPARTMENT_PROGRAMS } from '@/lib/types/admin/faculty'
import { validateFacultyId } from '@/lib/utils/auth'

export interface FacultyFormErrors {
  fullName?:   string
  email?:      string
  facultyId?:  string
  password?:   string
  department?: string
  programs?:    string
  roleTypes?:  string
  programId?:  string
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateFacultyForm(
  payload: Partial<CreateFacultyPayload>,
): FacultyFormErrors {
  const errors: FacultyFormErrors = {}

  if (!payload.fullName?.trim()) {
    errors.fullName = 'Full name is required.'
  }

  if (!payload.email?.trim()) {
    errors.email = 'Email is required.'
  } else if (!EMAIL_RE.test(payload.email.trim())) {
    errors.email = 'Enter a valid email address.'
  }

  if (!payload.facultyId?.trim()) {
    errors.facultyId = 'Faculty ID Number is required.'
  } else {
    const idError = validateFacultyId(payload.facultyId)
    if (idError) { errors.facultyId = idError }
  }

  if (!payload.password?.trim()) {
    errors.password = 'Password is required.'
  } else if (payload.password.trim().length < 8) {
    errors.password = 'Password must be at least 8 characters.'
  }

  if (!payload.department) {
    errors.department = 'Department is required.'
  }

  // ── Multi-program validation ──────────────────────────────────────────
  if (!payload.programs || payload.programs.length === 0) {
    errors.programs = 'Select at least one program.'
  } else {
    const dups = new Set<string>()
    for (const p of payload.programs) {
      if (dups.has(p.programId)) {
        errors.programs = 'Duplicate program selected.'
        break
      }
      dups.add(p.programId)
    }
    if (!errors.programs && payload.department) {
      const deptEntry: DepartmentPrograms | undefined = DEPARTMENT_PROGRAMS.find(
        (d) => d.department === payload.department,
      )
      const invalid = payload.programs.some(
        (p) => deptEntry && !deptEntry.programs.includes(p.code),
      )
      if (invalid) {
        errors.programs = 'All selected programs must belong to the chosen department.'
      }
    }
  }

  if (!payload.roleTypes || payload.roleTypes.length === 0) {
    errors.roleTypes = 'Select at least one role type.'
  }

  return errors
}

export function hasErrors(errors: FacultyFormErrors): boolean {
  return Object.values(errors).some(Boolean)
}

export function getProgramsForDepartment(department: FacultyDepartment | '') {
  if (!department) { return [] }
  const entry = DEPARTMENT_PROGRAMS.find((d) => d.department === department)
  return entry ? [...entry.programs] : []
}