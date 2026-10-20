// components/dashboard/student/help/LoadingState.tsx
// Pure UI — full-page loading skeleton for the Help page.

import React from 'react'
import styles from '@/app/(dashboard)/student/help/help.module.css'

export default function LoadingState() {
  return (
    <div className={styles.page}>
      <div className={styles.hero} style={{ minHeight: 180 }}>
        <div className={styles.heroInner}>
          <div className={styles.skeletonCat} style={{ width: 120, marginBottom: 12 }} />
          <div className={styles.skeletonCat} style={{ width: 280, marginBottom: 8 }} />
          <div className={styles.skeletonCat} style={{ width: 380, height: 42 }} />
        </div>
      </div>
      <div className={styles.body}>
        <section className={styles.section}>
          <div className={styles.catGrid}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className={styles.skeletonCat} />
            ))}
          </div>
        </section>
        <section className={styles.section}>
          <div className={styles.faqList}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={styles.skeletonFaq} />
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}