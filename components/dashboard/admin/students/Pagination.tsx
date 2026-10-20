// components/dashboard/admin/students/Pagination.tsx
import { ChevronLeft, ChevronRight } from 'lucide-react'
import styles from '@/app/(dashboard)/admin/students/students.module.css'

interface PaginationProps {
  safePage:    number
  totalPages:  number
  totalItems:  number
  onPageChange:(n: number) => void
}

export function Pagination({ safePage, totalPages, totalItems, onPageChange }: PaginationProps) {
  if (totalPages <= 1) {return null}
  return (
    <div className={styles.pagination}>
      <span className={styles.pageInfo}>Page {safePage} of {totalPages} · {totalItems} total</span>
      <div className={styles.pageControls}>
        <button className={styles.pageBtn} onClick={() => onPageChange(Math.max(1, safePage - 1))} disabled={safePage === 1}><ChevronLeft size={15} /></button>
        <button className={styles.pageBtn} onClick={() => onPageChange(Math.min(totalPages, safePage + 1))} disabled={safePage === totalPages}><ChevronRight size={15} /></button>
      </div>
    </div>
  )
}