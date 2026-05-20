// app/(dashboard)/student/practice-exams/page.tsx - This is Practice Exam / Review Mode
'use client'

import { useCallback }  from 'react'
import { useRouter }    from 'next/navigation'
import { Search, ChevronLeft, ChevronRight, RefreshCw, X } from 'lucide-react'
import styles           from './reviews.module.css'
import ReviewCard       from '@/components/dashboard/student/practice-exams/ReviewCard'
import ReviewCardSkeleton from '@/components/dashboard/student/practice-exams/ReviewCardSkeleton'
import { useReviewsList, ALL_CATEGORIES } from '@/lib/hooks/student/practice-exams/useReviewsList'

export default function ReviewsPage() {
  const router = useRouter()
  const {
    filtered, paginated, categories, availableCount,
    search, category, setSearch, setCategory,
    page, safePage, totalPages, pageNums, setPage,
    loading, error, refetch,
  } = useReviewsList()

  const handleStartReview = useCallback(
    (examId: string) => router.push(`/student/practice-exams/${examId}`),
    [router],
  )
  const setPageIfNumber = useCallback(
    (value: number | string) => {
      if (typeof value === 'number') {setPage(value)}
    },
    [setPage],
  )

  return (
    <div className={styles.page}>

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Reviewers</h1>
          <p className={styles.subtitle}>Self-paced practice exams to sharpen your skills</p>
        </div>
        <span className={styles.availablePill}>
          <span className={styles.dot} />
          {availableCount} Available
        </span>
        <button
          type="button"
          className={styles.refreshBtn}
          onClick={() => { void refetch() }}
          disabled={loading}
          title="Refresh reviewers"
        >
          <RefreshCw size={16} className={loading ? styles.spin : undefined} />
          Refresh
        </button>
      </div>

      <div className={styles.filterRow}>
        <div className={styles.searchWrap}>
          <Search size={15} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder="Search reviewers…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className={styles.searchClear} onClick={() => setSearch('')}>
              <X size={13} />
            </button>
          )}
        </div>

        <select
          className={styles.categorySelect}
          value={category}
          onChange={e => setCategory(e.target.value)}
        >
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <p className={styles.resultCount}>
          <strong>{filtered.length}</strong> result{filtered.length !== 1 ? 's' : ''}
        </p>
      </div>

      {loading ? (
        <div className={styles.grid}>
          {Array.from({ length: 4 }).map((_, i) => <ReviewCardSkeleton key={i} />)}
        </div>
      ) : error ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>Something went wrong</p>
          <p className={styles.emptyText}>{error}</p>
        </div>
      ) : paginated.length > 0 ? (
        <div className={styles.grid}>
          {paginated.map(item => (
            <ReviewCard key={item.id} item={item} onStart={handleStartReview} />
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <Search size={40} color="#cbd5e1" />
          <p className={styles.emptyTitle}>No reviewers found</p>
          <p className={styles.emptyText}>Try adjusting your search or filters.</p>
          <button
            className={styles.emptyBtn}
            onClick={() => { setSearch(''); setCategory(ALL_CATEGORIES) }}
          >
            Clear Filters
          </button>
        </div>
      )}

      {!loading && !error && totalPages > 1 && (
        <div className={styles.pagination}>
          <span className={styles.pageInfo}>
            Page {safePage} of {totalPages} &nbsp;·&nbsp; {filtered.length} total
          </span>
          <div className={styles.pageControls}>
            <button
              className={styles.pageBtn}
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={safePage === 1}
            >
              <ChevronLeft size={15} />
            </button>
            {pageNums.map((n, i) =>
              n === '…'
                ? <span key={`e-${i}`} className={styles.pageEllipsis}>…</span>
                : <button
                    key={n}
                    className={`${styles.pageNum} ${safePage === n ? styles.pageNumActive : ''}`}
                    onClick={() => setPageIfNumber(n)}
                  >
                    {n}
                  </button>
            )}
            <button
              className={styles.pageBtn}
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={safePage === totalPages}
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
