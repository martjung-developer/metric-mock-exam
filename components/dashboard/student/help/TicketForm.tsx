// components/dashboard/student/help/TicketForm.tsx
// Pure UI — renders the support ticket form. No Supabase, no business logic.

import React from 'react'
import { Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import type {
  TicketFormState,
  TicketFormErrors,
  TicketSubmitError,
} from '@/lib/types/student/help/ticket.types'
import styles from '@/app/(dashboard)/student/help/help.module.css'

const TICKET_CATEGORIES = [
  { value: 'taking',    label: 'Taking an Exam' },
  { value: 'results',   label: 'Results or Scores' },
  { value: 'reviewers', label: 'Reviewer Access' },
  { value: 'timing',    label: 'Timer or Session Issue' },
  { value: 'programs',  label: 'Degree Program Access' },
  { value: 'account',   label: 'Account or Login' },
  { value: 'technical', label: 'Technical / Bug Report' },
  { value: 'other',     label: 'Other' },
]

interface TicketFormProps {
  form:          TicketFormState
  formErrors:    TicketFormErrors
  submitting:    boolean
  submitSuccess: boolean
  submitError:   TicketSubmitError | null
  setField:      <K extends keyof TicketFormState>(field: K, value: TicketFormState[K]) => void
  onSubmit:      (e: React.FormEvent) => Promise<void>
}

export default function TicketForm({
  form,
  formErrors,
  submitting,
  submitSuccess,
  submitError,
  setField,
  onSubmit,
}: TicketFormProps) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHead}>
        <Send size={16} strokeWidth={2} className={styles.sectionIcon} />
        <h2 className={styles.sectionTitle}>Submit a Support Ticket</h2>
      </div>

      <div className={styles.ticketBox}>
        <p className={styles.ticketLead}>
          Can&apos;t find your answer? Describe your issue and our team will get back to you
          within 1–2 business days.
        </p>

        <form onSubmit={onSubmit} className={styles.ticketForm} noValidate>
          <div className={styles.formRow}>

            {/* Subject */}
            <div className={styles.formField}>
              <label className={styles.formLabel}>Subject *</label>
              <input
                className={styles.formInput}
                type="text"
                placeholder="e.g. Exam timer did not stop after submission"
                value={form.subject}
                onChange={(e) => setField('subject', e.target.value)}
                required
              />
              {formErrors.subject && (
                <span style={{ fontSize: '0.72rem', color: '#dc2626', marginTop: 2 }}>
                  {formErrors.subject}
                </span>
              )}
            </div>

            {/* Topic / category */}
            <div className={styles.formField}>
              <label className={styles.formLabel}>Topic</label>
              <select
                className={styles.formSelect}
                value={form.category}
                onChange={(e) => setField('category', e.target.value)}
              >
                <option value="">Select a topic</option>
                {TICKET_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div className={styles.formField}>
              <label className={styles.formLabel}>Priority</label>
              <select
                className={styles.formSelect}
                value={form.priority}
                onChange={(e) => setField('priority', e.target.value)}
              >
                <option value="low">Low — Not urgent</option>
                <option value="normal">Normal — Within a few days</option>
                <option value="high">High — Affects my exam attempt</option>
                <option value="urgent">Urgent — Exam in progress / score error</option>
              </select>
            </div>

          </div>

          {/* Description */}
          <div className={styles.formField} style={{ marginTop: '0.875rem' }}>
            <label className={styles.formLabel}>Description *</label>
            <textarea
              className={styles.formTextarea}
              placeholder="Describe the issue in detail. Include your degree program, the exam name, time of occurrence, and any error messages you saw."
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
              required
            />
            {formErrors.description && (
              <span style={{ fontSize: '0.72rem', color: '#dc2626', marginTop: 2 }}>
                {formErrors.description}
              </span>
            )}
          </div>

          {/* Error banner */}
          {submitError && (
            <div className={`${styles.banner} ${styles.bannerError}`}>
              <AlertCircle size={16} strokeWidth={2} />
              {submitError.message}
            </div>
          )}

          {/* Success banner */}
          {submitSuccess && (
            <div className={`${styles.banner} ${styles.bannerSuccess}`}>
              <CheckCircle size={16} strokeWidth={2} />
              Ticket submitted! We&apos;ll be in touch soon.
            </div>
          )}

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={submitting}
          >
            {submitting ? (
              <><Loader2 size={15} className={styles.spinner} /> Submitting…</>
            ) : (
              <><Send size={15} strokeWidth={2} /> Submit Ticket</>
            )}
          </button>
        </form>
      </div>
    </section>
  )
}
