// components/dashboard/student/study-materials/StudyMaterialsFilters.tsx
import { Search, X, Loader2 } from 'lucide-react'
import type { StudyMaterialFilters, TypeFilter } from '@/lib/types/student/study-materials/study-materials'
import styles from '@/app/(dashboard)/student/study-materials/study-materials.module.css'

interface StudyMaterialsFiltersProps {
  filters:       StudyMaterialFilters
  categoryNames: string[]
  filteredCount: number
  loading:       boolean
  onSearch:      (v: string) => void
  onCategory:    (v: string) => void
  onType:        (v: TypeFilter) => void
}

export function StudyMaterialsFilters({
  filters,
  categoryNames,
  filteredCount,
  loading,
  onSearch,
  onCategory,
  onType,
}: StudyMaterialsFiltersProps) {
  return (
    <div className={styles.filterRow}>
      {/* Search */}
      <div className={styles.searchWrap}>
        <Search size={15} strokeWidth={2.2} className={styles.searchIcon} />
        <input
          className={styles.searchInput}
          type="text"
          placeholder="Search materials…"
          value={filters.search}
          onChange={(e) => onSearch(e.target.value)}
        />
        {filters.search && (
          <button
            className={styles.searchClear}
            onClick={() => onSearch('')}
            aria-label="Clear search"
          >
            <X size={13} strokeWidth={2.5} />
          </button>
        )}
      </div>

      {/* Category */}
      <select
        className={styles.filterSelect}
        value={filters.category}
        onChange={(e) => onCategory(e.target.value)}
      >
        {categoryNames.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      {/* Type */}
      <select
        className={styles.filterSelect}
        value={filters.type}
        onChange={(e) => onType(e.target.value as TypeFilter)}
      >
        <option value="All Types">All Types</option>
        <option value="document">Document</option>
        <option value="video">Video</option>
        <option value="notes">Notes</option>
      </select>

      {/* Count */}
      <p className={styles.resultCount}>
        {loading
          ? <Loader2 size={13} className={styles.spinning} />
          : <><strong>{filteredCount}</strong> result{filteredCount !== 1 ? 's' : ''}</>}
      </p>
    </div>
  )
}