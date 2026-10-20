/**
 * lib/utils/admin/students/helpers.ts
 *
 * Pure UI-helper functions — no React, no Supabase, no side effects.
 */

import type { AvatarColor } from '@/lib/types/admin/students/student.types'

// ── Initials ──────────────────────────────────────────────────────────────────

/**
 * Returns a 1–2 character initials string derived from a full name.
 * Falls back to the first two characters of the email address.
 */
export function getInitials(name: string | null, email: string): string {
  if (name) {
    const parts = name.trim().split(' ')
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase()
  }
  return email.slice(0, 2).toUpperCase()
}

// ── Avatar colours ────────────────────────────────────────────────────────────

const AVATAR_COLORS: AvatarColor[] = [
  { bg: '#dbeafe', color: '#1d4ed8' },
  { bg: '#d1fae5', color: '#065f46' },
  { bg: '#fce7f3', color: '#9d174d' },
  { bg: '#ede9fe', color: '#5b21b6' },
  { bg: '#fef3c7', color: '#92400e' },
  { bg: '#fee2e2', color: '#991b1b' },
  { bg: '#ecfeff', color: '#155e75' },
]

/**
 * Returns a consistent avatar background + foreground colour pair
 * for a given student ID.  The same ID always maps to the same colour.
 */
export function avatarColor(id: string): AvatarColor {
  const idx = id.charCodeAt(0) % AVATAR_COLORS.length
  return AVATAR_COLORS[idx]
}