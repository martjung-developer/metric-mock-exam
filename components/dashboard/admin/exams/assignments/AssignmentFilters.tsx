/**
 * components/dashboard/admin/exams/assignments/AssignmentFilters.tsx
 *
 * Pure presentational component.
 * Renders the search input + status filter select.
 */

import { Search, X, Filter } from 'lucide-react'

import { STATUS_CONFIG }  from './StatusPills'
import type {
  AssignmentFiltersState,
  DisplaySubmissionStatus,
} from '@/lib/types/admin/exams/assignments/assignments.types'

import s from '@/app/(dashboard)/admin/exams/[examId]/assignments/assignments.module.css'

interface AssignmentFiltersProps {
  filters:          AssignmentFiltersState
  onSearchChange:   (q: string) => void
  onStatusChange:   (v: DisplaySubmissionStatus | 'all') => void
}

export function AssignmentFilters({
  filters,
  onSearchChange,
  onStatusChange,
}: AssignmentFiltersProps) {
  return (
    <div className={s.filterBar}>
      {/* Search */}
      <div className={s.searchWrap}>
        <Search size={14} className={s.searchIcon} />
        <input
          className={s.searchInput}
          placeholder="Search by name, email, student ID or program…"
          value={filters.search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {filters.search && (
          <button
            className={s.searchClear}
            onClick={() => onSearchChange('')}
            aria-label="Clear search"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Status filter */}
      <div className={s.filterGroup}>
        <Filter size={13} className={s.filterIcon} />
        <select
          className={s.filterSelect}
          value={filters.statusFilter}
          onChange={(e) =>
            onStatusChange(e.target.value as DisplaySubmissionStatus | 'all')
          }
          aria-label="Filter by status"
        >
          <option value="all">All Status</option>
          {(
            Object.entries(STATUS_CONFIG) as [DisplaySubmissionStatus, (typeof STATUS_CONFIG)[DisplaySubmissionStatus]][]
          ).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}