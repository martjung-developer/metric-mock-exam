// app/(dashboard)/student/results/page.tsx
'use client'

import { useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { useResults }          from '@/lib/hooks/student/results/useResults'
import { ResultsHeader }       from '@/components/dashboard/student/results/ResultsHeader'
import { ResultsStats }        from '@/components/dashboard/student/results/ResultsStats'
import { ResultsFilters }      from '@/components/dashboard/student/results/ResultsFilters'
import { ResultsTable }        from '@/components/dashboard/student/results/ResultsTable'
import { ResultsEmptyState }   from '@/components/dashboard/student/results/ResultsEmptyState'
import { ResultsPagination }   from '@/components/dashboard/student/results/ResultsPagination'
import { PendingBanner }       from '@/components/dashboard/student/results/PendingBanner'
import styles from './results.module.css'

export default function ResultsPage() {
  const {
    results, pendingRows, stats, categories, passRate,
    loading, error, total, totalPages, pageNumbers,
    tab, search, statusFilter, categoryFilter, page,
    setTab, setSearch, setStatusFilter, setCategoryFilter, setPage,
    refetch,
  } = useResults()
  const [refreshing, setRefreshing] = useState(false)

  async function handleRefresh() {
    if (refreshing) {
      return
    }
    setRefreshing(true)
    try {
      await refetch()
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <div className={styles.page}>

      <ResultsHeader refreshing={refreshing} onRefresh={() => { void handleRefresh() }} />

      {/* Error banner */}
      {error && (
        <div style={{
          background: 'var(--student-card-bg)', border: '1px solid var(--student-border)', borderRadius: 10,
          padding: '0.8rem 1rem', marginBottom: '0.75rem',
          display: 'flex', alignItems: 'center', gap: '0.6rem',
        }}>
          <AlertCircle size={15} color="var(--student-text-muted)" style={{ flexShrink: 0 }} />
          <p style={{ fontSize: '0.82rem', color: 'var(--student-text)', margin: 0 }}>{error}</p>
        </div>
      )}

      <PendingBanner rows={pendingRows} />

      <ResultsStats stats={stats} passRate={passRate} />

      <ResultsFilters
        tab={tab}
        search={search}
        statusFilter={statusFilter}
        categoryFilter={categoryFilter}
        categories={categories}
        resultCount={results.length}
        onTab={setTab}
        onSearch={setSearch}
        onStatusFilter={setStatusFilter}
        onCategoryFilter={setCategoryFilter}
      />

      {!loading && results.length === 0 ? (
        <ResultsEmptyState
          search={search}
          statusFilter={statusFilter}
          categoryFilter={categoryFilter}
          tab={tab}
        />
      ) : (
        <ResultsTable results={results} loading={loading} />
      )}

      {!loading && results.length > 0 && (
        <ResultsPagination
          page={page}
          totalPages={totalPages}
          total={total}
          pageNumbers={pageNumbers}
          onPage={setPage}
        />
      )}
    </div>
  )
}
