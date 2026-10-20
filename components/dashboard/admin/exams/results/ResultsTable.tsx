// components/dashboard/admin/exams/results/ResultsTable.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Results table with expandable per-row attempt history panel.
// Expand state is local to the table — no external state required.
// AttemptHistoryPanel is rendered as an inline <tr> immediately below the
// expanded student row. The colSpan matches the number of visible columns (10).
// ─────────────────────────────────────────────────────────────────────────────
'use client'

import React, { useState } from 'react';
import Link                      from 'next/link'
import { BarChart2, CheckCircle, XCircle, CheckSquare, Send, ChevronDown, ChevronRight } from 'lucide-react'
import type { Result, StudentAttemptHistory } from '@/lib/types/admin/exams/results/results.types'
import { fmtDate, getInitials }      from '@/lib/utils/admin/results/results.utils'
import { elapsedSeconds, formatDuration } from '@/lib/utils/formatDuration'
import { AttemptHistoryPanel }               from './AttemptHistoryPanel'
import s from '@/app/(dashboard)/admin/exams/[examId]/results/results.module.css'

const PAGE_SIZE  = 10
// Columns: Rank | Student | Student ID | Score | % | Pass/Fail | Status | Time | Submitted | Expand
const COL_SPAN   = 10

// ── Rank badge ─────────────────────────────────────────────────────────────────

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {return <span className={`${s.rankBadge} ${s.rankGold}`}>1</span>}
  if (rank === 2) {return <span className={`${s.rankBadge} ${s.rankSilver}`}>2</span>}
  if (rank === 3) {return <span className={`${s.rankBadge} ${s.rankBronze}`}>3</span>}
  return <span className={`${s.rankBadge} ${s.rankDefault}`}>{rank}</span>
}

// ── Skeleton ───────────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className={s.skeletonRow}>
      <td><div className={`${s.skeleton} ${s.skelText}`} style={{ width: 28 }} /></td>
      <td>
        <div className={s.skelCell}>
          <div className={`${s.skeleton} ${s.skelAvatar}`} />
          <div>
            <div className={`${s.skeleton} ${s.skelText}`} style={{ width: 130 }} />
            <div className={`${s.skeleton} ${s.skelText}`} style={{ width: 100, marginTop: 5 }} />
          </div>
        </div>
      </td>
      {[70, 55, 70, 70, 80, 60, 50, 32].map((w, j) => (
        <td key={j}>
          <div className={`${s.skeleton} ${s.skelText}`} style={{ width: w }} />
        </td>
      ))}
    </tr>
  )
}

// ── EmptyState ─────────────────────────────────────────────────────────────────

function EmptyState({ examId }: { examId: string }) {
  return (
    <tr>
      <td colSpan={COL_SPAN}>
        <div className={s.emptyState}>
          <div className={s.emptyIcon}>
            <BarChart2 size={22} color="var(--text-muted)" />
          </div>
          <p className={s.emptyTitle}>No results yet</p>
          <p className={s.emptySub}>
            Grade submissions first, then release results from the{' '}
            <Link href={`/admin/exams/${examId}/submissions`} className={s.readOnlyLink}>
              Submissions
            </Link>{' '}
            page.
          </p>
        </div>
      </td>
    </tr>
  )
}

// ── ResultRow ──────────────────────────────────────────────────────────────────

interface ResultRowProps {
  result:      Result
  rank:        number
  history:     StudentAttemptHistory | undefined
  isExpanded:  boolean
  onToggle:    () => void
  durationMinutes?: number | null
}

