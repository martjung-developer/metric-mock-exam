// lib/utils/admin/exams/detail/validators.ts
// Validation logic for the exam edit form.
// Pure functions — no UI, no state, no side effects.

import type { EditForm, EditFormErrors } from '@/lib/types/admin/exams/detail/exam.types'

// ── validateEditForm ────────────────────────────────────────────────────────
// Returns an error map. An empty map means the form is valid.

export function validateEditForm(form: EditForm): EditFormErrors {
  const errors: EditFormErrors = {}

  if (!form.title.trim()) {
    errors.title = 'Title is required.'
  }

  const duration = Number(form.duration_minutes)
  if (!form.duration_minutes || isNaN(duration) || duration < 1) {
    errors.duration_minutes = 'At least 1 minute.'
  }

  const points = Number(form.total_points)
  if (!form.total_points || isNaN(points) || points < 1) {
    errors.total_points = 'At least 1 point.'
  }

  const passing = Number(form.passing_score)
  if (!form.passing_score || isNaN(passing) || passing < 0 || passing > 100) {
    errors.passing_score = 'Must be 0–100.'
  }

  return errors
}

// ── isFormValid ─────────────────────────────────────────────────────────────
// Convenience: returns true when there are no validation errors.

export function isFormValid(errors: EditFormErrors): boolean {
  return Object.keys(errors).length === 0
}