// components/dashboard/student/study-materials/StudyMaterialsEmpty.tsx
import { Inbox } from 'lucide-react'
import styles from '@/app/(dashboard)/student/study-materials/study-materials.module.css'

interface StudyMaterialsEmptyProps {
  hasAnyMaterials: boolean
  onClearFilters:  () => void
}

export function StudyMaterialsEmpty({ hasAnyMaterials, onClearFilters }: StudyMaterialsEmptyProps) {
  return (
    <div className={styles.emptyState}>
      <Inbox size={40} strokeWidth={1.4} color="#cbd5e1" />
      <p className={styles.emptyTitle}>
        {hasAnyMaterials ? 'No materials found' : 'No materials available yet'}
      </p>
      <p className={styles.emptyText}>
        {hasAnyMaterials
          ? 'Try adjusting your search or filter options.'
          : 'Check back later — your faculty will upload resources here.'}
      </p>
      {hasAnyMaterials && (
        <button className={styles.emptyBtn} onClick={onClearFilters}>
          Clear Filters
        </button>
      )}
    </div>
  )
}