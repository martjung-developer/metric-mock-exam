// lib/types/admin/notifications/notifications.types.ts

import type { Database } from "@/lib/types/database"

// ── Supabase-derived Row / Insert / Update (unchanged) ────────────────────────

export type Notification     = Database["public"]["Tables"]["notifications"]["Row"]
export type NotificationInsert = Database["public"]["Tables"]["notifications"]["Insert"]
export type NotificationUpdate = Database["public"]["Tables"]["notifications"]["Update"]

// ── Domain enums (unchanged) ──────────────────────────────────────────────────

export type NotifType  = "exam" | "result" | "general"
export type FilterType = "all" | NotifType
export type TargetMode = "single" | "multiple" | "all"

// ── Normalised profile shape (unchanged) ──────────────────────────────────────

export interface StudentWithProfile {
  id:       string
  full_name: string | null
  email:    string
  students: { id: string } | null
}

// ── Raw Supabase join shapes (unchanged) ──────────────────────────────────────

export interface RawProfileRow {
  id:       string
  full_name: string | null
  email:    string
  students: { id: string } | { id: string }[] | null
}

export interface RawStudentRow {
  id:       string
  profiles:
    | { id: string; full_name: string | null; email: string }
    | { id: string; full_name: string | null; email: string }[]
    | null
}

// ── Form state (unchanged) ────────────────────────────────────────────────────

export interface NotificationFormState {
  title:      string
  message:    string
  type:       NotifType
  targetMode: TargetMode
  singleId:   string
  multiIds:   string[]
}

export const NOTIFICATION_FORM_DEFAULTS: NotificationFormState = {
  title:      "",
  message:    "",
  type:       "general",
  targetMode: "single",
  singleId:   "",
  multiIds:   [],
} as const

// ── Service-layer contracts (unchanged) ───────────────────────────────────────

export interface SendNotificationPayload {
  title:        string
  message:      string
  type:         NotifType
  recipientIds: string[]
}

export interface ServiceResult<T = void> {
  data:  T | null
  error: string | null
}

// ── Hook state shape ──────────────────────────────────────────────────────────

export interface UseNotificationsState {
  notifications:         Notification[]
  students:              StudentWithProfile[]
  loading:               boolean
  sending:               boolean
  fetchError:            string
  filterType:            FilterType
  showForm:              boolean
  filteredNotifications: Notification[]
  unreadCount:           number
  // NEW
  previewNotif:          Notification | null
}

// ── Hook actions ──────────────────────────────────────────────────────────────

export interface UseNotificationsActions {
  setFilterType:        (filter: FilterType) => void
  setShowForm:          (show: boolean) => void
  markAsRead:           (id: string) => Promise<void>
  markAllAsRead:        () => Promise<void>
  deleteNotification:   (id: string) => Promise<void>
  sendNotification:     (payload: SendNotificationPayload) => Promise<string | null>
  refetch:              () => Promise<void>
  // NEW
  toggleRead:           (id: string, currentIsRead: boolean) => Promise<void>
  openPreview:          (notification: Notification) => void
  closePreview:         () => void
}

export type UseNotificationsReturn = UseNotificationsState & UseNotificationsActions