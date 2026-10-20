// lib/utils/student/profile/profile.ts
import styles from '@/app/(dashboard)/student/profile/profile.module.css'

export function getInitials(name: string | null): string {
  if (!name) { return '?' }
  return name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function formatDate(iso: string | null): string {
  if (!iso) { return '—' }
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day:   'numeric',
    year:  'numeric',
  })
}

export function getScoreColor(pct: number | null): string {
  if (pct === null) { return '#9ca3af' }
  if (pct >= 75)    { return '#059669' }
  if (pct >= 50)    { return '#d97706' }
  return '#dc2626'
}

export function getPassRateFillClass(rate: number): string {
  if (rate >= 75) { return styles.fillGreen }
  if (rate >= 50) { return styles.fillAmber }
  return styles.fillRed
}