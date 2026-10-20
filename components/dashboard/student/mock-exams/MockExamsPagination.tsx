// components/dashboard/student/mock-exams/MockExamsPagination.tsx
import { ChevronLeft, ChevronRight } from 'lucide-react'
import styles from '@/app/(dashboard)/student/mock-exams/mock-exams.module.css'

interface Props {
  page:       number
  totalPages: number
  total:      number
  setPage:    (p: number) => void
}

export function MockExamsPagination({ page, totalPages, total, setPage }: Props) {
  const pageNums: (number | '…')[] = []
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) {pageNums.push(i)}
  } else {
    pageNums.push(1)
    if (page > 3) {pageNums.push('…')}
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {pageNums.push(i)}
    if (page < totalPages - 2) {pageNums.push('…')}
    pageNums.push(totalPages)
  }

  return (
    <div className={styles.pagination}>
      <span className={styles.pageInfo}>
        Page {page} of {totalPages} &nbsp;·&nbsp; {total} total
      </span>
      <div className={styles.pageControls}>
        <button
          className={styles.pageBtn}
          onClick={() => setPage(Math.max(1, page - 1))}
          disabled={page === 1}
          aria-label="Previous page"
        >
          <ChevronLeft size={15} strokeWidth={2.5} />
        </button>
        {pageNums.map((n, i) =>
          n === '…'
            ? <span key={`e-${i}`} className={styles.pageEllipsis}>…</span>
            : (
              <button
                key={n}
                className={`${styles.pageNum} ${page === n ? styles.pageNumActive : ''}`}
                onClick={() => setPage(n as number)}
              >
                {n}
              </button>
            ),
        )}
        <button
          className={styles.pageBtn}
          onClick={() => setPage(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          aria-label="Next page"
        >
          <ChevronRight size={15} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  )
}