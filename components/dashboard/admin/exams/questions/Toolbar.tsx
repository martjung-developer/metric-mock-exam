// components/dashboard/admin/exams/questions/Toolbar.tsx
// Pure UI — search input, type filter select, expand/collapse controls.

import { Filter, Search, X } from 'lucide-react'
import type { QuestionType, TypeFilter } from '@/lib/types/admin/exams/questions/questions.types'
import { GROUP_ORDER, TYPE_META } from '@/lib/utils/admin/questions/helpers'
import s from '@/app/(dashboard)/admin/exams/[examId]/questions/questions.module.css'
import type { JSX } from 'react/jsx-dev-runtime'

interface ToolbarProps {
  search:        string
  typeFilter:    TypeFilter
  onSearchChange:     (v: string)      => void
  onTypeFilterChange: (v: TypeFilter)  => void
  onExpandAll:    () => void
  onCollapseAll:  () => void
}

export function Toolbar({
  search,
  typeFilter,
  onSearchChange,
  onTypeFilterChange,
  onExpandAll,
  onCollapseAll,
}: ToolbarProps): JSX.Element {
  const isTypeFilter = (value: string): value is TypeFilter =>
    value === 'all' || GROUP_ORDER.some((type) => type === value)

  return (
    <div className={s.toolbar}>
      {/* Search */}
      <div className={s.searchWrap}>
        <Search size={14} className={s.searchIcon} />
        <input
          className={s.searchInput}
          placeholder="Search questions…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {search && (
          <button className={s.searchClear} onClick={() => onSearchChange('')}>
            <X size={13} />
          </button>
        )}
      </div>

      {/* Type filter */}
      <div className={s.filterGroup}>
        <Filter size={13} className={s.filterIcon} />
        <select
          className={s.filterSelect}
          value={typeFilter}
          onChange={(e) => {
            const value = e.target.value
            if (isTypeFilter(value)) {onTypeFilterChange(value)}
          }}
        >
          <option value="all">All Types</option>
          {GROUP_ORDER.map((t: QuestionType) => (
            <option key={t} value={t}>{TYPE_META[t].label}</option>
          ))}
        </select>
      </div>

      {/* Expand / collapse */}
      <div className={s.expandControls}>
        <button className={s.expandBtn} onClick={onExpandAll}>Expand All</button>
        <span className={s.expandDivider} />
        <button className={s.expandBtn} onClick={onCollapseAll}>Collapse All</button>
      </div>
    </div>
  )
}
