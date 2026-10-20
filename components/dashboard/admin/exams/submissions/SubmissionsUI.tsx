// components/dashboard/admin/exams/submissions/SubmissionsUI.tsx
// Co-located small components: StatusPills, SubmissionsFilters, Pagination, EmptyState, LoadingSkeleton

import { Search, X, Filter, ChevronLeft, ChevronRight, ClipboardList, AlignLeft } from 'lucide-react'
import type { SubmissionStatus } from '@/lib/types/admin/exams/submissions/submission.types'
import { STATUS_CONFIG, PAGE_SIZE } from '@/lib/utils/admin/submissions/constants'
import type { Submission } from '@/lib/types/admin/exams/submissions/submission.types'
import s from '@/app/(dashboard)/admin/exams/[examId]/submissions/submissions.module.css'

// ── StatusPills ───────────────────────────────────────────────────────────────

interface StatusPillsProps { submissions: Submission[] }

export function StatusPills({ submissions }: StatusPillsProps) {
  return (
    <div className={s.statsRow}>
      {(Object.entries(STATUS_CONFIG) as [SubmissionStatus, typeof STATUS_CONFIG[SubmissionStatus]][]).map(([key, cfg]) => {
        const count = submissions.filter(sub => sub.status === key).length
        return (
          <div key={key} className={`${s.statPill} ${s[`statPill_${cfg.color}`]}`}>
            <cfg.icon size={13} />
            <span>{cfg.label}</span>
            <strong>{count}</strong>
          </div>
        )
      })}
    </div>
  )
}

// ── SubmissionsFilters ────────────────────────────────────────────────────────

interface SubmissionsFiltersProps {
  search:          string
  statusFilter:    SubmissionStatus | 'all'
  filteredCount:   number
  onSearch:        (v: string) => void
  onStatusFilter:  (v: SubmissionStatus | 'all') => void
}

export function SubmissionsFilters({
  search, statusFilter, filteredCount, onSearch, onStatusFilter,
}: SubmissionsFiltersProps) {
  return (
    <div className={s.filterBar}>
      <div className={s.searchWrap}>
        <Search size={14} className={s.searchIcon} />
        <input
          className={s.searchInput}
          placeholder="Search by name, email, or student ID…"
          value={search}
          onChange={e => onSearch(e.target.value)}
        />
        {search && (
          <button className={s.searchClear} onClick={() => onSearch('')}>
            <X size={13} />
          </button>
        )}
      </div>
      <div className={s.filterGroup}>
        <Filter size={13} className={s.filterIcon} />
        <select
          className={s.filterSelect}
          value={statusFilter}
          onChange={e => onStatusFilter(e.target.value as SubmissionStatus | 'all')}
        >
          <option value="all">All Status</option>
          {(Object.entries(STATUS_CONFIG) as [SubmissionStatus, typeof STATUS_CONFIG[SubmissionStatus]][]).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>
      <p className={s.resultCount}>
        <strong>{filteredCount}</strong> result{filteredCount !== 1 ? 's' : ''}
      </p>
    </div>
  )
}

// ── Pagination ────────────────────────────────────────────────────────────────

interface PaginationProps {
  page:        number
  totalPages:  number
  totalItems:  number
  onPage:      (p: number) => void
}

export function Pagination({ page, totalPages, totalItems, onPage }: PaginationProps) {
  if (totalItems === 0) {return null}
  return (
    <div className={s.pagination}>
      <span className={s.pageInfo}>
        Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalItems)} of {totalItems}
      </span>
      <div className={s.pageButtons}>
        <button className={s.pageBtn} disabled={page === 1} onClick={() => onPage(page - 1)}>
          <ChevronLeft size={14} />
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
          <button
            key={n}
            className={`${s.pageBtn} ${page === n ? s.pageBtnActive : ''}`}
            onClick={() => onPage(n)}
          >
            {n}
          </button>
        ))}
        <button className={s.pageBtn} disabled={page === totalPages} onClick={() => onPage(page + 1)}>
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}

// ── EmptyState ────────────────────────────────────────────────────────────────

export function EmptyState() {
  return (
    <div className={s.emptyState}>
      <div className={s.emptyIcon}><ClipboardList size={22} color="var(--text-muted)" /></div>
      <p className={s.emptyTitle}>No submissions found</p>
      <p className={s.emptySub}>Submissions appear once students begin the exam.</p>
    </div>
  )
}

export function EmptyAnswers() {
  return (
    <div className={s.emptyState}>
      <div className={s.emptyIcon}><AlignLeft size={22} color="var(--text-muted)" /></div>
      <p className={s.emptyTitle}>No answers recorded</p>
      <p className={s.emptySub}>This submission has no answers yet.</p>
    </div>
  )
}

// ── LoadingSkeleton ───────────────────────────────────────────────────────────

export function LoadingSkeleton() {
  return (
    <>
      {Array.from({ length: PAGE_SIZE }).map((_, i) => (
        <tr key={i} className={s.skeletonRow}>
          <td>
            <div className={s.skelCell}>
              <div className={`${s.skeleton} ${s.skelAvatar}`} />
              <div>
                <div className={`${s.skeleton} ${s.skelText}`} style={{ width: 130 }} />
                <div className={`${s.skeleton} ${s.skelText}`} style={{ width: 100, marginTop: 5 }} />
              </div>
            </div>
          </td>
          {[70, 90, 60, 80, 50].map((w, j) => (
            <td key={j}><div className={`${s.skeleton} ${s.skelText}`} style={{ width: w }} /></td>
          ))}
          <td>
            <div className={s.skelActions}>
              <div className={`${s.skeleton} ${s.skelBtn}`} />
            </div>
          </td>
        </tr>
      ))}
    </>
  )
}