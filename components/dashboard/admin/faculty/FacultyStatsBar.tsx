// components/dashboard/admin/faculty/FacultyStatsBar.tsx
'use client'

import type { FacultyRow, FacultyRoleType } from '@/lib/types/admin/faculty'
import { ROLE_TYPE_LABELS }                 from '@/lib/types/admin/faculty'
import styles                               from '@/components/dashboard/admin/faculty/css/FacultyStatsBar.module.css'

interface FacultyStatsBarProps {
  faculty: FacultyRow[]
}

export default function FacultyStatsBar({ faculty }: FacultyStatsBarProps) {
  const total    = faculty.length
  const active   = faculty.filter((f) => f.is_active).length
  const inactive = total - active

  const byRole: Record<FacultyRoleType, number> = {
    professional: 0,
    major:        0,
    minor:        0,
  }

  faculty.forEach((f) => {
    if (f.role_type && f.role_type in byRole) {
      byRole[f.role_type as FacultyRoleType]++
    }
  })

  const stats = [
    { label: 'Total Faculty',           value: total,    color: '#3b82f6' },
    { label: 'Active',                   value: active,   color: '#10b981' },
    { label: 'Inactive',                 value: inactive, color: '#ef4444' },
    { label: ROLE_TYPE_LABELS.professional, value: byRole.professional, color: '#6366f1' },
    { label: ROLE_TYPE_LABELS.major,     value: byRole.major,  color: '#059669' },
    { label: ROLE_TYPE_LABELS.minor,     value: byRole.minor,  color: '#d97706' },
  ]

  return (
    <div className={styles.bar}>
      {stats.map((s) => (
        <div key={s.label} className={styles.card}>
          <span className={styles.value} style={{ color: s.color }}>{s.value}</span>
          <span className={styles.label}>{s.label}</span>
        </div>
      ))}
    </div>
  )
}