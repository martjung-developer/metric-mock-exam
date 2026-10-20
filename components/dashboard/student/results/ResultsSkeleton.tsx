// components/dashboard/student/results/ResultsSkeleton.tsx
import styles from '@/app/(dashboard)/student/results/results.module.css'

export function ResultsSkeleton() {
  return (
    <div className={styles.resultGrid}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className={styles.resultSkeletonCard} aria-hidden="true">
          <div className={styles.resultSkeletonTop} />
          <div className={styles.resultSkeletonBody}>
            <div className={`${styles.skeleton} ${styles.resultSkeletonTitle}`} />
            <div className={`${styles.skeleton} ${styles.resultSkeletonCategory}`} />
            <div className={`${styles.skeleton} ${styles.resultSkeletonDate}`} />
            <div className={styles.resultSkeletonMetrics}>
              <div className={`${styles.skeleton} ${styles.resultSkeletonMetric}`} />
              <div className={`${styles.skeleton} ${styles.resultSkeletonMetric}`} />
            </div>
            <div className={`${styles.skeleton} ${styles.resultSkeletonTime}`} />
            <div className={`${styles.skeleton} ${styles.resultSkeletonButton}`} />
          </div>
        </div>
      ))}
    </div>
  )
}
