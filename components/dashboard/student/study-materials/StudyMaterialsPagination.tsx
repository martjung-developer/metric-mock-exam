// components/dashboard/student/study-materials/StudyMaterialsPagination.tsx
import { ChevronLeft, ChevronRight } from 'lucide-react'
import styles from '@/app/(dashboard)/student/study-materials/study-materials.module.css'

interface StudyMaterialsPaginationProps {
  safePage: number
  totalPages: number
  totalCount: number
  pageNums: (number | '…')[]
  onPageChange: (n: number) => void
}

export function StudyMaterialsPagination({
  safePage,
  totalPages,
  totalCount,
  pageNums,
  onPageChange,
}: StudyMaterialsPaginationProps) {
  if (totalPages <= 1) {return null}

  return (
    <div className={styles.pagination}>
      <span className={styles.pageInfo}>
        Page {safePage} of {totalPages} · {totalCount} total
      </span>
      <div className={styles.pageControls}>
        <button
          className={styles.pageBtn}
          onClick={() => onPageChange(Math.max(1, safePage - 1))}
          disabled={safePage === 1}
          aria-label="Previous page"
        >
          <ChevronLeft size={15} strokeWidth={2.5} />
        </button>

        {pageNums.map((n, i) =>
          typeof n === 'string' ? (
            <span key={`e-${i}`} className={styles.pageEllipsis}>…</span>
          ) : (
            <button
              key={n}
              className={`${styles.pageNum} ${safePage === n ? styles.pageNumActive : ''}`}
              onClick={() => onPageChange(n)}
              aria-current={safePage === n ? 'page' : undefined}
            >
              {n}
            </button>
          )
        )}

        <button
          className={styles.pageBtn}
          onClick={() => onPageChange(Math.min(totalPages, safePage + 1))}
          disabled={safePage === totalPages}
          aria-label="Next page"
        >
          <ChevronRight size={15} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  )
}

