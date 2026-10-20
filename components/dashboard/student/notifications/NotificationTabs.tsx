// components/dashboard/student/notifications/NotificationTabs.tsx
// Pure UI — tab bar with per-tab unread badge counts.

import { notifAnimations } from '@/animations/notifications/notifications'
import { tabBadgeCount }    from '@/lib/utils/student/notifications/helpers'
import type {
  FilterTab,
  Notification,
} from '@/lib/types/student/notifications/notifications.types'
import styles from '@/app/(dashboard)/student/notifications/notifications.module.css'
import type { JSX } from 'react'

// ── Tab definitions (stable — defined outside component) ──────────────────

interface TabDef {
  key:   FilterTab
  label: string
}

const TABS: ReadonlyArray<TabDef> = [
  { key: 'all',       label: 'All'       },
  { key: 'unread',    label: 'Unread'    },
  { key: 'exams',     label: 'Exams'     },
  { key: 'progress',  label: 'Progress'  },
  { key: 'reminders', label: 'Reminders' },
  { key: 'system',    label: 'System'    },
]

interface NotificationTabsProps {
  activeTab:     FilterTab
  notifications: Notification[]
  unreadCount:   number
  onTabChange:   (tab: FilterTab) => void
}

export function NotificationTabs({
  activeTab,
  notifications,
  unreadCount,
  onTabChange,
}: NotificationTabsProps): JSX.Element {
  return (
    <div className={`${styles.tabs} ${notifAnimations.fadeSlideIn}`}>
      {TABS.map((tab) => {
        const badge = tabBadgeCount(notifications, tab.key, unreadCount)

        return (
          <button
            key={tab.key}
            className={`${styles.tab} ${activeTab === tab.key ? styles.tabActive : ''}`}
            onClick={() => onTabChange(tab.key)}
          >
            {tab.label}
            {badge > 0 && (
              <span className={styles.tabBadge}>{badge}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}