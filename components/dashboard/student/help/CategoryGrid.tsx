// components/dashboard/student/help/CategoryGrid.tsx
// Pure UI — renders the category filter strip with skeleton loading.

import React from 'react'
import { ClipboardList } from 'lucide-react'
import type { FaqCategoryWithCount } from '@/lib/types/student/help/faq.types'
import styles from '@/app/(dashboard)/student/help/help.module.css'

interface CategoryGridProps {
  categories:      FaqCategoryWithCount[]
  activeCategory:  string
  loading:         boolean
  onSelect:        (key: string) => void
}

export default function CategoryGrid({
  categories,
  activeCategory,
  loading,
  onSelect,
}: CategoryGridProps) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHead}>
        <ClipboardList size={16} strokeWidth={2} className={styles.sectionIcon} />
        <h2 className={styles.sectionTitle}>Browse by Topic</h2>
      </div>

      {loading ? (
        <div className={styles.catGrid}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={styles.skeletonCat} />
          ))}
        </div>
      ) : (
        <div className={styles.catGrid}>
          {categories.map((cat) => {
            const Icon     = cat.icon
            const isActive = activeCategory === cat.key
            return (
              <button
                key={cat.key}
                className={`${styles.catCard} ${isActive ? styles.catCardActive : ''}`}
                onClick={() => onSelect(cat.key)}
              >
                <div className={styles.catIcon} style={{ background: cat.bg }}>
                  <Icon size={18} color={cat.color} strokeWidth={2} />
                </div>
                <span className={styles.catLabel}>{cat.label}</span>
                <span className={styles.catCount}>{cat.count}</span>
              </button>
            )
          })}
        </div>
      )}
    </section>
  )
}