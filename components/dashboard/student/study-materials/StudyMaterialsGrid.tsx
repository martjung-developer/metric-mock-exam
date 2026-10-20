// components/dashboard/student/study-materials/StudyMaterialsGrid.tsx
import type { StudyMaterial } from '@/lib/types/student/study-materials/study-materials'
import { MaterialCard }       from './MaterialCard'
import styles from '@/app/(dashboard)/student/study-materials/study-materials.module.css'

const PAGE_SIZE = 6

function SkeletonCard() {
  return (
    <div className={styles.cardSkeleton}>
      <div className={styles.skelAccent} />
      <div className={styles.skelTop}>
        <div className={styles.skelIcon} />
        <div className={styles.skelBadge} />
      </div>
      <div className={styles.skelBody}>
        <div className={styles.skelLine} style={{ width: '40%' }} />
        <div className={styles.skelLine} style={{ width: '80%', height: 14 }} />
        <div className={styles.skelLine} style={{ width: '65%' }} />
      </div>
    </div>
  )
}

interface StudyMaterialsGridProps {
  items:        StudyMaterial[]
  loading:      boolean
  onView:       (item: StudyMaterial) => void
  onToggleFav?: (id: string) => void
}

export function StudyMaterialsGrid({
  items,
  loading,
  onView,
  onToggleFav,
}: StudyMaterialsGridProps) {
  if (loading) {
    return (
      <div className={styles.grid}>
        {Array.from({ length: PAGE_SIZE }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    )
  }

  return (
    <div className={styles.grid}>
      {items.map((m) => (
        <MaterialCard
          key={m.id}
          item={m}
          onView={onView}
          onToggleFav={onToggleFav}
        />
      ))}
    </div>
  )
}