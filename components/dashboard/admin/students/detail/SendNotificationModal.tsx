// components/dashboard/admin/students/detail/SendNotificationModal.tsx
import { Send } from 'lucide-react'
import type { NotifyForm, NotifyFormErrors } from '@/lib/types/admin/students/[examId]/notification.types'
import styles from '@/app/(dashboard)/admin/students/[id]/student-detail.module.css'

interface Props {
  studentName:  string | null
  form:         NotifyForm
  errors:       NotifyFormErrors
  sending:      boolean
  onField:      <K extends keyof NotifyForm>(key: K, value: NotifyForm[K]) => void
  onSubmit:     () => Promise<void>
  onClose:      () => void
}

export function SendNotificationModal({
  studentName, form, errors, sending, onField, onSubmit, onClose,
}: Props) {
  return (
    <div
      className={styles.overlay}
      onClick={(e) => { if (e.target === e.currentTarget) { onClose() } }}
    >
      <div className={styles.modal}>
        <h2 className={styles.modalTitle}>Send Notification</h2>
        <p className={styles.modalSub}>
          This will appear in {studentName ?? 'the student'}&apos;s notification inbox.
        </p>

        {/* Title */}
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>
            Title <span className={styles.req}>*</span>
          </label>
          <input
            className={styles.formInput}
            placeholder="Notification title"
            value={form.title}
            onChange={(e) => onField('title', e.target.value)}
          />
          {errors.title && (
            <p style={{ color: '#dc2626', fontSize: '0.75rem', margin: '2px 0 0' }}>
              {errors.title}
            </p>
          )}
        </div>

        {/* Message */}
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>
            Message <span className={styles.req}>*</span>
          </label>
          <textarea
            className={styles.formTextarea}
            rows={3}
            placeholder="Write your message…"
            value={form.message}
            onChange={(e) => onField('message', e.target.value)}
          />
          {errors.message && (
            <p style={{ color: '#dc2626', fontSize: '0.75rem', margin: '2px 0 0' }}>
              {errors.message}
            </p>
          )}
        </div>

        {/* Type */}
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Type</label>
          <select
            className={styles.formSelect}
            value={form.type}
            onChange={(e) => onField('type', e.target.value)}
          >
            <option value="info">Info</option>
            <option value="success">Success</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
          </select>
        </div>

        <div className={styles.modalActions}>
          <button className={styles.btnModalCancel} onClick={onClose}>
            Cancel
          </button>
          <button
            className={styles.btnModalPrimary}
            onClick={() => { void onSubmit() }}
            disabled={sending || !form.title.trim() || !form.message.trim()}
          >
            <Send size={13} />
            {sending ? 'Sending…' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  )
}