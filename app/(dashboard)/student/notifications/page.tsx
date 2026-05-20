// app/(dashboard)/student/notifications/page.tsx
//
// CLEAN ORCHESTRATOR — this file's only jobs are:
//   1. Get the authenticated user id
//   2. Call useNotifications(userId)
//   3. Manage local UI state (activeTab, showSettings, settings)
//   4. Wire handler callbacks
//   5. Render layout + pass props to pure components
//
// NO Supabase calls  •  NO business logic  •  NO data manipulation

'use client'

import { useCallback, useMemo, useState } from 'react'
import { useUser }             from '@/lib/context/AuthContext'
import { useNotifications }    from '@/lib/hooks/student/notifications/useNotifications'
import { filterByTab }         from '@/lib/utils/student/notifications/helpers'

import {
  DEFAULT_SETTINGS,
  type FilterTab,
  type NotifSettings,
} from '@/lib/types/student/notifications/notifications.types'

import {
  NotificationHeader,
  NotificationTabs,
  NotificationList,
  NotificationSettingsModal,
  NotificationToastContainer,
} from '@/components/dashboard/student/notifications'

import styles from './notifications.module.css'
import type { JSX } from 'react/jsx-dev-runtime'

export default function StudentNotificationsPage(): JSX.Element {
  const { user } = useUser()
  const userId   = user?.id ?? null

  // ── Data layer ─────────────────────────────────────────────────────────────
  const {
    notifications,
    unreadCount,
    loading,
    refetch,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    deleteNotification,
  } = useNotifications(userId)

  // ── UI state ───────────────────────────────────────────────────────────────
  const [activeTab,     setActiveTab]     = useState<FilterTab>('all')
  const [showSettings,  setShowSettings]  = useState(false)
  const [settings,      setSettings]      = useState<NotifSettings>(DEFAULT_SETTINGS)

  // ── Derived ────────────────────────────────────────────────────────────────

  const filtered = useMemo(
    () => filterByTab(notifications, activeTab),
    [notifications, activeTab],
  )

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleToggleRead = useCallback(
    async (id: string, currentIsRead: boolean) => {
      if (currentIsRead) {
        await markAsUnread(id)
      } else {
        await markAsRead(id)
      }
    },
    [markAsRead, markAsUnread],
  )

  const handleToggleSetting = useCallback(
    (key: keyof Omit<NotifSettings, 'frequency'>) => {
      setSettings((prev) => ({ ...prev, [key]: !prev[key] }))
    },
    [],
  )

  const handleFrequencyChange = useCallback(
    (value: 'realtime' | 'daily') => {
      setSettings((prev) => ({ ...prev, frequency: value }))
    },
    [],
  )

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className={styles.page}>

      {/* Live toast popups — renders from Zustand toast queue */}
      <NotificationToastContainer />

      {/* Page header */}
      <NotificationHeader
        unreadCount={unreadCount}
        refreshing={loading}
        onRefresh={() => { void refetch() }}
        onMarkAllRead={markAllAsRead}
        onOpenSettings={() => setShowSettings(true)}
      />

      {/* Tab bar */}
      <NotificationTabs
        activeTab={activeTab}
        notifications={notifications}
        unreadCount={unreadCount}
        onTabChange={setActiveTab}
      />

      {/* Notification list (grouped) or empty state */}
      <NotificationList
        notifications={filtered}
        activeTab={activeTab}
        onToggleRead={handleToggleRead}
        onDelete={deleteNotification}
      />

      {/* Settings modal */}
      {showSettings && (
        <NotificationSettingsModal
          settings={settings}
          onToggle={handleToggleSetting}
          onFrequency={handleFrequencyChange}
          onClose={() => setShowSettings(false)}
        />
      )}

    </div>
  )
}
