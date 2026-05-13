// app/(dashboard)/admin/exams/[examId]/results/page.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Delegates ALL data fetching and state to useExamResults.
// Passes historiesByStudentId to ResultsTable for expandable attempt panels.
// Provides two CSV export actions: flat results and full attempt history.
// ─────────────────────────────────────────────────────────────────────────────
'use client'

import { useEffect }             from 'react'
import Link                      from 'next/link'
import { useParams }             from 'next/navigation'
import {
  BarChart2, ArrowLeft, RefreshCw,
  AlertCircle, X, CheckSquare, Send, Clock, FileText,
} from 'lucide-react'
import { useExamResults }                      from '@/lib/hooks/admin/exams/results/useExamResults'
import { exportAttemptHistoryCSV } from '@/lib/utils/admin/results/exportResultsCSV'
import { exportAttemptHistoryPDF } from '@/lib/utils/admin/results/exportResultsPDF'
import { fmtDate }                             from '@/lib/utils/admin/results/results.utils'
import { SummaryCards }                        from '@/components/dashboard/admin/exams/results/SummaryCards'
import { ResultsFilters }                      from '@/components/dashboard/admin/exams/results/ResultsFilters'
import { ResultsTable }                        from '@/components/dashboard/admin/exams/results/ResultsTable'
import { PaginationControls }                  from '@/components/dashboard/admin/exams/results/PaginationControls'
import s from './results.module.css'

const PAGE_SIZE = 10

export default function ResultsPage() {
  const { examId } = useParams<{ examId: string }>()

  const {
    loading, error, analytics, summary,
    filters, setSearch, setPass, setStatus,
    page, setPage, totalPages, paginated, totalFiltered,
    refresh,
    historiesByStudentId, histories,
  } = useExamResults(examId)

  useEffect(() => {
    void refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId])

  return (
    <div className={s.page}>

      {/* ── Header ── */}
      <div className={s.header}>
        <Link href={`/admin/exams/${examId}`} className={s.backBtn}>
          <ArrowLeft size={14} /> Back to Exam
        </Link>

        <div className={s.headerMain}>
          <div className={s.headerLeft}>
            <div className={s.headerIcon}>
              <BarChart2 size={20} color="#fff" />
            </div>
            <div>
              <h1 className={s.heading}>Results</h1>
              <p className={s.headingSub}>Read-only · Reviewed &amp; Released submissions</p>
            </div>
          </div>

          <div className={s.headerActions}>
            <button
              className={s.btnSecondary}
              onClick={() => void refresh()}
              disabled={loading}
            >
              <RefreshCw size={13} className={loading ? s.spinner : ''} />
              Refresh
            </button>

            {/* Attempt history export — only shown when history data is available */}
            {histories.length > 0 && (
              <>
                {/* CSV Attempt History */}
                <button
                  className={s.btnExport}
                  onClick={() => exportAttemptHistoryCSV(histories)}
                  disabled={loading}
                  title="Export one row per attempt across all students (CSV)"
                >
                  <FileText size={13} /> Attempt CSV
                </button>

                {/* PDF Attempt History */}
                <button
                  className={s.btnExport}
                  onClick={() => void exportAttemptHistoryPDF(histories)}
                  disabled={loading}
                  title="Export formatted attempt history report (PDF)"
                >
                  <FileText size={13} /> Attempt PDF
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div className={s.errorBanner}>
          <AlertCircle size={14} />
          {error}
          <button
            onClick={() => void refresh()}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* ── Read-only notice ── */}
      <div className={s.readOnlyNotice}>
        <CheckSquare size={13} />
        <span>
          This page shows <strong>reviewed</strong> and <strong>released</strong> results only.
          To grade submissions, go to the{' '}
          <Link href={`/admin/exams/${examId}/submissions`} className={s.readOnlyLink}>
            Submissions
          </Link>{' '}
          page.
        </span>
        {summary.reviewed > 0 && (
          <span className={s.pendingReleaseTag}>
            {summary.reviewed} reviewed, not yet released
          </span>
        )}
      </div>

      {/* ── Summary cards ── */}
      <SummaryCards summary={summary} analytics={analytics} loading={loading} />

      {/* ── Status pills ── */}
      <div className={s.statusPills}>
        <div className={`${s.statusPill} ${s.statusPillReviewed}`}>
          <CheckSquare size={12} /> {summary.reviewed} Reviewed
        </div>
        <div className={`${s.statusPill} ${s.statusPillReleased}`}>
          <Send size={12} /> {summary.released} Released
        </div>
        {analytics && analytics.last_attempt_at !== null && (
          <div className={s.analyticsNote}>
            <Clock size={11} />
            Last attempt: {fmtDate(analytics.last_attempt_at)}
            {analytics.lowest_score !== null && (
              <> · Lowest: {analytics.lowest_score.toFixed(1)}%</>
            )}
          </div>
        )}
      </div>

      {/* ── Filters ── */}
      <ResultsFilters
        search={filters.search}
        passFilter={filters.passFilter}
        statusFilter={filters.statusFilter}
        totalFiltered={totalFiltered}
        onSearch={setSearch}
        onPassChange={setPass}
        onStatusChange={setStatus}
      />

      {/* ── Table + Pagination ── */}
      <div className={s.tableCard}>
        <ResultsTable
          results={paginated}
          loading={loading}
          page={page}
          examId={examId}
          historiesByStudentId={historiesByStudentId}
        />
        {!loading && (
          <PaginationControls
            page={page}
            totalPages={totalPages}
            totalItems={totalFiltered}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        )}
      </div>
    </div>
  )
}
