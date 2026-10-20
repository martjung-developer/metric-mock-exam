/**
 * components/admin/programs/ProgramSkeletonCard.tsx
 *
 * Shimmer placeholder rendered while data is loading.
 * Pure UI — no props required.
 */

import styles from '@/app/(dashboard)/admin/programs/programs.module.css'

export function ProgramSkeletonCard() {
  return (
    <div className={styles.skeletonCard}>
      <div className={styles.skeleton} style={{ height: 3 }} />
      <div
        style={{
          padding:    '1.1rem 1.25rem 0.75rem',
          display:    'flex',
          alignItems: 'flex-start',
          gap:        '0.75rem',
        }}
      >
        <div
          className={styles.skeleton}
          style={{ width: 40, height: 40, borderRadius: 11, flexShrink: 0 }}
        />
        <div
          style={{
            flex:          1,
            display:       'flex',
            flexDirection: 'column',
            gap:           6,
          }}
        >
          <div className={styles.skeleton} style={{ width: '30%', height: 10 }} />
          <div className={styles.skeleton} style={{ width: '70%', height: 14 }} />
          <div className={styles.skeleton} style={{ width: '55%', height: 11 }} />
        </div>
      </div>
      <div style={{ padding: '0 1.25rem 1rem' }}>
        <div
          className={styles.skeleton}
          style={{ height: 58, borderRadius: 7 }}
        />
      </div>
      <div
        style={{
          padding:    '0.85rem 1.25rem',
          borderTop:  '1.5px solid #edf0f5',
          display:    'flex',
          gap:        '0.45rem',
        }}
      >
        <div className={styles.skeleton} style={{ flex: 1, height: 32, borderRadius: 9 }} />
        <div className={styles.skeleton} style={{ flex: 1, height: 32, borderRadius: 9 }} />
        <div className={styles.skeleton} style={{ flex: 1, height: 32, borderRadius: 9 }} />
      </div>
    </div>
  )
}