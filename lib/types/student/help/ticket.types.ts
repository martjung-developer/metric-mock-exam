// lib/types/student/help/ticket.types.ts
// All support-ticket-related types for the Student Help page.

// ── Supabase insert shape ───────────────────────────────────────────────────
// Matches the `support_tickets` table insert columns exactly.
// user_id is required — ticket submission is gated on auth.

export interface SupportTicketInsert {
  subject:     string
  category:    string
  priority:    string
  description: string
  status:      'open'          // always 'open' on creation
  created_at:  string          // ISO timestamp
  user_id:     string          // from AuthContext — required
}

// ── Form state ──────────────────────────────────────────────────────────────
// All fields are strings (controlled inputs).

export interface TicketFormState {
  subject:     string
  category:    string
  priority:    string
  description: string
}

// ── Validation errors ───────────────────────────────────────────────────────

export type TicketFormErrors = Partial<Record<keyof TicketFormState, string>>

// ── Strongly typed submission error ────────────────────────────────────────
// Avoids collapsing all errors to `string`.

export interface TicketSubmitError {
  code:    'unauthenticated' | 'validation' | 'network' | 'unknown'
  message: string
}

// ── Hook return shape ───────────────────────────────────────────────────────

export interface UseSubmitTicketReturn {
  form:          TicketFormState
  formErrors:    TicketFormErrors
  submitting:    boolean
  notifying:     boolean
  submitSuccess: boolean
  submitError:   TicketSubmitError | null
  setField:      <K extends keyof TicketFormState>(field: K, value: TicketFormState[K]) => void
  submit:        (e: React.FormEvent) => Promise<void>
  sendNotificationToAdmin: () => Promise<void>
}
