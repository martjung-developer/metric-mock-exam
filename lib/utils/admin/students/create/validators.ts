// lib/utils/admin/students/create/validators.ts
//
// Pure validation functions — no React, no Supabase.
// Fully unit-testable in isolation.

import type {
  StudentFormData,
  StudentFormErrors,
} from '@/lib/types/admin/students/create/student.types'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Validates the student creation form.
 * Returns an errors object — empty means the form is valid.
 */
export function validateStudentForm(form: StudentFormData): StudentFormErrors {
  const errors: StudentFormErrors = {}

  if (!form.full_name.trim()) {
    errors.full_name = 'Full name is required.'
  }

  if (!form.email.trim()) {
    errors.email = 'Email is required.'
  } else if (!EMAIL_RE.test(form.email.trim())) {
    errors.email = 'Enter a valid email address.'
  }

  if (!form.password) {
    errors.password = 'Password is required.'
  } else if (form.password.length < 8) {
    errors.password = 'Password must be at least 8 characters.'
  }

  return errors
}

/** Returns true when the errors object has no keys set. */
export function hasErrors(errors: StudentFormErrors): boolean {
  return Object.values(errors).some((v) => v !== undefined && v !== '')
}