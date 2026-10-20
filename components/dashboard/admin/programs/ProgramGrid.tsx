/**
 * components/admin/programs/ProgramGrid.tsx
 *
 * Renders the grid of ProgramCard components (or skeleton/empty states).
 * Pure UI — no Supabase, no hooks, no business logic.
 */

import type { ProgramDisplay, DescriptionEditState, EditingId } from '@/lib/types/admin/programs/programs.types'

import { ProgramCard }        from './ProgramCard'
import { ProgramSkeletonCard } from './ProgramSkeletonCard'
import { EmptyState }          from './EmptyState'

import styles from '@/app/(dashboard)/admin/programs/programs.module.css'

interface ProgramGridProps {
  programs:     ProgramDisplay[]
  loading:      boolean
  editState:    DescriptionEditState
  onView:       (prog: ProgramDisplay) => void
  onStartEdit:  (id: EditingId, currentDesc: string | null) => void
  onChangeDesc: (value: string) => void
  onSave:       (programId: string) => void
  onCancel:     () => void
}

const SKELETON_COUNT = 9

export function ProgramGrid({
  programs,
  loading,
  editState,
  onView,
  onStartEdit,
  onChangeDesc,
  onSave,
  onCancel,
}: ProgramGridProps) {
  return (
    <div className={styles.grid}>
      {loading ? (
        Array.from({ length: SKELETON_COUNT }).map((_, i) => (
          <ProgramSkeletonCard key={i} />
        ))
      ) : programs.length === 0 ? (
        <EmptyState />
      ) : (
        programs.map((prog, idx) => (
          <ProgramCard
            key={prog.id}
            program={prog}
            colorIndex={idx}
            editState={editState}
            onView={onView}
            onStartEdit={onStartEdit}
            onChangeDesc={onChangeDesc}
            onSave={onSave}
            onCancel={onCancel}
          />
        ))
      )}
    </div>
  )
}