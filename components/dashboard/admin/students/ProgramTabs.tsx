/**
 * components/dashboard/admin/students/ProgramTabs.tsx
 * Pure presentational — no Supabase, no hooks, no business logic.
 */

import type { Program } from '@/lib/types/admin/students/program.types'
import { ALL_TAB }      from '@/lib/utils/admin/students/constants'
import styles from '@/app/(dashboard)/admin/students/students.module.css'

interface ProgramTabsProps {
  programs:     Program[]
  activeTab:    string
  onTabChange:  (id: string) => void
}

export function ProgramTabs({ programs, activeTab, onTabChange }: ProgramTabsProps) {
  return (
    <div className={styles.tabsRow}>
      <button
        className={`${styles.tab} ${activeTab === ALL_TAB ? styles.tabActive : ''}`}
        onClick={() => onTabChange(ALL_TAB)}
      >
        All Programs
      </button>

      {programs.map((p) => (
        <button
          key={p.id}
          className={`${styles.tab} ${activeTab === p.id ? styles.tabActive : ''}`}
          onClick={() => onTabChange(p.id)}
        >
          {p.code}
        </button>
      ))}
    </div>
  )
}