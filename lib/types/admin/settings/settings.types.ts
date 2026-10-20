// lib/types/admin/settings/settings.types.ts

import type { Database } from '@/lib/types/database'

// ── Supabase-derived ───────────────────────────────────────────────────────

export type Profile = Database['public']['Tables']['profiles']['Row']

// ── Navigation ─────────────────────────────────────────────────────────────

export type NavSection = 'profile' | 'password' | 'preferences' | 'danger'

// ── Toast ──────────────────────────────────────────────────────────────────

export interface ToastState {
  type: 'success' | 'error'
  message: string
}

// ── Profile form ───────────────────────────────────────────────────────────

export interface ProfileFormState {
  fullName: string
  saving: boolean
}

// ── Avatar upload ──────────────────────────────────────────────────────────

export interface AvatarUploadState {
  uploading: boolean
  /** 0–100 */
  progress: number
  /** Resolved public URL after a successful upload */
  url: string | null
}

// ── Password form ──────────────────────────────────────────────────────────

export type PasswordStrength = 'weak' | 'fair' | 'strong'

export interface PasswordFormState {
  currentPw: string
  newPw: string
  confirmPw: string
  showCurrent: boolean
  showNew: boolean
  showConfirm: boolean
  saving: boolean
  /** null when newPw is empty */
  strength: PasswordStrength | null
}

// ── Preferences ────────────────────────────────────────────────────────────

export interface PreferencesState {
  darkMode: boolean
  notifEnabled: boolean
  emailNotif: boolean
}

// ── Service result wrappers ────────────────────────────────────────────────

export interface ServiceResult<T = void> {
  data: T | null
  error: string | null
}