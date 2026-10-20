// lib/utils/student/help/validators.ts
// Pure validation functions for the support ticket form.

import type { TicketFormState, TicketFormErrors } from '@/lib/types/student/help/ticket.types'

// ── validateTicketForm ───────────────────────────────────────────────────────
// Returns an error map. Empty map = valid.

export function validateTicketForm(form: TicketFormState): TicketFormErrors {
  const errors: TicketFormErrors = {}

  if (!form.subject.trim()) {
    errors.subject = 'Subject is required.'
  }

  if (!form.description.trim()) {
    errors.description = 'Please describe your issue.'
  }

  return errors
}

// ── isTicketFormValid ────────────────────────────────────────────────────────

export function isTicketFormValid(errors: TicketFormErrors): boolean {
  return Object.keys(errors).length === 0
}