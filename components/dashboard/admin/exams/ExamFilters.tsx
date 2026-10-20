// components/dashboard/admin/exams/ExamFilters.tsx
import { Search, X, Filter, Tag, GraduationCap, CheckCircle } from 'lucide-react'
import type { ExamFilters, ExamType, ProgramOption } from '@/lib/types/admin/exams/exam.types'
import s from '@/app/(dashboard)/admin/exams/exams.module.css'

interface ExamFiltersProps {
  filters:        ExamFilters
  categoryNames:  string[]
  programs:       ProgramOption[]
  hasFilters:     boolean
  onFiltersChange: (patch: Partial<ExamFilters>) => void
  onClearFilters:  () => void
}

export function ExamFiltersBar({
  filters,
  categoryNames,
  programs,
  hasFilters,
  onFiltersChange,
  onClearFilters,
}: ExamFiltersProps) {
  return (
    <div className={s.filterBar}>
      {/* Search */}
      <div className={s.searchWrap}>
        <Search size={14} className={s.searchIcon} />
        <input
          className={s.searchInput}
          placeholder="Search exams…"
          value={filters.search}
          onChange={(e) => onFiltersChange({ search: e.target.value })}
        />
        {filters.search && (
          <button
            className={s.searchClear}
            onClick={() => onFiltersChange({ search: '' })}
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Category */}
      <div className={s.filterGroup}>
        <Filter size={13} className={s.filterIcon} />
        <select
          className={s.filterSelect}
          value={filters.category}
          onChange={(e) => onFiltersChange({ category: e.target.value })}
        >
          {categoryNames.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Exam type */}
      <div className={s.filterGroup}>
        <Tag size={13} className={s.filterIcon} />
        <select
          className={s.filterSelect}
          value={filters.examType}
          onChange={(e) =>
            onFiltersChange({ examType: e.target.value as ExamType | 'all' })
          }
        >
          <option value="all">All Types</option>
          <option value="mock">Mock Exam</option>
          <option value="practice">Reviewer</option>
        </select>
      </div>

      {/* Program */}
      <div className={s.filterGroup}>
        <GraduationCap size={13} className={s.filterIcon} />
        <select
          className={s.filterSelect}
          value={filters.programId}
          onChange={(e) => onFiltersChange({ programId: e.target.value })}
        >
          <option value="all">All Programs</option>
          {programs.map((p) => (
            <option key={p.id} value={p.id}>
              {p.code}
            </option>
          ))}
        </select>
      </div>

      {/* Status */}
      <div className={s.filterGroup}>
        <CheckCircle size={13} className={s.filterIcon} />
        <select
          className={s.filterSelect}
          value={filters.status}
          onChange={(e) =>
            onFiltersChange({
              status: e.target.value as ExamFilters['status'],
            })
          }
        >
          <option value="all">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      {hasFilters && (
        <button className={s.clearFilters} onClick={onClearFilters}>
          <X size={12} /> Clear
        </button>
      )}
    </div>
  )
}
