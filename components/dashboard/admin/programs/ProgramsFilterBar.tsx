/**
 * components/admin/programs/ProgramsFilterBar.tsx
 *
 * Pure presentational component — no Supabase, no hooks, no business logic.
 */

import { Search, X, Filter } from 'lucide-react'
import type { ProgramFilters } from '@/lib/types/admin/programs/programs.types'
import styles from '@/app/(dashboard)/admin/programs/programs.module.css'

interface ProgramsFilterBarProps {
  filters:       ProgramFilters
  degreeTypes:   string[]
  departmentOptions: string[]
  resultCount:   number
  onSearchChange:(q: string) => void
  onDegreeChange:(deg: string) => void
  onDepartmentChange:(department: string) => void
}

export function ProgramsFilterBar({
  filters,
  degreeTypes,
  departmentOptions,
  resultCount,
  onSearchChange,
  onDegreeChange,
  onDepartmentChange,
}: ProgramsFilterBarProps) {
  return (
    <div className={styles.filterBar}>
      {/* Search */}
      <div className={styles.searchWrap}>
        <Search size={15} className={styles.searchIcon} />
        <input
          className={styles.searchInput}
          placeholder="Search programs…"
          value={filters.search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {filters.search && (
          <button
            className={styles.searchClear}
            onClick={() => onSearchChange('')}
            aria-label="Clear"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Degree filter */}
      <div className={styles.filterGroup}>
        <Filter size={13} className={styles.filterIcon} />
        <select
          className={styles.filterSelect}
          value={filters.filterDeg}
          onChange={(e) => onDegreeChange(e.target.value)}
        >
          {degreeTypes.map((d) => (
            <option key={d} value={d}>
              {d === 'all' ? 'All Degrees' : d}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.filterGroup}>
        <Filter size={13} className={styles.filterIcon} />
        <select
          className={styles.filterSelect}
          value={filters.department}
          onChange={(e) => onDepartmentChange(e.target.value)}
        >
          {departmentOptions.map((d) => (
            <option key={d} value={d}>
              {d === 'all' ? 'All Departments' : d}
            </option>
          ))}
        </select>
      </div>

      {/* Result count */}
      <p className={styles.resultCount}>
        <strong>{resultCount}</strong> program{resultCount !== 1 ? 's' : ''} shown
      </p>
    </div>
  )
}
