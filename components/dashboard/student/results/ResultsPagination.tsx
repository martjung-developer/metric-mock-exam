// components/dashboard/student/results/ResultsPagination.tsx
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { PAGE_SIZE } from '@/lib/constants/student/results/results'
import styles from '@/app/(dashboard)/student/results/results.module.css'

interface Props {
  page:        number
  totalPages:  number
  total:       number
  pageNumbers: (number | '…')[]
  onPage:      (p: number) => void
}

export function ResultsPagination({ page, totalPages, total, pageNumbers, onPage }: Props) {
  return (
    <div className={styles.pagination}>
      <p className={styles.pageInfo}>
        Showing {Math.min((page - 1) * PAGE_SIZE + 1, total)}–{Math.min(page * PAGE_SIZE, total)} of {total}
      </p>
      <div className={styles.pageControls}>
        <button
          className={styles.pageBtn}
          disabled={page === 1}
          onClick={() => onPage(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft size={15} />
        </button>

        {pageNumbers.map((p, i) =>
          p === '…'
            ? <span key={`ell-${i}`} className={styles.pageEllipsis}>…</span>
            : (
              <button
                key={p}
                className={`${styles.pageNum} ${page === p ? styles.pageNumActive : ''}`}
                onClick={() => onPage(p as number)}
              >
                {p}
              </button>
            ),
        )}

        <button
          className={styles.pageBtn}
          disabled={page === totalPages}
          onClick={() => onPage(page + 1)}
          aria-label="Next page"
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  )
}