// lib/hooks/admin/notifications/useNotifications.ts
// ─────────────────────────────────────────────────────────────────────────────
// CHANGED (surgical only):
//  1. Added `previewNotif` state + `openPreview` / `closePreview` actions
//  2. Added `toggleRead` action (marks read → unread and unread → read)
//  All other logic is identical to the original.
// ─────────────────────────────────────────────────────────────────────────────

"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"
import * as NotificationsService from "@/lib/services/admin/notifications/notifications.service"
import type {
  FilterType,
  Notification,
  SendNotificationPayload,
  StudentWithProfile,
  UseNotificationsReturn,
} from "@/lib/types/admin/notifications/notifications.types"

// ─────────────────────────────────────────────────────────────────────────────

export function useNotifications(): UseNotificationsReturn {
  const supabase    = useMemo(() => createClient(), [])
  const mountedRef  = useRef(true)

  // ── Core state (unchanged) ──────────────────────────────────────────────────
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [students,      setStudents]      = useState<StudentWithProfile[]>([])
  const [loading,       setLoading]       = useState(true)
  const [sending,       setSending]       = useState(false)
  const [fetchError,    setFetchError]    = useState<string>("")
  const [filterType,    setFilterType]    = useState<FilterType>("all")
  const [showForm,      setShowForm]      = useState(false)

  // ── NEW: preview modal state ────────────────────────────────────────────────
  const [previewNotif, setPreviewNotif] = useState<Notification | null>(null)

  const openPreview  = useCallback((n: Notification) => setPreviewNotif(n), [])
  const closePreview = useCallback(() => setPreviewNotif(null), [])

  // ── Derived state (unchanged) ───────────────────────────────────────────────
  const filteredNotifications = useMemo<Notification[]>(
    () =>
      filterType === "all"
        ? notifications
        : notifications.filter((n) => n.type === filterType),
    [notifications, filterType],
  )

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.is_read).length,
    [notifications],
  )

  // ── Data fetching (unchanged) ───────────────────────────────────────────────
  const refetch = useCallback(async () => {
    if (!mountedRef.current) {return}
    setLoading(true)
    setFetchError("")

    const [notifResult, studentsResult] = await Promise.all([
      NotificationsService.fetchNotifications(supabase),
      NotificationsService.fetchStudents(supabase),
    ])

    if (!mountedRef.current) {return}

    if (notifResult.error)    {console.error("[useNotifications] fetchNotifications:", notifResult.error)}
    if (studentsResult.error) {setFetchError(studentsResult.error)}

    setNotifications(notifResult.data ?? [])
    setStudents(studentsResult.data ?? [])
    setLoading(false)
  }, [supabase])

  // ── Real-time subscription (unchanged) ─────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel("admin:notifications:realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        () => {
          if (!mountedRef.current) {return}
          void refetch()
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "notifications" },
        (payload: RealtimePostgresChangesPayload<Notification>) => {
          if (!mountedRef.current) {return}
          const updated = payload.new as Notification
          setNotifications((prev) =>
            prev.map((n) => (n.id === updated.id ? updated : n)),
          )
          // Keep preview in sync if the updated notification is open
          setPreviewNotif((prev) =>
            prev?.id === updated.id ? updated : prev,
          )
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "notifications" },
        (payload: RealtimePostgresChangesPayload<Notification>) => {
          if (!mountedRef.current) {return}
          const deletedId = (payload.old as Partial<Notification>).id
          if (!deletedId) {return}
          setNotifications((prev) => prev.filter((n) => n.id !== deletedId))
          // Close preview if the deleted notification was open
          setPreviewNotif((prev) => (prev?.id === deletedId ? null : prev))
        },
      )
      .subscribe()

    return () => { void supabase.removeChannel(channel) }
  }, [supabase, refetch])

  // ── Initial load (unchanged) ────────────────────────────────────────────────
  useEffect(() => {
    mountedRef.current = true
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refetch()
    return () => { mountedRef.current = false }
  }, [refetch])

  // ── Actions ─────────────────────────────────────────────────────────────────

  // unchanged
  const markAsRead = useCallback(
    async (id: string): Promise<void> => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      )
      const result = await NotificationsService.markAsRead(supabase, id)
      if (result.error) {
        console.error("[useNotifications] markAsRead:", result.error)
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, is_read: false } : n)),
        )
      }
    },
    [supabase],
  )

  // NEW: toggles is_read between true and false
  const toggleRead = useCallback(
    async (id: string, currentIsRead: boolean): Promise<void> => {
      const next = !currentIsRead

      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: next } : n)),
      )
      setPreviewNotif((prev) =>
        prev?.id === id ? { ...prev, is_read: next } : prev,
      )

      const { error } = await supabase
        .from("notifications")
        .update({ is_read: next })
        .eq("id", id)

      if (error !== null) {
        console.error("[useNotifications] toggleRead:", error.message)
        // Rollback
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, is_read: currentIsRead } : n)),
        )
        setPreviewNotif((prev) =>
          prev?.id === id ? { ...prev, is_read: currentIsRead } : prev,
        )
      }
    },
    [supabase],
  )

  // unchanged
  const markAllAsRead = useCallback(async (): Promise<void> => {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id)
    if (!unreadIds.length) {return}

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))

    const result = await NotificationsService.markAllAsRead(supabase, unreadIds)
    if (result.error) {
      console.error("[useNotifications] markAllAsRead:", result.error)
      void refetch()
    }
  }, [notifications, supabase, refetch])

  // unchanged
  const deleteNotification = useCallback(
    async (id: string): Promise<void> => {
      setNotifications((prev) => prev.filter((n) => n.id !== id))
      const result = await NotificationsService.deleteNotification(supabase, id)
      if (result.error) {
        console.error("[useNotifications] deleteNotification:", result.error)
        void refetch()
      }
    },
    [supabase, refetch],
  )

  // unchanged
  const sendNotification = useCallback(
    async (payload: SendNotificationPayload): Promise<string | null> => {
      setSending(true)
      const result = await NotificationsService.sendNotification(supabase, payload)
      setSending(false)
      if (result.error) {return result.error}
      void refetch()
      return null
    },
    [supabase, refetch],
  )

  // ── Return surface ──────────────────────────────────────────────────────────
  return {
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
    refetch,
    toggleRead,
    previewNotif,
    openPreview,
    closePreview,
  }
}
