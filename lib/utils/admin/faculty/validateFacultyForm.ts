// lib/utils/admin/faculty/validateFacultyForm.ts
//
// Client-side form validation for the Create Faculty modal.
// Mirrors the server-side checks so the user gets instant feedback.

import type {
  CreateFacultyPayload,
  FacultyDepartment,
  FacultyProgram,
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
  program?:    string
  roleType?:   string
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
    if (idError) {
      errors.facultyId = idError
    }
  }

  if (!payload.password?.trim()) {
    errors.password = 'Password is required.'
  } else if (payload.password.trim().length < 8) {
    errors.password = 'Password must be at least 8 characters.'
  }

  if (!payload.department) {
    errors.department = 'Department is required.'
  }

  if (!payload.program) {
    errors.program = 'Program is required.'
  } else if (payload.department) {
    const deptEntry: DepartmentPrograms | undefined = DEPARTMENT_PROGRAMS.find(
      (d) => d.department === payload.department,
    )
    if (deptEntry && !deptEntry.programs.includes(payload.program as FacultyProgram)) {
      errors.program = 'Selected program does not belong to the chosen department.'
    }
  }
  if (!payload.programId?.trim()) {
    errors.programId = 'Program mapping failed. Please reselect the program.'
  }

  if (!payload.roleType) {
    errors.roleType = 'Role type is required.'
  }

  return errors
}

export function hasErrors(errors: FacultyFormErrors): boolean {
  return Object.values(errors).some(Boolean)
}

// ── Derive programs for a selected department ─────────────────────────────────

export function getProgramsForDepartment(
  department: FacultyDepartment | '',
): FacultyProgram[] {
  if (!department) {
    return []
  }
  const entry = DEPARTMENT_PROGRAMS.find((d) => d.department === department)
  return entry ? [...entry.programs] : []
}
