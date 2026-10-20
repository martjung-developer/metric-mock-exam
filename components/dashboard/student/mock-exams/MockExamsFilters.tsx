// components/dashboard/student/mock-exams/MockExamsFilters.tsx
import { Search, X } from 'lucide-react'
import styles from '@/app/(dashboard)/student/mock-exams/mock-exams.module.css'

type SortOption = 'newest' | 'oldest' | 'duration'

interface Props {
  search:      string
  setSearch:   (v: string) => void
  category:    string
  setCategory: (v: string) => void
  sort:        SortOption
  setSort:     (v: SortOption) => void
  categories:  string[]
  totalFound:  number
}

export function MockExamsFilters({
  search, setSearch, category, setCategory, sort, setSort, categories, totalFound,
}: Props) {
  return (
    <div className={styles.filterRow}>
      <div className={styles.searchWrap}>
        <Search size={15} strokeWidth={2.2} className={styles.searchIcon} />
        <input
          className={styles.searchInput}
          type="text"
          placeholder="Search mock exams…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button className={styles.searchClear} onClick={() => setSearch('')} aria-label="Clear search">
            <X size={13} strokeWidth={2.5} />
          </button>
        )}
      </div>

      <select
        className={styles.categorySelect}
        value={category}
        onChange={(e) => setCategory(e.target.value)}
      >
        {categories.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>

      <select
        className={styles.sortSelect}
        value={sort}
        onChange={(e) => setSort(e.target.value as SortOption)}
      >
        <option value="newest">Newest First</option>
        <option value="oldest">Oldest First</option>
        <option value="duration">By Duration</option>
      </select>

      <p className={styles.resultCount}>
        <strong>{totalFound}</strong> exam{totalFound !== 1 ? 's' : ''} found
      </p>
    </div>
  )
}