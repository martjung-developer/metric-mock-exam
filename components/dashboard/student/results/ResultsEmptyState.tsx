// components/dashboard/student/results/ResultsEmptyState.tsx
import { useRouter }  from 'next/navigation'
import { ClipboardList, FileText } from 'lucide-react'
import type { ExamTypeFilter, StatusFilter } from '@/lib/types/student/results/results.types'
import styles from '@/app/(dashboard)/student/results/results.module.css'

interface Props {
  search:         string
  statusFilter:   StatusFilter
  categoryFilter: string
  tab:            ExamTypeFilter
}

export function ResultsEmptyState({ search, statusFilter, categoryFilter, tab }: Props) {
  const router = useRouter()
  const hasFilters = !!(search || statusFilter !== 'all' || categoryFilter !== 'all' || tab !== 'all')

  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyIconWrap}>
        <ClipboardList size={26} color="#94a3b8" strokeWidth={1.5} />
      </div>
      <p className={styles.emptyTitle}>
        {hasFilters ? 'No matching results' : 'No released results yet'}
      </p>
      <p className={styles.emptyText}>
        {hasFilters
          ? 'Try adjusting your filters.'
          : 'Your scores will appear here once your faculty reviews and releases your exam results.'}
      </p>
      {!hasFilters && (
        <button className={styles.emptyBtn} onClick={() => router.push('/student/mock-exams')}>
          <FileText size={14} /> Take a Mock Exam
        </button>
      )}
    </div>
  )
}