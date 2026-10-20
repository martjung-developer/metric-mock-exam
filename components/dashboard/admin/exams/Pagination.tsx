// components/dashboard/admin/exams/Pagination.tsx
import { ChevronLeft, ChevronRight } from 'lucide-react'
import s from '@/app/(dashboard)/admin/exams/exams.module.css'

interface PaginationProps {
  page:         number
  totalPages:   number
  totalItems:   number
  pageSize:     number
  onPageChange: (page: number) => void
}

function buildPageNums(page: number, totalPages: number): (number | '…')[] {
  const nums: (number | '…')[] = []
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) {nums.push(i)}
    return nums
  }
  nums.push(1)
  if (page > 3) {nums.push('…')}
  for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
    nums.push(i)
  }
  if (page < totalPages - 2) {nums.push('…')}
  nums.push(totalPages)
  return nums
}

export function Pagination({ page, totalPages, totalItems, pageSize, onPageChange }: PaginationProps) {
  if (totalItems === 0) {return null}

  const pageNums = buildPageNums(page, totalPages)
  const from     = (page - 1) * pageSize + 1
  const to       = Math.min(page * pageSize, totalItems)

  return (
    <div className={s.pagination}>
      <span className={s.pageInfo}>
        Showing {from}–{to} of {totalItems} exams
      </span>
      <div className={s.pageButtons}>
        <button
          className={s.pageBtn}
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft size={14} />
        </button>

        {pageNums.map((n, i) =>
          n === '…'
            ? <span key={`d${i}`} className={s.pageDots}>…</span>
            : (
              <button
                key={n}
                className={`${s.pageBtn} ${page === n ? s.pageBtnActive : ''}`}
                onClick={() => onPageChange(n as number)}
              >
                {n}
              </button>
            ),
        )}

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