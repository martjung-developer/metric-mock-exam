// lib/hooks/student/help/useSubmitTicket.ts
// Manages ticket form state, validation, and authenticated submission.

import { useState, useCallback } from 'react'
import { createClient }        from '@/lib/supabase/client'
import { createTicket }        from '@/lib/services/student/help/ticket.service'
import {
  notifyAdmins,
  notifyAdminsSupportTicket,
} from '@/lib/services/notifications/adminAlerts.service'
import { validateTicketForm, isTicketFormValid } from '@/lib/utils/student/help/validators'
import type {
  TicketFormState,
  TicketFormErrors,
  TicketSubmitError,
  UseSubmitTicketReturn,
} from '@/lib/types/student/help/ticket.types'

const DEFAULT_FORM: TicketFormState = {
  subject:     '',
  category:    '',
  priority:    'normal',
  description: '',
}

export function useSubmitTicket(userId: string | null): UseSubmitTicketReturn {
  const [form,          setFormState]   = useState<TicketFormState>(DEFAULT_FORM)
  const [formErrors,    setFormErrors]  = useState<TicketFormErrors>({})
  const [submitting,    setSubmitting]  = useState(false)
  const [notifying,     setNotifying]   = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitError,   setSubmitError]  = useState<TicketSubmitError | null>(null)

  // ── setField — generic typed setter ───────────────────────────────────────

  const setField = useCallback(
    <K extends keyof TicketFormState>(field: K, value: TicketFormState[K]) => {
      setFormState((prev) => ({ ...prev, [field]: value }))
    },
    [],
  )

  // ── submit ────────────────────────────────────────────────────────────────

  const submit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      // 1. Auth guard
      if (!userId) {
        setSubmitError({
          code:    'unauthenticated',
          message: 'You must be logged in to submit a support ticket.',
        })
        return
      }

      // 2. Validate
      const errors = validateTicketForm(form)
      setFormErrors(errors)
      if (!isTicketFormValid(errors)) {return}

      // 3. Guard double-submission
      if (submitting) {return}

      setSubmitting(true)
      setSubmitError(null)

      try {
        const db = createClient()

        await createTicket(db, {
          subject:     form.subject.trim(),
          category:    form.category || 'other',
          priority:    form.priority,
          description: form.description.trim(),
          status:      'open',
          created_at:  new Date().toISOString(),
          user_id:     userId,
        })

        try {
          await notifyAdminsSupportTicket(db, {
            studentLabel: userId,
            subject: form.subject.trim(),
            priority: form.priority,
          })
        } catch (notifyErr) {
          console.error('Ticket submitted but failed to notify admins:', notifyErr)
        }

        // 4. Optimistic: reset form immediately on success
        setFormState(DEFAULT_FORM)
        setFormErrors({})
        setSubmitSuccess(true)

        // Auto-clear success banner after 7 s
        setTimeout(() => setSubmitSuccess(false), 7000)
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to submit. Please try again.'

        // Classify the error for strong typing
        const code: TicketSubmitError['code'] =
          message.toLowerCase().includes('network') ||
          message.toLowerCase().includes('fetch')
            ? 'network'
            : 'unknown'

        setSubmitError({ code, message })
      } finally {
        setSubmitting(false)
      }
    },
    [form, submitting, userId],
  )

  const sendNotificationToAdmin = useCallback(async () => {
    if (!userId || notifying) {
      return
    }

    const errors = validateTicketForm(form)
    setFormErrors(errors)
    if (!isTicketFormValid(errors)) { return }

    setNotifying(true)
    setSubmitError(null)

    try {
      const db = createClient()
      await notifyAdmins(db, {
        type: 'general',
        title: form.subject.trim(),
        message: form.description.trim(),
      })
      setSubmitSuccess(true)
      setTimeout(() => setSubmitSuccess(false), 7000)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to send notification.'
      setSubmitError({ code: 'unknown', message })
    } finally {
      setNotifying(false)
    }
  }, [form, notifying, userId])

  return {
    form,
    formErrors,
    submitting,
    notifying,
    submitSuccess,
    submitError,
    setField,
    submit,
    sendNotificationToAdmin,
  }
}