function ResultRow({ result: r, rank, history, isExpanded, onToggle, durationMinutes }: ResultRowProps) {
  const hasHistory = history !== undefined && history.attempts.length > 0
  const multiAttempt = hasHistory && history.attempts.length > 1
  const seconds = elapsedSeconds(r.started_at, r.submitted_at)
  const tooLong = seconds !== null && durationMinutes !== null && durationMinutes !== undefined && seconds > (durationMinutes + 5) * 60

  return (
    <tr
      className={`${s.tableRow} ${r.status === 'released' ? s.tableRowReleased : ''} ${isExpanded ? s.tableRowExpanded : ''}`}
    >
      <td><RankBadge rank={rank} /></td>
      <td>
        <div className={s.studentCell}>
          <div className={s.avatar}>
            <span className={s.avatarInitials}>{getInitials(r.student.full_name)}</span>
          </div>
          <div>
            <div className={s.studentName}>{r.student.full_name}</div>
            <div className={s.studentEmail}>{r.student.email}</div>
          </div>
        </div>
      </td>
      <td>
        <span className={s.idChip}>{r.student.student_id ?? '—'}</span>
      </td>
      <td><span className={s.scoreRaw}>{r.score} pts</span></td>
      <td>
        <div className={s.percentCell}>
          <span className={s.percentValue}>{r.percentage.toFixed(1)}%</span>
          <div className={s.miniBar}>
            <div
              className={`${s.miniBarFill} ${r.passed ? s.miniBarPass : s.miniBarFail}`}
              style={{ width: `${Math.min(r.percentage, 100)}%` }}
            />
          </div>
        </div>
      </td>
      <td>
        {r.passed
          ? <span className={s.badgePass}><CheckCircle size={11} /> Passed</span>
          : <span className={s.badgeFail}><XCircle size={11} /> Failed</span>}
      </td>
      <td>
        {r.status === 'released'
          ? <span className={s.statusReleased}><Send size={11} /> Released</span>
          : <span className={s.statusReviewed}><CheckSquare size={11} /> Reviewed</span>}
      </td>
      <td><span className={s.timeCell}>
        <span className={tooLong ? s.durationUnavailable : undefined} title={tooLong ? "Exam was left open past its time limit, so active time can't be determined." : undefined}>
          {formatDuration(tooLong ? null : seconds)}
        </span>
      </span></td>
      <td><span className={s.dateCell}>{fmtDate(r.submitted_at)}</span></td>
      <td>
        {hasHistory ? (
          <button
            className={`${s.expandBtn} ${multiAttempt ? s.expandBtnMulti : ''}`}
            onClick={onToggle}
            aria-label={isExpanded ? 'Collapse attempt history' : 'Expand attempt history'}
            title={`${history.attempts.length} attempt${history.attempts.length !== 1 ? 's' : ''}`}
          >
            {isExpanded
              ? <ChevronDown  size={14} />
              : <ChevronRight size={14} />}
            <span className={s.expandBtnCount}>{history.attempts.length}</span>
          </button>
        ) : (
          <span className={s.expandBtnPlaceholder}>—</span>
        )}
      </td>
    </tr>
  )
}

// ── ResultsTable ───────────────────────────────────────────────────────────────

interface ResultsTableProps {
  results:              Result[]
  loading:              boolean
  page:                 number
  examId:               string
  historiesByStudentId: Map<string, StudentAttemptHistory>
  durationMinutes?: number | null
}

export function ResultsTable({
  results,
  loading,
  page,
  examId,
  historiesByStudentId,
  durationMinutes,
}: ResultsTableProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  function toggleExpand(studentId: string) {
    setExpandedIds((prev: Set<string>) => {
      const next = new Set(prev)
      if (next.has(studentId)) {
        next.delete(studentId)
      } else {
        next.add(studentId)
      }
      return next
    })
  }

  return (
    <div className={s.tableWrap}>
      <table className={s.table}>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Student</th>
            <th>Student ID</th>
            <th>Score</th>
            <th>Percentage</th>
            <th>Pass/Fail</th>
            <th>Status</th>
            <th>Time</th>
            <th>Submitted</th>
            <th>Attempts</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <SkeletonRow key={i} />
            ))
          ) : results.length === 0 ? (
            <EmptyState examId={examId} />
          ) : (
            results.map((r, i) => {
              const history = historiesByStudentId.get(r.student.id)
              const isExpanded = expandedIds.has(r.student.id)

              return (
                <React.Fragment key={r.student.id}>
                  <ResultRow
                    result={r}
                    rank={(page - 1) * PAGE_SIZE + i + 1}
                    history={history}
                    isExpanded={isExpanded}
                    onToggle={() => toggleExpand(r.student.id)}
                    durationMinutes={durationMinutes}
                  />
                  {history !== undefined && (
                    <AttemptHistoryPanel
                      history={history}
                      colSpan={COL_SPAN}
                      isOpen={isExpanded}
                      durationMinutes={durationMinutes}
                    />
                  )}
                </React.Fragment>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}
