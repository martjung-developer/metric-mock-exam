/**
 * components/admin/programs/EmptyState.tsx
 *
 * Shown when the filtered programs list is empty.
 * Pure UI — no Supabase, no hooks, no business logic.
 */

import { GraduationCap } from 'lucide-react'
import styles from '@/app/(dashboard)/admin/programs/programs.module.css'

export function EmptyState() {
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyIcon}>
        <GraduationCap size={22} color="#8a9ab5" />
      </div>
      <p className={styles.emptyTitle}>No programs found</p>
      <p className={styles.emptySub}>Try adjusting your search or filter.</p>
    </div>
  )
}