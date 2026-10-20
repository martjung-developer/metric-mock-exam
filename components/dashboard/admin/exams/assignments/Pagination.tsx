/**
 * components/dashboard/admin/exams/assignments/Pagination.tsx
 *
 * Pure presentational component.
 * Renders previous/next/page-number controls.
 */

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { PAGE_SIZE }                  from '@/lib/hooks/admin/exams/assignments/useAssignments'
import s from '@/app/(dashboard)/admin/exams/[examId]/assignments/assignments.module.css'

interface PaginationProps {
  page:        number
  totalPages:  number
  totalItems:  number
  onPageChange:(n: number) => void
}

export function Pagination({
  page,
  totalPages,
  totalItems,
  onPageChange,
}: PaginationProps) {
  if (totalItems === 0) {return null}

  const start = (page - 1) * PAGE_SIZE + 1
  const end   = Math.min(page * PAGE_SIZE, totalItems)

  return (
    <div className={s.pagination}>
      <span className={s.pageInfo}>
        Showing {start}–{end} of {totalItems}
      </span>

      <div className={s.pageButtons}>
        <button
          className={s.pageBtn}
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft size={14} />
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            className={`${s.pageBtn} ${page === n ? s.pageBtnActive : ''}`}
            onClick={() => onPageChange(n)}
            aria-current={page === n ? 'page' : undefined}
          >
            {n}
          </button>
        ))}

        <button
          className={s.pageBtn}
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}