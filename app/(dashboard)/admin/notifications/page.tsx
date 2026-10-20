// app/(dashboard)/admin/notifications/page.tsx

"use client"

import { useMemo }             from "react"
import { useNotifications }    from "@/lib/hooks/admin/notifications/useNotifications"
import type { NotifType }      from "@/lib/types/admin/notifications/notifications.types"
import {
  NotificationsHeader,
  NotificationForm,
  NotificationFilterBar,
  NotificationList,
}                              from "@/components/dashboard/admin/notifications"
import { NotificationPreviewModal } from "@/components/dashboard/admin/notifications/NotificationPreviewModal"
import styles from "./notifications.module.css"

const TYPE_OPTIONS: NotifType[] = ["exam", "result", "general"]

// ─────────────────────────────────────────────────────────────────────────────

export default function AdminNotificationsPage() {
  const {
    notifications,
    students,
    loading,
    sending,
    fetchError,
    filterType,
    showForm,
    filteredNotifications,
    unreadCount,
    
    setFilterType,
    setShowForm,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    sendNotification,
    toggleRead,
    previewNotif,
    openPreview,
    closePreview,
  } = useNotifications()

  const countByType = useMemo(
    () =>
      TYPE_OPTIONS.reduce<Record<NotifType, number>>(
        (acc, t) => ({
          ...acc,
          [t]: notifications.filter((n) => n.type === t).length,
        }),
        { exam: 0, result: 0, general: 0 },
      ),
    [notifications],
  )

  return (
    <div className={styles.page}>

      {/* ── Header ── */}
      <NotificationsHeader
        totalCount={notifications.length}
        unreadCount={unreadCount}
        showForm={showForm}
        onToggleForm={() => setShowForm(!showForm)}
        onMarkAllRead={markAllAsRead}
      />

      {/* ── Send Form ── */}
      {showForm && (
        <NotificationForm
          students={students}
          sending={sending}
          fetchError={fetchError}
          onSubmit={sendNotification}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* ── Filter Bar ── */}
      <NotificationFilterBar
        filterType={filterType}
        totalCount={notifications.length}
        countByType={countByType}
        onFilter={setFilterType}
      />

      {/* ── Notification List ── */}
      <NotificationList
        notifications={filteredNotifications}
        loading={loading}
        onMarkRead={markAsRead}
        onToggleRead={toggleRead}
        onDelete={deleteNotification}
        onPreview={openPreview}
      />

      {/* ── Preview Modal ── */}
      {previewNotif !== null && (
        <NotificationPreviewModal
          notification={previewNotif}
          onClose={closePreview}
          onToggleRead={toggleRead}
          onDelete={deleteNotification}
        />
      )}

    </div>
  )
}