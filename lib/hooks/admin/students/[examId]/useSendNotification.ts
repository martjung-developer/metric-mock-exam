// lib/hooks/admin/students/[examId]/useSendNotification.ts
import { useState, useCallback } from 'react'
import { createClient }     from '@/lib/supabase/client'
import { sendNotification } from '@/lib/services/admin/students/[examId]/notification.service'
import type { Notification, NotifyForm, NotifyFormErrors } from '@/lib/types/admin/students/[examId]/notification.types'

interface UseSendNotificationOptions {
  studentId:            string
  onSent:               (optimistic: Notification) => void
  onRefreshAfterSend:   () => Promise<void>
}

export interface UseSendNotificationReturn {
  isOpen:     boolean
  form:       NotifyForm
  errors:     NotifyFormErrors
  sending:    boolean
  open:       () => void
  close:      () => void
  setField:   <K extends keyof NotifyForm>(key: K, value: NotifyForm[K]) => void
  submit:     () => Promise<void>
}

const BLANK_FORM: NotifyForm = { title: '', message: '', type: 'info' }

function validate(form: NotifyForm): NotifyFormErrors {
  const errs: NotifyFormErrors = {}
  if (!form.title.trim())   { errs.title   = 'Title is required.' }
  if (!form.message.trim()) { errs.message = 'Message is required.' }
  return errs
}

export function useSendNotification({
  studentId,
  onSent,
  onRefreshAfterSend,
}: UseSendNotificationOptions): UseSendNotificationReturn {
  const supabase = createClient()

  const [isOpen,   setIsOpen]   = useState(false)
  const [form,     setForm]     = useState<NotifyForm>(BLANK_FORM)
  const [errors,   setErrors]   = useState<NotifyFormErrors>({})
  const [sending,  setSending]  = useState(false)

  const open  = useCallback(() => { setForm(BLANK_FORM); setErrors({}); setIsOpen(true) }, [])
  const close = useCallback(() => { setIsOpen(false); setErrors({}) }, [])

  function setField<K extends keyof NotifyForm>(key: K, value: NotifyForm[K]): void {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const submit = useCallback(async () => {
    const errs = validate(form)
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    setSending(true)

    // ── Optimistic update ──────────────────────────────────────────────────
    const optimistic: Notification = {
      id:         `optimistic-${Date.now()}`,
      title:      form.title.trim(),
      message:    form.message.trim(),
      type:       form.type,
      is_read:    false,
      created_at: new Date().toISOString(),
    }
    onSent(optimistic)
    close()

    try {
      await sendNotification(supabase, {
        user_id: studentId,
        title:   form.title.trim(),
        message: form.message.trim(),
        type:    form.type,
        is_read: false,
      })
      // Replace optimistic entry with server truth
      await onRefreshAfterSend()
    } catch (err) {
      console.error('Failed to send notification:', err)
      // In a production app you'd roll back the optimistic entry here
    } finally {
      setSending(false)
    }
  }, [form, studentId, supabase, onSent, close, onRefreshAfterSend])

  return { isOpen, form, errors, sending, open, close, setField, submit }
}