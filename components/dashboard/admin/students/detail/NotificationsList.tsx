// components/dashboard/admin/students/detail/NotificationsList.tsx
import { Bell, Send } from 'lucide-react'
import type { Notification } from '@/lib/types/admin/students/[examId]/notification.types'
import { formatDate }        from '@/lib/utils/admin/students/format'
import styles from '@/app/(dashboard)/admin/students/[id]/student-detail.module.css'

interface Props {
  notifications: Notification[]
  onOpenModal:   () => void
}

export function NotificationsList({ notifications, onOpenModal }: Props) {
  return (
    <>
      <div className={styles.tableCardHeader}>
        <h3 className={styles.tableCardTitle}>Notifications Sent</h3>
        <button className={styles.btnSmall} onClick={onOpenModal}>
          <Send size={13} /> Send Notification
        </button>
      </div>

      {notifications.length === 0 ? (
        <div className={styles.emptyTab}>
          <Bell size={32} strokeWidth={1.3} color="#cbd5e1" />
          <p className={styles.emptyTabTitle}>No notifications</p>
          <p className={styles.emptyTabText}>No notifications have been sent to this student.</p>
          <button className={styles.emptyTabBtn} onClick={onOpenModal}>
            <Send size={13} /> Send First Notification
          </button>
        </div>
      ) : (
        <div className={styles.notifList}>
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`${styles.notifRow} ${!n.is_read ? styles.notifUnread : ''}`}
            >
              <div
                className={styles.notifDot}
                style={{ background: n.is_read ? '#cbd5e1' : '#3b82f6' }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p className={styles.notifTitle}>{n.title ?? 'Notification'}</p>
                <p className={styles.notifMsg}>{n.message}</p>
              </div>
              <div className={styles.notifMeta}>
                {n.type && <span className={styles.notifType}>{n.type}</span>}
                <span className={styles.notifTime}>{formatDate(n.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}