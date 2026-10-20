// components/dashboard/admin/notifications/NotificationsHeader.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Pure UI component – header bar with title, unread pill, and action buttons.
// NO data fetching. NO business logic. Fully typed props only.
// ─────────────────────────────────────────────────────────────────────────────

import { Bell, Send, CheckCheck } from "lucide-react";
import styles from "@/app/(dashboard)/admin/notifications/notifications.module.css";

interface NotificationsHeaderProps {
  totalCount: number;
  unreadCount: number;
  showForm: boolean;
  onToggleForm: () => void;
  onMarkAllRead: () => void;
}

export function NotificationsHeader({
  totalCount,
  unreadCount,
  showForm,
  onToggleForm,
  onMarkAllRead,
}: NotificationsHeaderProps) {
  return (
    <div className={styles.header}>
      <div className={styles.headerLeft}>
        <div className={styles.headerIcon}>
          <Bell size={20} color="#fff" />
        </div>
        <div>
          <h1 className={styles.heading}>Notifications</h1>
          <p className={styles.headingSub}>
            {unreadCount > 0 ? `${unreadCount} unread · ` : "All caught up · "}
            {totalCount} total
          </p>
        </div>
      </div>

      <div className={styles.headerActions}>
        {unreadCount > 0 && (
          <>
            <span className={styles.unreadPill}>
              <span className={styles.unreadDot} />
              {unreadCount} unread
            </span>
            <button className={styles.btnSecondary} onClick={onMarkAllRead}>
              <CheckCheck size={14} /> Mark all read
            </button>
          </>
        )}
        <button className={styles.btnPrimary} onClick={onToggleForm}>
          <Send size={14} /> {showForm ? "Cancel" : "Send Notification"}
        </button>
      </div>
    </div>
  );
}