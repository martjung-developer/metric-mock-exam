// components/dashboard/admin/settings/SettingsHeader.tsx
//
// Pure UI — renders the page title block.

import { motion } from 'framer-motion'
import { RefreshCw } from 'lucide-react'
import { sectionVariants } from '@/animations/admin/settings/settings'
import s from '@/app/(dashboard)/admin/settings/settings.module.css'
import type { JSX } from 'react'


interface SettingsHeaderProps {
  refreshing: boolean
  onRefresh: () => void
}

export function SettingsHeader({ refreshing, onRefresh }: SettingsHeaderProps): JSX.Element {
  return (
    <motion.div className={s.header} variants={sectionVariants}>
      <div className={s.headerLeft}>
        <h1 className={s.pageTitle}>Settings</h1>
        <p className={s.pageSub}>Manage your profile, security, and preferences.</p>
      </div>
      <button
        type="button"
        className={s.buttonSecondary}
        onClick={onRefresh}
        disabled={refreshing}
        aria-label="Refresh settings data"
      >
        <RefreshCw size={14} className={refreshing ? s.spinning : ''} />
        Refresh
      </button>
    </motion.div>
  )
}
