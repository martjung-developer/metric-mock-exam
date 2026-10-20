/**
 * components/dashboard/admin/students/StudentsFilters.tsx
 * Pure presentational — no Supabase, no hooks, no business logic.
 */

import { Search, X }            from 'lucide-react'
import { YEAR_OPTIONS }         from '@/lib/utils/admin/students/constants'
import type { YearOption }      from '@/lib/utils/admin/students/constants'
import styles from '@/app/(dashboard)/admin/students/students.module.css'

interface StudentsFiltersProps {
  search:          string
  yearFilter:      YearOption
  onSearchChange:  (q: string) => void
  onYearChange:    (year: YearOption) => void
}

export function StudentsFilters({
  search,
  yearFilter,
  onSearchChange,
  onYearChange,
}: StudentsFiltersProps) {
  return (
    <div className={styles.controls}>
      {/* Search */}
      <div className={styles.searchWrap}>
        <Search size={15} className={styles.searchIcon} />
        <input
          className={styles.searchInput}
          type="text"
          placeholder="Search by name, email, program, student ID…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Search students"
        />
        {search && (
          <button
            className={styles.searchClear}
            onClick={() => onSearchChange('')}
            aria-label="Clear search"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Year level select */}
      <select
        className={styles.yearSelect}
        value={yearFilter}
        onChange={(e) => onYearChange(e.target.value as YearOption)}
        aria-label="Filter by year level"
      >
        {YEAR_OPTIONS.map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
    </div>
  )
}