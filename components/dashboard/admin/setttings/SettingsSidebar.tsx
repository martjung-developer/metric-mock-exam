// components/dashboard/admin/settings/SettingsSidebar.tsx
//
// Pure UI — renders the left-hand nav.
// Active state and click handler come in as props.

import { AlertTriangle, Bell, ChevronRight, Key, User } from 'lucide-react'
import { motion } from 'framer-motion'
import { sectionVariants } from '@/animations/admin/settings/settings'
import type { NavSection } from '@/lib/types/admin/settings/settings.types'
import s from '@/app/(dashboard)/admin/settings/settings.module.css'
import type { JSX } from 'react'

interface NavItem {
  key: NavSection
  label: string
  icon: React.ReactNode
}

const NAV_ITEMS: NavItem[] = [
  { key: 'profile',     label: 'Profile',     icon: <User size={14} />          },
  { key: 'password',    label: 'Password',    icon: <Key size={14} />           },
  { key: 'preferences', label: 'Preferences', icon: <Bell size={14} />          },
  { key: 'danger',      label: 'Danger Zone', icon: <AlertTriangle size={14} /> },
]

interface SettingsSidebarProps {
  activeSection: NavSection
  onNavigate: (section: NavSection) => void
}

export function SettingsSidebar({ activeSection, onNavigate }: SettingsSidebarProps): JSX.Element {
  return (
    <motion.nav className={s.nav} variants={sectionVariants}>
      {NAV_ITEMS.map((item, idx) => (
        <div key={item.key}>
          {idx === NAV_ITEMS.length - 1 && <div className={s.navDivider} />}
          <button
            className={`${s.navItem} ${activeSection === item.key ? s.navItemActive : ''}`}
            onClick={() => onNavigate(item.key)}
          >
            <span className={s.navIcon}>{item.icon}</span>
            {item.label}
            <ChevronRight size={12} style={{ marginLeft: 'auto', opacity: 0.4 }} />
          </button>
        </div>
      ))}
    </motion.nav>
  )
}