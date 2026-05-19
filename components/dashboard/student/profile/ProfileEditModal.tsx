/**
 * components/dashboard/student/profile/ProfileEditModal.tsx
 *
 * Modal for editing the student's profile (first name, last name).
 * Avatar upload is handled separately via AvatarUploader.
 *
 * Props:
 *  open         — controls visibility
 *  onClose      — called when modal should close (backdrop click, Cancel, success)
 *  userId       — Supabase auth user ID
 *  initialName  — current full_name from profiles table
 *  onSaved      — called with the new full_name after a successful save
 */

'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, Save, Loader2 } from 'lucide-react'
import { updateProfile } from '@/lib/services/student/profile/profile.service'
import styles from './css/ProfileEditModal.module.css'

interface ProfileEditModalProps {
  open:        boolean
  onClose:     () => void
  userId:      string
  initialName: string | null
  onSaved:     (newFullName: string) => void
}

function splitName(fullName: string | null): { first: string; last: string } {
  if (!fullName) {return { first: '', last: '' }}
  const parts = fullName.trim().split(/\s+/)
  const first  = parts[0] ?? ''
  const last   = parts.slice(1).join(' ')
  return { first, last }
}

export function ProfileEditModal({
  open,
  onClose,
  userId,
  initialName,
  onSaved,
}: ProfileEditModalProps) {
  const supabase = useMemo(() => createClient(), [])

  const initial = useMemo(() => splitName(initialName), [initialName])

  const [firstName, setFirstName] = useState(initial.first)
  const [lastName,  setLastName]  = useState(initial.last)
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [success,   setSuccess]   = useState(false)

  // Reset form whenever modal opens
  useEffect(() => {
    if (open) {
      const names = splitName(initialName)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFirstName(names.first)
      setLastName(names.last)
      setSaving(false)
      setError(null)
      setSuccess(false)
    }
  }, [open, initialName])

  // Close on Escape
  useEffect(() => {
    if (!open) {return}
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {onClose()}
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  const fullName   = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ')
  const isValid    = firstName.trim().length > 0
  const hasChanged = fullName !== (initialName ?? '')

  const handleSave = useCallback(async () => {
    if (!isValid || saving) {return}
    setSaving(true)
    setError(null)

    const result = await updateProfile(supabase, userId, { full_name: fullName })

    setSaving(false)

    if (result.error) {
      setError(result.error)
      return
    }

    setSuccess(true)
    onSaved(fullName)

    setTimeout(() => {
      onClose()
    }, 800)
  }, [supabase, userId, fullName, isValid, saving, onSaved, onClose])

  if (!open) {return null}

  return (
    // Backdrop
    <div
      className={styles.backdrop}
      onClick={(e) => { if (e.target === e.currentTarget) {onClose()} }}
      role="dialog"
      aria-modal="true"
      aria-label="Edit profile"
    >
      <div className={styles.modal}>

        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>Edit Profile</h2>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close"
            disabled={saving}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          <div className={styles.fieldRow}>
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="edit-first-name">
                First name <span className={styles.required}>*</span>
              </label>
              <input
                id="edit-first-name"
                className={styles.input}
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
                autoComplete="given-name"
                disabled={saving}
                autoFocus
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="edit-last-name">
                Last name
              </label>
              <input
                id="edit-last-name"
                className={styles.input}
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
                autoComplete="family-name"
                disabled={saving}
              />
            </div>
          </div>

          {/* Preview */}
          {fullName && (
            <p className={styles.preview}>
              Display name: <strong>{fullName}</strong>
            </p>
          )}

          {/* Error */}
          {error && (
            <p className={styles.errorMsg} role="alert">{error}</p>
          )}

          {/* Success */}
          {success && (
            <p className={styles.successMsg} role="status">Profile updated!</p>
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button
            className={styles.btnCancel}
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>

          <button
            className={styles.btnSave}
            onClick={handleSave}
            disabled={!isValid || !hasChanged || saving}
          >
            {saving ? (
              <><Loader2 size={14} className={styles.spinner} /> Saving…</>
            ) : success ? (
              'Saved!'
            ) : (
              <><Save size={14} /> Save changes</>
            )}
          </button>
        </div>

      </div>
    </div>
  )
}
