// components/dashboard/admin/exams/results/PaginationControls.tsx
import { ChevronLeft, ChevronRight } from 'lucide-react'
import s from '@/app/(dashboard)/admin/exams/[examId]/results/results.module.css'

interface PaginationControlsProps {
  page:         number
  totalPages:   number
  totalItems:   number
  pageSize:     number
  onPageChange: (page: number) => void
}

export function PaginationControls({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: PaginationControlsProps) {
  if (totalItems === 0) {return null}

  const from = (page - 1) * pageSize + 1
  const to   = Math.min(page * pageSize, totalItems)

  return (
    <div className={s.pagination}>
      <span className={s.pageInfo}>
        Showing {from}–{to} of {totalItems} results
      </span>
      <div className={s.pageButtons}>
        <button
          className={s.pageBtn}
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft size={14} />
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            className={`${s.pageBtn} ${page === n ? s.pageBtnActive : ''}`}
            onClick={() => onPageChange(n)}
          >
            {n}
          </button>
        ))}

        <button
          className={s.pageBtn}
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}