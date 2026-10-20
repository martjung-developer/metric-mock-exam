// components/dashboard/admin/exams/results/ResultsFilters.tsx
import { Search, X, Filter, CheckSquare } from 'lucide-react'
import type { PassFilter, StatusFilter } from '@/lib/types/admin/exams/results/results.types'
import s from '@/app/(dashboard)/admin/exams/[examId]/results/results.module.css'

interface ResultsFiltersProps {
  search:        string
  passFilter:    PassFilter
  statusFilter:  StatusFilter
  totalFiltered: number
  onSearch:      (v: string) => void
  onPassChange:  (v: PassFilter) => void
  onStatusChange:(v: StatusFilter) => void
}

export function ResultsFilters({
  search,
  passFilter,
  statusFilter,
  totalFiltered,
  onSearch,
  onPassChange,
  onStatusChange,
}: ResultsFiltersProps) {
  return (
    <div className={s.filterBar}>
      {/* Search */}
      <div className={s.searchWrap}>
        <Search size={14} className={s.searchIcon} />
        <input
          className={s.searchInput}
          placeholder="Search by name, email, or student ID…"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
        />
        {search && (
          <button className={s.searchClear} onClick={() => onSearch('')}>
            <X size={13} />
          </button>
        )}
      </div>

      {/* Pass/Fail filter */}
      <div className={s.filterGroup}>
        <Filter size={13} className={s.filterIcon} />
        <select
          className={s.filterSelect}
          value={passFilter}
          onChange={(e) => onPassChange(e.target.value as PassFilter)}
        >
          <option value="all">All Results</option>
          <option value="passed">Passed Only</option>
          <option value="failed">Failed Only</option>
        </select>
      </div>

      {/* Status filter */}
      <div className={s.filterGroup}>
        <CheckSquare size={13} className={s.filterIcon} />
        <select
          className={s.filterSelect}
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value as StatusFilter)}
        >
          <option value="all">All Status</option>
          <option value="reviewed">Reviewed</option>
          <option value="released">Released</option>
        </select>
      </div>

      <p className={s.resultCount}>
        <strong>{totalFiltered}</strong> result{totalFiltered !== 1 ? 's' : ''}
      </p>
    </div>
  )
}