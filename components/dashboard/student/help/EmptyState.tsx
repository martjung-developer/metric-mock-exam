// components/dashboard/student/help/EmptyState.tsx
// Generic empty-state used when filtered FAQs return zero results.

import React from 'react'
import { Search } from 'lucide-react'
import styles from '@/app/(dashboard)/student/help/help.module.css'

interface EmptyStateProps {
  onReset: () => void
}

export default function EmptyState({ onReset }: EmptyStateProps) {
  return (
    <div className={styles.emptyFaq}>
      <Search size={36} strokeWidth={1.4} color="#cbd5e1" />
      <p className={styles.emptyTitle}>No results found</p>
      <p className={styles.emptyText}>
        Try a different keyword or select another topic above.
      </p>
      <button className={styles.emptyReset} onClick={onReset}>
        Clear filters
      </button>
    </div>
  )
}