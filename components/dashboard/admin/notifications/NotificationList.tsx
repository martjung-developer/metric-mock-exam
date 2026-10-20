// components/dashboard/admin/notifications/NotificationList.tsx
// ─────────────────────────────────────────────────────────────────────────────
// CHANGED (surgical only):
//  1. NotificationItem — added "Preview" button (Eye icon)
//  2. NotificationItem — "Mark as read" button now toggles read ↔ unread
//  3. NotificationList — added onPreview + onToggleRead props
//  All other code is identical to the original.
// ─────────────────────────────────────────────────────────────────────────────

import { Bell, CheckCheck, Clock, Eye, RotateCcw, Trash2 } from "lucide-react"
import type { Notification } from "@/lib/types/admin/notifications/notifications.types"
import styles from "@/app/(dashboard)/admin/notifications/notifications.module.css"

// ─────────────────────────────────────────────────────────────────────────────
// Helpers  (unchanged)
// ─────────────────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-PH", {
    month:   "short",
    day:     "numeric",
    year:    "numeric",
    hour:    "2-digit",
    minute:  "2-digit",
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// TypeBadge  (unchanged — re-exported so modal can import it)
// ─────────────────────────────────────────────────────────────────────────────

interface TypeBadgeProps { type: string | null }

export function TypeBadge({ type }: TypeBadgeProps) {
  const t   = (type ?? "general") as "exam" | "result" | "general"
  const cls =
    t === "exam"    ? styles.typeBadgeExam    :
    t === "result"  ? styles.typeBadgeResult  :
    styles.typeBadgeGeneral
  return <span className={`${styles.typeBadge} ${cls}`}>{t}</span>
}

// ─────────────────────────────────────────────────────────────────────────────
// NotificationItem  — CHANGED: preview button + toggle read/unread
// ─────────────────────────────────────────────────────────────────────────────

interface NotificationItemProps {
  notification:  Notification
  onMarkRead:    (id: string) => void       // kept for back-compat (page passes markAsRead)
  onToggleRead:  (id: string, isRead: boolean) => void   // NEW
  onDelete:      (id: string) => void
  onPreview:     (notification: Notification) => void    // NEW
}

function getDisplayMessage(message: string | null | undefined): string {
  return (message ?? '—')
    .replace(/\[(?:[a-z_]*id|id):[^\]]*\]/gi, '')
    .replace(/\b[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

export function NotificationItem({
  notification: notif,
  onToggleRead,
  onDelete,
  onPreview,
}: NotificationItemProps) {
  return (
    <div
      className={`${styles.notifItem} ${!notif.is_read ? styles.notifItemUnread : ""}`}
    >
      <div
        className={`${styles.notifDot} ${
          notif.is_read ? styles.notifDotRead : styles.notifDotUnread
        }`}
      />

      <div className={styles.notifContent}>
        <div className={styles.notifTop}>
          <span
            className={`${styles.notifTitle} ${notif.is_read ? styles.notifTitleRead : ""}`}
          >
            {notif.title ?? "—"}
          </span>
          <TypeBadge type={notif.type} />
          {!notif.is_read && <span className={styles.newTag}>New</span>}
        </div>
        <p className={styles.notifMessage}>{getDisplayMessage(notif.message)}</p>
        <span className={styles.notifTime}>
          <Clock size={11} />
          {formatDate(notif.created_at)}
        </span>
      </div>

      {/* Actions — preview + toggle read + delete */}
      <div className={styles.notifActions}>
        {/* Preview — always visible */}
        <button
          className={styles.btnGhost}
          onClick={() => onPreview(notif)}
          title="Preview"
        >
          <Eye size={13} />
        </button>

        {/* Toggle read ↔ unread */}
        <button
          className={styles.btnGhost}
          onClick={() => onToggleRead(notif.id, notif.is_read)}
          title={notif.is_read ? "Mark as unread" : "Mark as read"}
        >
          {notif.is_read
            ? <RotateCcw size={13} />
            : <CheckCheck size={13} />
          }
        </button>

        {/* Delete */}
        <button
          className={styles.btnDanger}
          onClick={() => onDelete(notif.id)}
          title="Delete"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// EmptyState  (unchanged)
// ─────────────────────────────────────────────────────────────────────────────

export function EmptyState() {
  return (
    <div className={styles.empty}>
      <div className={styles.emptyIcon}>
        <Bell size={20} color="var(--notif-text-muted)" />
      </div>
      <p className={styles.emptyTitle}>No notifications yet</p>
      <p className={styles.emptySub}>
        Use the Send Notification button above to reach your students.
      </p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SkeletonRow
// ─────────────────────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div className={styles.skeletonItem}>
      <div
        className={styles.skeleton}
        style={{ width: 7, height: 7, borderRadius: "50%", marginTop: 5, flexShrink: 0 }}
      />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 7 }}>
        <div className={styles.skeleton} style={{ width: "40%", height: 12 }} />
        <div className={styles.skeleton} style={{ width: "70%", height: 11 }} />
        <div className={styles.skeleton} style={{ width: "22%", height: 10 }} />
      </div>
    </div>
  )
}

export function SkeletonLoader() {
  return (
    <div className={styles.notifList}>
      {[1, 2, 3, 4].map((i) => <SkeletonRow key={i} />)}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// NotificationList  
// ─────────────────────────────────────────────────────────────────────────────

interface NotificationListProps {
  notifications: Notification[]
  loading:       boolean
  onMarkRead:    (id: string) => void
  onToggleRead:  (id: string, isRead: boolean) => void   // NEW
  onDelete:      (id: string) => void
  onPreview:     (notification: Notification) => void    // NEW
}

export function NotificationList({
  notifications,
  loading,
  onMarkRead,
  onToggleRead,
  onDelete,
  onPreview,
}: NotificationListProps) {
  return (
    <div className={styles.card}>
      <div className={styles.cardHead}>
        <span className={styles.cardTitle}>
          <span className={styles.cardTitleIcon}>
            <Bell size={14} color="var(--notif-text-sub)" />
          </span>
          All Notifications
        </span>
        <span className={styles.cardMeta}>
          {notifications.length} item{notifications.length !== 1 ? "s" : ""}
        </span>
      </div>

      {loading ? (
        <SkeletonLoader />
      ) : notifications.length === 0 ? (
        <EmptyState />
      ) : (
        <div className={styles.notifList}>
          {notifications.map((notif) => (
            <NotificationItem
              key={notif.id}
              notification={notif}
              onMarkRead={onMarkRead}
              onToggleRead={onToggleRead}
              onDelete={onDelete}
              onPreview={onPreview}
            />
          ))}
        </div>
      )}
    </div>
  )
}
