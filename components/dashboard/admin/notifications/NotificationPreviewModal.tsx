// components/dashboard/admin/notifications/NotificationPreviewModal.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Pure UI — preview modal for a single notification.
// No Supabase, no business logic, no state.
// ─────────────────────────────────────────────────────────────────────────────

import { X, Clock, CheckCheck, RotateCcw, Trash2 } from "lucide-react"
import type { Notification } from "@/lib/types/admin/notifications/notifications.types"
import { TypeBadge } from "./NotificationList"
import styles from "@/app/(dashboard)/admin/notifications/notifications.module.css"

interface Props {
  notification: Notification
  onClose:      () => void
  onToggleRead: (id: string, isRead: boolean) => void
  onDelete:     (id: string) => void
}

function formatDateLong(iso: string): string {
  return new Date(iso).toLocaleString("en-PH", {
    weekday: "long",
    year:    "numeric",
    month:   "long",
    day:     "numeric",
    hour:    "2-digit",
    minute:  "2-digit",
  })
}

export function NotificationPreviewModal({
  notification: notif,
  onClose,
  onToggleRead,
  onDelete,
}: Props) {
  function handleDelete() {
    onDelete(notif.id)
    onClose()
  }

  return (
    /* Backdrop */
    <div
      className={styles.modalBackdrop}
      onClick={(e) => { if (e.target === e.currentTarget) {onClose()} }}
    >
      <div className={styles.modal}>

        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderLeft}>
            <TypeBadge type={notif.type} />
            {!notif.is_read && <span className={styles.newTag}>Unread</span>}
          </div>
          <button
            className={styles.btnGhost}
            onClick={onClose}
            aria-label="Close preview"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className={styles.modalBody}>
          <h2 className={styles.modalTitle}>{notif.title ?? "—"}</h2>
          <p className={styles.modalMessage}>{notif.message ?? "—"}</p>
          <span className={styles.notifTime} style={{ marginTop: "0.75rem", display: "flex" }}>
            <Clock size={12} />
            {formatDateLong(notif.created_at)}
          </span>
        </div>

        {/* Footer actions */}
        <div className={styles.modalFooter}>
          <button
            className={styles.btnGhost}
            onClick={() => onToggleRead(notif.id, notif.is_read)}
            title={notif.is_read ? "Mark as unread" : "Mark as read"}
          >
            {notif.is_read
              ? <><RotateCcw size={13} /> Mark unread</>
              : <><CheckCheck size={13} /> Mark read</>
            }
          </button>

          <button
            className={styles.btnDanger}
            onClick={handleDelete}
            title="Delete notification"
          >
            <Trash2 size={13} /> Delete
          </button>
        </div>

      </div>
    </div>
  )
}