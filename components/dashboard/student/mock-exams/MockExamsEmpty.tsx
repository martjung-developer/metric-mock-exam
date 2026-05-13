// components/dashboard/student/mock-exams/MockExamsEmpty.tsx
import { Search } from 'lucide-react'
import styles from '@/app/(dashboard)/student/mock-exams/mock-exams.module.css'

interface Props {
  onClear: () => void
}

export function MockExamsEmpty({ onClear }: Props) {
  return (
    <div className={styles.emptyState}>
      <Search size={40} strokeWidth={1.4} color="#cbd5e1" />
      <p className={styles.emptyTitle}>No mock exams found</p>
      <p className={styles.emptyText}>Try adjusting your search or category filter.</p>
      <button className={styles.emptyBtn} onClick={onClear}>
        Clear Filters
      </button>
    </div>
  )
}

export function MockExamsSkeleton() {
  return (
    <div className={styles.grid}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className={styles.examCard} style={{ minHeight: 260 }}>
          <div style={{ height: 4, background: '#e4ecf3', borderRadius: '13px 13px 0 0' }} />
          <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: '#f0f4f8' }} />
              <div style={{ width: 80, height: 20, borderRadius: 99, background: '#f0f4f8' }} />
            </div>
            <div style={{ width: '40%', height: 12, borderRadius: 6, background: '#f0f4f8' }} />
            <div style={{ width: '80%', height: 16, borderRadius: 6, background: '#f0f4f8' }} />
            <div style={{ width: '55%', height: 12, borderRadius: 99, background: '#f0f4f8' }} />
          </div>
        </div>
      ))}
    </div>
  )
}
