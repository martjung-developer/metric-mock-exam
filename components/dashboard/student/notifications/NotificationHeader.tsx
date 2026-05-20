// components/dashboard/student/notifications/NotificationHeader.tsx
// Pure UI — title, subtitle, mark-all-read button, settings button.

import { CheckCheck, RefreshCw, Settings } from 'lucide-react'
import { notifAnimations } from '@/animations/notifications/notifications'
import styles from '@/app/(dashboard)/student/notifications/notifications.module.css'
import type { JSX } from 'react'

interface NotificationHeaderProps {
  unreadCount:   number
  refreshing: boolean
  onRefresh: () => void
  onMarkAllRead: () => void
  onOpenSettings: () => void
}

export function NotificationHeader({
  unreadCount,
  refreshing,
  onRefresh,
  onMarkAllRead,
  onOpenSettings,
}: NotificationHeaderProps): JSX.Element {
  return (
    <div className={`${styles.header} ${notifAnimations.fadeSlideIn}`}>
      <div className={styles.headerLeft}>
        <h2 className={styles.title}>Notifications</h2>
        <p className={styles.subtitle}>
          Stay updated with your exams, progress, and reminders
        </p>
      </div>

      <div className={styles.headerActions}>
        <button
          className={styles.btnRefresh}
          onClick={onRefresh}
          title="Refresh notifications"
          disabled={refreshing}
        >
          <RefreshCw size={16} className={refreshing ? styles.spinning : undefined} />
        </button>

        <button
          className={styles.btnMarkAll}
          onClick={onMarkAllRead}
          disabled={unreadCount === 0}
        >
          <CheckCheck size={15} />
          Mark all as read
        </button>

        <button
          className={styles.btnSettings}
          onClick={onOpenSettings}
          title="Notification settings"
        >
          <Settings size={16} />
        </button>
      </div>
    </div>
  )
}
