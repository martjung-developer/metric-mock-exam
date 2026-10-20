// components/dashboard/student/notifications/NotificationList.tsx
// Pure UI — renders grouped notification rows or empty state.

import { NotificationItem }       from './NotificationItem'
import { NotificationEmptyState } from './NotificationEmptyState'
import { groupNotifications }     from '@/lib/utils/student/notifications/helpers'
import type {
  FilterTab,
  Notification,
} from '@/lib/types/student/notifications/notifications.types'
import styles from '@/app/(dashboard)/student/notifications/notifications.module.css'
import type { JSX } from 'react'

interface NotificationListProps {
  notifications:  Notification[]
  activeTab:      FilterTab
  onToggleRead:   (id: string, currentState: boolean) => void
  onDelete:       (id: string) => void
}

export function NotificationList({
  notifications,
  activeTab,
  onToggleRead,
  onDelete,
}: NotificationListProps): JSX.Element {
  if (notifications.length === 0) {
    return <NotificationEmptyState activeTab={activeTab} />
  }

  const groups = groupNotifications(notifications)

  return (
    <div className={styles.content}>
      {groups.map((group) => (
        <div key={group.label} className={styles.group}>
          <p className={styles.groupLabel}>{group.label}</p>
          <div className={styles.groupList}>
            {group.items.map((n, i) => (
              <NotificationItem
                key={n.id}
                notification={n}
                index={i}
                onToggleRead={onToggleRead}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}