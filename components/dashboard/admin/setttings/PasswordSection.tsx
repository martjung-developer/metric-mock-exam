// components/dashboard/admin/settings/PasswordSection.tsx
//
// Pure UI — renders the Change Password card.
// No Supabase calls, no business logic.

import { Eye, EyeOff, Key, XCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import {
  buttonVariants,
  fieldVariants,
  formVariants,
  sectionVariants,
} from '@/animations/admin/settings/settings'
import { PasswordStrengthBar } from './PasswordStrengthBar'
import type { PasswordFormState } from '@/lib/types/admin/settings/settings.types'
import s from '@/app/(dashboard)/admin/settings/settings.module.css'
import type { JSX } from 'react'

interface PasswordSectionProps {
  form: PasswordFormState
  onCurrentPwChange: (v: string) => void
  onNewPwChange: (v: string) => void
  onConfirmPwChange: (v: string) => void
  onToggleShowCurrent: () => void
  onToggleShowNew: () => void
  onToggleShowConfirm: () => void
  onCancel: () => void
  onSave: () => void
}

export function PasswordSection({
  form,
  onCurrentPwChange,
  onNewPwChange,
  onConfirmPwChange,
  onToggleShowCurrent,
  onToggleShowNew,
  onToggleShowConfirm,
  onCancel,
  onSave,
}: PasswordSectionProps): JSX.Element {
  const eyeButtonStyle: React.CSSProperties = {
    position:  'absolute',
    right:     '0.75rem',
    top:       '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border:    'none',
    cursor:    'pointer',
    color:     'var(--text-muted)',
    display:   'flex',
    padding:   0,
  }

  return (
    <motion.div
      className={s.card}
      variants={sectionVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Card header */}
      <div className={s.cardHead}>
        <div className={s.cardTitleRow}>
          <span className={s.cardTitleIcon}><Key size={15} /></span>
          <div>
            <div className={s.cardTitle}>Change Password</div>
            <div className={s.cardSub}>Use a strong, unique password you don&apos;t use elsewhere.</div>
          </div>
        </div>
      </div>

      <motion.div className={s.form} variants={formVariants} initial="hidden" animate="visible">
        <div style={{ maxWidth: 420, display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Current password */}
          <motion.div className={s.fieldGroup} variants={fieldVariants} style={{ marginBottom: 0 }}>
            <label className={`${s.label} ${s.labelRequired}`}>Current Password</label>
            <div style={{ position: 'relative' }}>
              <input
                className={s.input}
                type={form.showCurrent ? 'text' : 'password'}
                value={form.currentPw}
                onChange={(e) => onCurrentPwChange(e.target.value)}
                placeholder="Enter current password"
                autoComplete="current-password"
                style={{ paddingRight: '2.5rem' }}
              />
              <button type="button" onClick={onToggleShowCurrent} style={eyeButtonStyle} tabIndex={-1}>
                {form.showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </motion.div>

          {/* New password */}
          <motion.div className={s.fieldGroup} variants={fieldVariants} style={{ marginBottom: 0 }}>
            <label className={`${s.label} ${s.labelRequired}`}>New Password</label>
            <div style={{ position: 'relative' }}>
              <input
                className={s.input}
                type={form.showNew ? 'text' : 'password'}
                value={form.newPw}
                onChange={(e) => onNewPwChange(e.target.value)}
                placeholder="Min. 8 characters"
                autoComplete="new-password"
                style={{ paddingRight: '2.5rem' }}
              />
              <button type="button" onClick={onToggleShowNew} style={eyeButtonStyle} tabIndex={-1}>
                {form.showNew ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {form.newPw && form.strength && (
              <PasswordStrengthBar strength={form.strength} />
            )}
          </motion.div>

          {/* Confirm password */}
          <motion.div className={s.fieldGroup} variants={fieldVariants} style={{ marginBottom: 0 }}>
            <label className={`${s.label} ${s.labelRequired}`}>Confirm New Password</label>
            <div style={{ position: 'relative' }}>
              <input
                className={`${s.input} ${form.confirmPw && form.confirmPw !== form.newPw ? s.inputError : ''}`}
                type={form.showConfirm ? 'text' : 'password'}
                value={form.confirmPw}
                onChange={(e) => onConfirmPwChange(e.target.value)}
                placeholder="Repeat new password"
                autoComplete="new-password"
                style={{ paddingRight: '2.5rem' }}
              />
              <button type="button" onClick={onToggleShowConfirm} style={eyeButtonStyle} tabIndex={-1}>
                {form.showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {form.confirmPw && form.confirmPw !== form.newPw && (
              <p className={s.errorMsg}><XCircle size={11} /> Passwords do not match.</p>
            )}
          </motion.div>

        </div>

        {/* Actions */}
        <div className={s.formActions}>
          <motion.button
            className={s.buttonSecondary}
            onClick={onCancel}
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            initial="rest"
            animate="rest"
          >
            Cancel
          </motion.button>

          <motion.button
            className={s.button}
            onClick={onSave}
            disabled={form.saving || !form.currentPw || !form.newPw || !form.confirmPw}
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            initial="rest"
            animate="rest"
          >
            {form.saving
              ? <><div className={s.spinner} /> Updating…</>
              : <><Key size={13} /> Update password</>
            }
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}