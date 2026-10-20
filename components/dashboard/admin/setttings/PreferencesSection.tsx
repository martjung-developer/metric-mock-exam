// components/dashboard/admin/settings/PreferencesSection.tsx
//
// Pure UI — renders the Preferences card (dark mode + notification toggles).
// No Supabase calls, no business logic.

import { Bell, Mail, Moon, Save } from 'lucide-react'
import { motion } from 'framer-motion'
import { buttonVariants, sectionVariants } from '@/animations/admin/settings/settings'
import type { PreferencesState } from '@/lib/types/admin/settings/settings.types'
import s from '@/app/(dashboard)/admin/settings/settings.module.css'
import type { JSX } from 'react'

interface ToggleRowConfig {
  label: string
  desc: string
  icon: React.ReactNode
  value: boolean
  toggle: () => void
}

interface PreferencesSectionProps {
  preferences: PreferencesState
  onToggleDarkMode: () => void
  onToggleNotif: () => void
  onToggleEmailNotif: () => void
  onSave: () => void
}

export function PreferencesSection({
  preferences,
  onToggleDarkMode,
  onToggleNotif,
  onToggleEmailNotif,
  onSave,
}: PreferencesSectionProps): JSX.Element {
  const rows: ToggleRowConfig[] = [
    {
      label:  'Dark Mode',
      desc:   'Switch the interface to a dark colour scheme.',
      icon:   <Moon size={13} />,
      value:  preferences.darkMode,
      toggle: onToggleDarkMode,
    },
    {
      label:  'Push Notifications',
      desc:   'Receive in-app alerts for submissions and deadlines.',
      icon:   <Bell size={13} />,
      value:  preferences.notifEnabled,
      toggle: onToggleNotif,
    },
    {
      label:  'Email Notifications',
      desc:   'Get email updates when students submit exams.',
      icon:   <Mail size={13} />,
      value:  preferences.emailNotif,
      toggle: onToggleEmailNotif,
    },
  ]

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
          <span className={s.cardTitleIcon}><Bell size={15} /></span>
          <div>
            <div className={s.cardTitle}>Preferences</div>
            <div className={s.cardSub}>Appearance and notification settings.</div>
          </div>
        </div>
      </div>

      {rows.map((item) => (
        <div key={item.label} className={s.toggleRow}>
          <div className={s.toggleLeft}>
            <p className={s.toggleTitle}>{item.icon}&nbsp;{item.label}</p>
            <p className={s.toggleDesc}>{item.desc}</p>
          </div>
          <button
            className={`${s.toggle} ${item.value ? s.toggleOn : ''}`}
            onClick={item.toggle}
            aria-label={`Toggle ${item.label}`}
            aria-checked={item.value}
            role="switch"
          >
            <span className={s.toggleKnob} />
          </button>
        </div>
      ))}

      <div className={s.formActions}>
        <motion.button
          className={s.button}
          onClick={onSave}
          variants={buttonVariants}
          whileHover="hover"
          whileTap="tap"
          initial="rest"
          animate="rest"
        >
          <Save size={13} /> Save preferences
        </motion.button>
      </div>
    </motion.div>
  )
}