/**
 * components/admin/programs/ProgramsStatStrip.tsx
 *
 * Pure presentational component — no Supabase, no hooks, no business logic.
 */

import { GraduationCap, Users, ClipboardList, BookOpen } from 'lucide-react'
import type { ProgramStats } from '@/lib/types/admin/programs/programs.types'
import styles from '@/app/(dashboard)/admin/programs/programs.module.css'

interface ProgramsStatStripProps {
  stats: ProgramStats
}

interface StatItem {
  label: string
  value: number
  icon:  React.ReactNode
  bg:    string
}

export function ProgramsStatStrip({ stats }: ProgramsStatStripProps) {
  const items: StatItem[] = [
    {
      label: 'Programs',
      value: stats.total,
      icon:  <GraduationCap size={16} color="#0d2540" />,
      bg:    'rgba(13,37,64,0.10)',
    },
    {
      label: 'Total Students',
      value: stats.students,
      icon:  <Users size={16} color="#059669" />,
      bg:    'rgba(5,150,105,0.10)',
    },
    {
      label: 'Total Exams',
      value: stats.exams,
      icon:  <ClipboardList size={16} color="#4f5ff7" />,
      bg:    'rgba(79,95,247,0.10)',
    },
    {
      label: 'With Students',
      value: stats.active,
      icon:  <BookOpen size={16} color="#0891b2" />,
      bg:    'rgba(8,145,178,0.10)',
    },
  ]

  return (
    <div className={styles.statStrip}>
      {items.map((s) => (
        <div className={styles.statCard} key={s.label}>
          <div className={styles.statIconWrap} style={{ background: s.bg }}>
            {s.icon}
          </div>
          <div>
            <div className={styles.statValue}>{s.value}</div>
            <div className={styles.statLabel}>{s.label}</div>
          </div>
        </div>
      ))}
    </div>
  )
}