// components/dashboard/student/results/ResultsFilters.tsx
import { Search, X } from 'lucide-react'
import type { ExamTypeFilter, StatusFilter } from '@/lib/types/student/results/results.types'
import styles from '@/app/(dashboard)/student/results/results.module.css'

interface Props {
  tab:              ExamTypeFilter
  search:           string
  statusFilter:     StatusFilter
  categoryFilter:   string
  categories:       string[]
  resultCount:      number
  onTab:            (v: ExamTypeFilter) => void
  onSearch:         (v: string)         => void
  onStatusFilter:   (v: StatusFilter)   => void
  onCategoryFilter: (v: string)         => void
}

export function ResultsFilters({
  tab, search, statusFilter, categoryFilter, categories, resultCount,
  onTab, onSearch, onStatusFilter, onCategoryFilter,
}: Props) {
  return (
    <div className={styles.filterRow}>
      {/* Tab group */}
      <div className={styles.tabGroup}>
        {(['all', 'mock', 'practice'] as ExamTypeFilter[]).map((t) => (
          <button
            key={t}
            className={`${styles.tabBtn} ${tab === t ? styles.tabBtnActive : ''}`}
            onClick={() => onTab(t)}
          >
            {t === 'all' ? 'All Exams' : t === 'mock' ? 'Mock Exams' : 'Reviewers'}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className={styles.searchWrap}>
        <span className={styles.searchIcon}><Search size={14} /></span>
        <input
          className={styles.searchInput}
          type="text"
          placeholder="Search exams or categories…"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
        />
        {search && (
          <button className={styles.searchClear} onClick={() => onSearch('')}>
            <X size={13} />
          </button>
        )}
      </div>

      {/* Category select */}
      <select
        className={styles.filterSelect}
        value={categoryFilter}
        onChange={(e) => onCategoryFilter(e.target.value)}
      >
        <option value="all">All Categories</option>
        {categories.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>

      {/* Status select */}
      <select
        className={styles.filterSelect}
        value={statusFilter}
        onChange={(e) => onStatusFilter(e.target.value as StatusFilter)}
      >
        <option value="all">All Statuses</option>
        <option value="passed">Passed</option>
        <option value="failed">Failed</option>
      </select>

      <p className={styles.resultCount}>
        <strong>{resultCount}</strong> result{resultCount !== 1 ? 's' : ''}
      </p>
    </div>
  )
}
