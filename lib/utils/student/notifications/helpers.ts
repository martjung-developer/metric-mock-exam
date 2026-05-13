// lib/utils/student/notifications/helpers.ts
//
// Pure formatting/grouping helpers — no Supabase, no React.

import type {
  DateGroupLabel,
  FilterTab,
  Notification,
  NotificationGroup,
} from '@/lib/types/student/notifications/notifications.types'

// ── Time formatting ────────────────────────────────────────────────────────

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m    = Math.floor(diff / 60_000)
  if (m < 1)  {return 'Just now'}
  if (m < 60) {return `${m}m ago`}
  const h = Math.floor(m / 60)
  if (h < 24) {return `${h}h ago`}
  const d = Math.floor(h / 24)
  if (d < 7)  {return `${d}d ago`}
  return new Date(iso).toLocaleDateString()
}

// ── Date group label ───────────────────────────────────────────────────────

export function dateGroup(iso: string): DateGroupLabel {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (diff === 0) {return 'Today'}
  if (diff === 1) {return 'Yesterday'}
  if (diff < 7)  {return 'This Week'}
  return 'Earlier'
}

const GROUP_ORDER: ReadonlyArray<DateGroupLabel> = [
  'Today',
  'Yesterday',
  'This Week',
  'Earlier',
]

export function groupNotifications(list: Notification[]): NotificationGroup[] {
  const map = new Map<DateGroupLabel, Notification[]>()

  for (const n of list) {
    const label = dateGroup(n.timestamp)
    const bucket = map.get(label)
    if (bucket) {
      bucket.push(n)
    } else {
      map.set(label, [n])
    }
  }

  return GROUP_ORDER
    .filter((label) => map.has(label))
    .map((label) => ({ label, items: map.get(label) ?? [] }))
}

// ── Tab filtering ──────────────────────────────────────────────────────────

export function filterByTab(
  notifications: Notification[],
  tab: FilterTab,
): Notification[] {
  switch (tab) {
    case 'all':       return notifications
    case 'unread':    return notifications.filter((n) => !n.is_read)
    case 'exams':     return notifications.filter((n) => n.type === 'exam')
    case 'progress':  return notifications.filter((n) => n.type === 'progress')
    case 'reminders': return notifications.filter(
      (n) => n.type === 'reminder' || n.type === 'streak',
    )
    case 'system':    return notifications.filter((n) => n.type === 'system')
    default: {
      const _exhaustive: never = tab
      return notifications
       
      void _exhaustive
    }
  }
}

// ── Tab badge count ────────────────────────────────────────────────────────

export function tabBadgeCount(
  notifications: Notification[],
  tab: FilterTab,
  unreadCount: number,
): number {
  if (tab === 'all' || tab === 'unread') {return unreadCount}
  return filterByTab(notifications, tab).filter((n) => !n.is_read).length
}
