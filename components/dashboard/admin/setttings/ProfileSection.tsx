// components/dashboard/admin/settings/ProfileSection.tsx
//
// FIXED:
//  - Passes onConfirmUpload + onDeleteAvatar to the new AvatarUploader
//  - Removes the old onAvatarChange (raw file event) prop — crop/preview is now
//    handled inside AvatarUploader itself; only the confirmed data-URL bubbles up
//  - Everything else (name, email, role, save/cancel) is unchanged

import { Mail, Save, Shield, User } from 'lucide-react'
import { motion }                   from 'framer-motion'
import {
  buttonVariants,
  fieldVariants,
  formVariants,
  sectionVariants,
} from '@/animations/admin/settings/settings'
import { AvatarUploader }   from './AvatarUploader'
import type {
  AvatarUploadState,
  Profile,
  ProfileFormState,
} from '@/lib/types/admin/settings/settings.types'
import s from '@/app/(dashboard)/admin/settings/settings.module.css'
import type { JSX } from 'react'

interface ProfileSectionProps {
  profile:          Profile
  avatarUrl:        string | null
  initials:         string
  form:             ProfileFormState
  avatarUpload:     AvatarUploadState
  onFullNameChange: (v: string) => void
  onCancel:         () => void
  onSave:           () => void
  /** Receives the cropped data-URL after the user confirms the preview */
  onConfirmUpload:  (dataUrl: string) => Promise<void>
  /** Removes the current avatar */
  onDeleteAvatar?:  () => Promise<void>
}

export function ProfileSection({
  profile,
  avatarUrl,
  initials,
  form,
  avatarUpload,
  onFullNameChange,
  onCancel,
  onSave,
  onConfirmUpload,
  onDeleteAvatar,
}: ProfileSectionProps): JSX.Element {
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
          <span className={s.cardTitleIcon}><User size={15} /></span>
          <div>
            <div className={s.cardTitle}>Profile Information</div>
            <div className={s.cardSub}>Update your display name and avatar.</div>
          </div>
        </div>
      </div>

      {/* Avatar upload — now with crop + preview flow */}
      <AvatarUploader
        avatarUrl={avatarUrl}
        initials={initials}
        upload={avatarUpload}
        onConfirmUpload={onConfirmUpload}
        onDeleteAvatar={onDeleteAvatar}
      />

      {/* Form */}
      <motion.div className={s.form} variants={formVariants} initial="hidden" animate="visible">
        <div className={s.formGrid}>

          {/* Full name */}
          <motion.div className={s.fieldGroup} variants={fieldVariants}>
            <label className={`${s.label} ${s.labelRequired}`}>Full Name</label>
            <input
              className={s.input}
              type="text"
              value={form.fullName}
              onChange={(e) => onFullNameChange(e.target.value)}
              placeholder="Your full name"
              autoComplete="name"
            />
          </motion.div>

          {/* Email (read-only) */}
          <motion.div className={s.fieldGroup} variants={fieldVariants}>
            <label className={s.label}>
              <Mail size={11} style={{ marginRight: 4, verticalAlign: 'middle' }} />
              Email Address
            </label>
            <input
              className={`${s.input} ${s.inputReadonly}`}
              type="email"
              value={profile.email ?? ''}
              readOnly
              tabIndex={-1}
            />
            <p className={s.inputHint}>Email is managed by your account provider.</p>
          </motion.div>

          {/* Role (read-only) */}
          <motion.div className={s.fieldGroup} variants={fieldVariants}>
            <label className={s.label}>
              <Shield size={11} style={{ marginRight: 4, verticalAlign: 'middle' }} />
              Role
            </label>
            <div className={s.roleDisplay}>
              <span
                className={`${s.roleDot} ${profile.role === 'admin' ? s.roleDotAdmin : s.roleDotFaculty}`}
              />
              {profile.role === 'admin' ? 'Administrator' : 'Faculty'}
            </div>
            <p className={s.inputHint}>Role is assigned by a system administrator.</p>
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
            disabled={form.saving || !form.fullName.trim()}
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            initial="rest"
            animate="rest"
          >
            {form.saving
              ? <><div className={s.spinner} /> Saving…</>
              : <><Save size={13} /> Save changes</>
            }
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}