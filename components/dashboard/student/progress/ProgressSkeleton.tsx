// components/dashboard/student/progress/ProgressSkeleton.tsx
'use client'

import styles from '@/app/(dashboard)/student/progress/progress.module.css'

// ── Skeleton stat card ────────────────────────────────────────────────────────

export function SkeletonCard() {
  return (
    <div className={styles.statCard} style={{ gap: '0.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div className={styles.skeleton} style={{ width: 40, height: 40, borderRadius: 10 }} />
        <div className={styles.skeleton} style={{ width: 44, height: 22, borderRadius: 99 }} />
      </div>
      <div className={styles.skeleton} style={{ width: '50%', height: 28 }} />
      <div className={styles.skeleton} style={{ width: '70%', height: 12 }} />
      <div className={styles.skeleton} style={{ width: '55%', height: 10 }} />
    </div>
  )
}

// ── Skeleton grid (6 cards) ───────────────────────────────────────────────────

export function SkeletonStatGrid() {
  return (
    <div className={styles.statsGrid}>
      {Array.from({ length: 6 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

// ── Skeleton bar list ─────────────────────────────────────────────────────────

export function SkeletonBarList() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className={styles.skeleton}
          style={{ height: 24, borderRadius: 8, marginBottom: '0.85rem' }}
        />
      ))}
    </>
  )
}

// ── Skeleton chart ────────────────────────────────────────────────────────────

export function SkeletonChart() {
  return (
    <div
      className={styles.skeleton}
      style={{ width: '100%', height: 155, borderRadius: 8 }}
    />
  )
}

// ── Skeleton table ────────────────────────────────────────────────────────────

export function SkeletonTable() {
  return (
    <div className={styles.skeleton} style={{ height: 160, borderRadius: 8 }} />
  )
}

// ── Skeleton donut ────────────────────────────────────────────────────────────

export function SkeletonDonut() {
  return (
    <div className={styles.skeleton} style={{ height: 120, borderRadius: 8 }} />
  )
}