// lib/types/student/notifications/notifications.types.ts
//
// Single source of truth for all notification domain types.
// Derived from the Supabase `notifications` table where possible.

import type { Database } from '@/lib/types/database'

// ── DB row alias ───────────────────────────────────────────────────────────

export type NotificationRow = Database['public']['Tables']['notifications']['Row']

// ── Narrowed notification type enum ───────────────────────────────────────
// The DB column `type` is `string | null`. We narrow it here at the app level.

export type NotifType =
  | 'exam'
  | 'progress'
  | 'reminder'
  | 'study'
  | 'streak'
  | 'system'

// ── App-level Notification shape ───────────────────────────────────────────
// Replaces the loose inline interface in the page component.

export interface Notification {
  id:         string
  user_id:    string | null
  type:       NotifType
  title:      string
  message:    string
  /** ISO timestamp — maps to `created_at` from the DB row */
  timestamp:  string
  is_read:    boolean
  link?:      string | null
  ctaLabel?:  string | null
}

// ── Filter tab ─────────────────────────────────────────────────────────────

export type FilterTab =
  | 'all'
  | 'unread'
  | 'exams'
  | 'progress'
  | 'reminders'
  | 'system'

// ── Notification settings (UI-only state, not persisted yet) ───────────────

export interface NotifSettings {
  examAlerts:       boolean
  studyReminders:   boolean
  progressUpdates:  boolean
  streakAlerts:     boolean
  systemAlerts:     boolean
  frequency:        'realtime' | 'daily'
}

export const DEFAULT_SETTINGS: NotifSettings = {
  examAlerts:       true,
  studyReminders:   true,
  progressUpdates:  true,
  streakAlerts:     true,
  systemAlerts:     true,
  frequency:        'realtime',
}

// ── Date group label ───────────────────────────────────────────────────────

export type DateGroupLabel = 'Today' | 'Yesterday' | 'This Week' | 'Earlier'

export interface NotificationGroup {
  label: DateGroupLabel
  items: Notification[]
}

// ── Toast shape ────────────────────────────────────────────────────────────

export interface NotifToast {
  id:      string
  title:   string
  message: string
}

// ── Service result wrapper ─────────────────────────────────────────────────

export interface ServiceResult<T = void> {
  data:  T | null
  error: string | null
}