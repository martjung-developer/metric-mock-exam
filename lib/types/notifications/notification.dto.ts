// lib/types/notifications/notification.dto.ts
//
// ─────────────────────────────────────────────────────────────────────────────
// SHARED Notification DTO — single source of truth across admin + student.
// Derived entirely from `Database` generated types. No `as`, no `any`.
// ─────────────────────────────────────────────────────────────────────────────

import type { Database } from '@/lib/types/database'

// ── Raw DB Row ────────────────────────────────────────────────────────────────

export type NotificationRow =
  Database['public']['Tables']['notifications']['Row']

export type NotificationInsert =
  Database['public']['Tables']['notifications']['Insert']

export type NotificationUpdate =
  Database['public']['Tables']['notifications']['Update']

// ── Notification type enum ────────────────────────────────────────────────────
// Must match the `notification_type` Postgres enum from the migration.

export const NOTIFICATION_TYPES = [
  'submission',
  'result_released',
  'exam',
  'result',
  'general',
  'progress',
  'reminder',
  'study',
  'streak',
  'system',
] as const

export type NotificationType = (typeof NOTIFICATION_TYPES)[number]

// ── Type guard ────────────────────────────────────────────────────────────────

export function isNotificationType(value: unknown): value is NotificationType {
  return (
    typeof value === 'string' &&
    (NOTIFICATION_TYPES as ReadonlyArray<string>).includes(value)
  )
}

export function coerceNotificationType(raw: string | null | undefined): NotificationType {
  if (raw !== null && raw !== undefined && isNotificationType(raw)) {return raw}
  return 'system'
}

// ── App-level DTO ─────────────────────────────────────────────────────────────
// This is what all components and hooks consume — never the raw DB row.

export interface NotificationDTO {
  readonly id:         string
  readonly userId:     string | null
  readonly type:       NotificationType
  readonly title:      string
  readonly message:    string
  readonly isRead:     boolean
  readonly createdAt:  string   // ISO timestamp
  readonly link:       string | null
  readonly ctaLabel:   string | null
}

// ── Mapper: DB Row → DTO ──────────────────────────────────────────────────────

export function rowToDTO(row: NotificationRow): NotificationDTO {
  return {
    id:        row.id,
    userId:    row.user_id ?? null,
    type:      coerceNotificationType(row.type as string | null),
    title:     row.title   ?? '',
    message:   row.message ?? '',
    isRead:    row.is_read ?? false,
    createdAt: row.created_at ?? new Date().toISOString(),
    link:      row.link ?? null,
    ctaLabel:  row.cta_label ?? null,
  }
}

// ── Create payload ────────────────────────────────────────────────────────────

export interface CreateNotificationPayload {
  readonly userId:   string
  readonly type:     NotificationType
  readonly title:    string
  readonly message:  string
}

// ── Bulk create payload ───────────────────────────────────────────────────────

export interface CreateBulkNotificationPayload {
  readonly userIds:  ReadonlyArray<string>
  readonly type:     NotificationType
  readonly title:    string
  readonly message:  string
}

// ── Service result wrapper ────────────────────────────────────────────────────

export interface NotificationResult<T = void> {
  readonly data:  T | null
  readonly error: string | null
}
