// app/(dashboard)/student/mock-exams/page.tsx
//
// FIXED:
//  1. Refresh button wired to useMockExams.refresh()
//  2. lockedCount shown in header
// ─────────────────────────────────────────────────────────────────────────────

'use client'

import { useRouter }             from 'next/navigation'
import { RefreshCw }             from 'lucide-react'
import { useMockExams }          from '@/lib/hooks/student/mock-exams/useMockExams'
import { MockExamsFilters }      from '@/components/dashboard/student/mock-exams/MockExamsFilters'
import { MockExamsGrid }         from '@/components/dashboard/student/mock-exams/MockExamsGrid'
import { MockExamsEmpty, MockExamsSkeleton } from '@/components/dashboard/student/mock-exams/MockExamsEmpty'
import { MockExamsPagination }   from '@/components/dashboard/student/mock-exams/MockExamsPagination'
import { ALL_CATEGORIES }        from '@/lib/constants/student/mock-exams/mock-exams'
import styles                    from './mock-exams.module.css'

export function MockExamsHeader() {
  return (
    <div>
      <h1 className={styles.title}>Mock Exams</h1>
      <p className={styles.subtitle}>Take board-style exams assigned by your faculty</p>
    </div>
  )
}

export default function MockExamsPage() {
  const router = useRouter()
  const exams  = useMockExams()

  const {
    search, setSearch,
    category, setCategory,
    sort, setSort,
    page, setPage, totalPages,
    paginated, filtered,
    categories,
    availableCount, completedCount, inProgressCount, lockedCount,
    loading, error,
    refresh,
  } = exams

  return (
    <>
    <div className={styles.header}>  {/* reuse existing .header flex */}
      <MockExamsHeader />

      <div className={styles.headerRight}>
        <div className={styles.statPills}>
          <span className={styles.statPill} data-type="available">
            <span className={styles.dot} /> {availableCount} Available
          </span>
          {inProgressCount > 0 && (
            <span className={styles.statPill} data-type="in-progress">
              <span className={styles.dotInProgress} /> {inProgressCount} In Progress
            </span>
          )}
          {completedCount > 0 && (
            <span className={styles.statPill} data-type="completed">
              <span className={styles.dotCompleted} /> {completedCount} Completed
            </span>
          )}
          {lockedCount > 0 && (
            <span className={styles.statPill} data-type="locked">
              <span className={styles.dot} /> {lockedCount} Locked
            </span>
          )}
        </div>
        <button
          type="button"
          className={styles.refreshBtn}
          onClick={refresh}
          disabled={loading}
          title="Refresh exams"
        >
          <RefreshCw
            size={16}
            className={loading ? styles.spin : undefined}
          />
          Refresh
        </button>
      </div>
    </div>

      <MockExamsFilters
        search={search}
        setSearch={setSearch}
        category={category}
        setCategory={setCategory}
        sort={sort}
        setSort={setSort}
        categories={categories}
        totalFound={filtered.length}
      />

      {loading ? (
        <MockExamsSkeleton />
      ) : error !== null ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>Something went wrong</p>
          <p className={styles.emptyText}>{error}</p>
          <button className={styles.emptyBtn} onClick={refresh}>Try again</button>
        </div>
      ) : paginated.length > 0 ? (
        <MockExamsGrid
          exams={paginated}
          onStart={(id)       => router.push(`/student/mock-exams/${id}`)}
          onContinue={(id)    => router.push(`/student/mock-exams/${id}`)}
          onViewAttempt={(id) => router.push(`/student/mock-exams/${id}`)}
        />
      ) : (
        <MockExamsEmpty
          onClear={() => { setSearch(''); setCategory(ALL_CATEGORIES) }}
        />
      )}

      {!loading && error === null && totalPages > 1 && (
        <MockExamsPagination
          page={page}
          totalPages={totalPages}
          total={filtered.length}
          setPage={setPage}
        />
      )}

    </>
  )
}
