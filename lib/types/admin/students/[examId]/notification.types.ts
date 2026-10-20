// lib/types/admin/students/[examId]/notification.types.ts
import type { Database } from '@/lib/types/database'

// ── Raw DB row alias ──────────────────────────────────────────────────────────
type NotificationRow = Database['public']['Tables']['notifications']['Row']

// ── Supabase select shape (subset of columns) ─────────────────────────────────
export type NotificationRaw = Pick<
  NotificationRow,
  'id' | 'title' | 'message' | 'type' | 'is_read' | 'created_at'
>

// ── App-level domain type ─────────────────────────────────────────────────────
export interface Notification {
  id:         string
  title:      string | null
  message:    string | null
  type:       string | null
  is_read:    boolean
  created_at: string
}

// ── Insert payload — derives from DB Insert type ──────────────────────────────
export type NotificationInsertPayload =
  Database['public']['Tables']['notifications']['Insert']

// ── Form state for sending a notification ─────────────────────────────────────
export interface NotifyForm {
  title:   string
  message: string
  type:    string
}

export type NotifyFormErrors = Partial<Record<keyof NotifyForm, string>>