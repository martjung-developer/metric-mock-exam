// components/dashboard/admin/settings/DangerZoneSection.tsx
//
// Pure UI — renders the Danger Zone card (sign-out + delete account).
// No Supabase calls, no business logic.

import { AlertTriangle, LogOut } from 'lucide-react'
import { motion } from 'framer-motion'
import { dangerButtonVariants, sectionVariants } from '@/animations/admin/settings/settings'
import s from '@/app/(dashboard)/admin/settings/settings.module.css'
import type { JSX } from 'react'

interface DangerZoneSectionProps {
  onLogout: () => void
}

export function DangerZoneSection({ onLogout }: DangerZoneSectionProps): JSX.Element {
  return (
    <motion.div
      className={s.dangerZone}
      variants={sectionVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <div className={s.dangerZoneHead}>
        <span className={s.dangerZoneIcon}>
          <AlertTriangle size={15} color="var(--danger)" />
        </span>
        <div className={s.dangerZoneTitle}>Danger Zone</div>
      </div>

      {/* Sign out */}
      <div className={s.dangerItem}>
        <div className={s.dangerItemInfo}>
          <p className={s.dangerItemTitle}>Sign out of this account</p>
          <p className={s.dangerItemDesc}>
            You will be redirected to the login page. Any unsaved changes will be lost.
          </p>
        </div>
        <motion.button
          className={s.buttonDanger}
          onClick={onLogout}
          variants={dangerButtonVariants}
          whileHover="hover"
          whileTap="tap"
          initial="rest"
          animate="rest"
        >
          <LogOut size={13} /> Sign out
        </motion.button>
      </div>

      {/* Delete account (disabled) */}
      <div className={s.dangerItem}>
        <div className={s.dangerItemInfo}>
          <p className={s.dangerItemTitle}>Delete account</p>
          <p className={s.dangerItemDesc}>
            Permanently remove your account and all associated data. Contact a system
            administrator to proceed.
          </p>
        </div>
        <motion.button
          className={s.buttonDanger}
          disabled
          style={{ opacity: 0.45, cursor: 'not-allowed', pointerEvents: 'none' }}
          variants={dangerButtonVariants}
          initial="rest"
          animate="rest"
        >
          <AlertTriangle size={13} /> Delete account
        </motion.button>
      </div>
    </motion.div>
  )
}