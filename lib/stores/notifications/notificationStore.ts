// lib/stores/notifications/notificationStore.ts
//
// Global Zustand store for notifications.
// Shared between student and admin contexts.
// Components read from this store; the hook writes to it.

import { create } from 'zustand'
import type { Notification, NotifToast } from '@/lib/types/student/notifications/notifications.types'

// ── State shape ────────────────────────────────────────────────────────────

interface NotificationState {
  notifications: Notification[]
  loading:       boolean
  /** Queue of toast popups triggered by real-time INSERTs */
  toastQueue:    NotifToast[]
}

// ── Action shape ───────────────────────────────────────────────────────────

interface NotificationActions {
  /** Replace entire list (after initial fetch) */
  setNotifications: (notifications: Notification[]) => void
  /** Prepend a single notification (from real-time INSERT) */
  addNotification:  (notification: Notification)    => void
  /** Patch a single notification in-place (read/unread toggle) */
  updateNotification: (id: string, patch: Partial<Notification>) => void
  /** Remove a notification by id */
  removeNotification: (id: string) => void
  /** Mark every notification in the store as read */
  markAllRead: () => void
  /** Set loading state */
  setLoading: (loading: boolean) => void
  /** Enqueue a toast (called by realtime handler) */
  pushToast: (toast: NotifToast) => void
  /** Dequeue the oldest toast (called by ToastContainer after display) */
  shiftToast: () => void
}

// ── Store ──────────────────────────────────────────────────────────────────

export const useNotificationStore = create<NotificationState & NotificationActions>(
  (set) => ({
    // ── Initial state ──────────────────────────────────────────────────────
    notifications: [],
    loading:       true,
    toastQueue:    [],

    // ── Actions ────────────────────────────────────────────────────────────

    setNotifications: (notifications) =>
      set({ notifications }),

    addNotification: (notification) =>
      set((state) => ({
        notifications: [notification, ...state.notifications],
      })),

    updateNotification: (id, patch) =>
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, ...patch } : n,
        ),
      })),

    removeNotification: (id) =>
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
      })),

    markAllRead: () =>
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
      })),

    setLoading: (loading) => set({ loading }),

    pushToast: (toast) =>
      set((state) => ({ toastQueue: [...state.toastQueue, toast] })),

    shiftToast: () =>
      set((state) => ({ toastQueue: state.toastQueue.slice(1) })),
  }),
)

// ── Selectors (stable references — prevents unnecessary re-renders) ────────

export const selectNotifications = (s: NotificationState) => s.notifications
export const selectLoading        = (s: NotificationState) => s.loading
export const selectToastQueue     = (s: NotificationState) => s.toastQueue
export const selectUnreadCount    = (s: NotificationState) =>
  s.notifications.filter((n) => !n.is_read).length