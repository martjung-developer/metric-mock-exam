// components/dashboard/admin/exams/results/AttemptHistoryPanel.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Inline expandable panel that shows up to 3 attempts for a student.
// Rendered inside ResultsTable when the user clicks the expand button on a row.
// Zero external state — parent controls open/closed via `isOpen`.
// ─────────────────────────────────────────────────────────────────────────────
'use client'

import {
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle,
  XCircle,
  Award,
  Send,
  CheckSquare,
  Clock,
  Download,
  FileText,
} from 'lucide-react'
import type { StudentAttemptHistory, ImprovementTrend } from '@/lib/types/admin/exams/results/results.types'
import { fmtDate, fmtTime } from '@/lib/utils/admin/results/results.utils'
import { exportSingleAttemptCSV } from '@/lib/utils/admin/results/exportResultsCSV'
import { exportSingleAttemptPDF } from '@/lib/utils/admin/results/exportResultsPDF'
import s from '@/app/(dashboard)/admin/exams/[examId]/results/results.module.css'

// ── Trend icon ────────────────────────────────────────────────────────────────

function TrendIcon({ trend }: { trend: ImprovementTrend }) {
  if (trend === 'up')   {return <TrendingUp  size={13} className={s.trendUp}   />}
  if (trend === 'down') {return <TrendingDown size={13} className={s.trendDown} />}
  if (trend === 'flat') {return <Minus        size={13} className={s.trendFlat} />}
  return null
}

function trendLabel(trend: ImprovementTrend, delta: number | null): string {
  if (trend === 'single') {return 'Single attempt'}
  if (delta === null)     {return ''}
  const sign = delta >= 0 ? '+' : ''
  return `${sign}${delta.toFixed(1)}pp from first attempt`
}

// ── AttemptHistoryPanel ───────────────────────────────────────────────────────

interface AttemptHistoryPanelProps {
  history:  StudentAttemptHistory
  colSpan:  number
  isOpen:   boolean
}

export function AttemptHistoryPanel({ history, colSpan, isOpen }: AttemptHistoryPanelProps) {
  if (!isOpen) {return null}

  const { attempts, bestAttempt, improvementDelta, improvementTrend } = history

  return (
    <tr className={s.attemptPanelRow}>
      <td colSpan={colSpan} className={s.attemptPanelCell}>
        <div className={s.attemptPanel}>

          {/* Header row */}
          <div className={s.attemptPanelHeader}>
            <span className={s.attemptPanelTitle}>
              Attempt History
            </span>
            <span className={s.attemptPanelMeta}>
              {attempts.length} attempt{attempts.length !== 1 ? 's' : ''}
            </span>
            {improvementTrend !== 'single' && (
              <span className={`${s.attemptPanelTrend} ${s[`trendBadge_${improvementTrend}`]}`}>
                <TrendIcon trend={improvementTrend} />
                {trendLabel(improvementTrend, improvementDelta)}
              </span>
            )}
          </div>

          {/* Attempt cards */}
          <div className={s.attemptCards}>
            {attempts.map((attempt) => {
              const isBest = attempt.submission_id === bestAttempt.submission_id
              return (
                <div
                  key={attempt.submission_id}
                  className={`${s.attemptCard} ${isBest ? s.attemptCardBest : ''}`}
                >
                  <div className={s.attemptCardHeader}>
                    <span className={s.attemptNo}>
                      Attempt {attempt.attempt_no}
                    </span>
                    {isBest && (
                      <span className={s.bestBadge}>
                        <Award size={10} /> Best
                      </span>
                    )}
                    {attempt.status === 'released'
                      ? <span className={s.attemptStatusReleased}><Send size={10} /> Released</span>
                      : <span className={s.attemptStatusReviewed}><CheckSquare size={10} /> Reviewed</span>
                    }
                  </div>

                  <div className={s.attemptScoreRow}>
                    <span className={s.attemptPercent}>{attempt.percentage.toFixed(1)}%</span>
                    <div className={s.attemptMiniBar}>
                      <div
                        className={`${s.attemptMiniBarFill} ${attempt.passed ? s.miniBarPass : s.miniBarFail}`}
                        style={{ width: `${Math.min(attempt.percentage, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className={s.attemptCardFooter}>
                    {attempt.passed
                      ? <span className={s.badgePass}><CheckCircle size={10} /> Passed</span>
                      : <span className={s.badgeFail}><XCircle size={10} /> Failed</span>
                    }
                    <span className={s.attemptMeta}>
                      <Clock size={10} /> {fmtTime(attempt.time_spent_seconds)}
                    </span>
                    <span className={s.attemptMeta}>{fmtDate(attempt.submitted_at)}</span>
                  </div>
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.3rem' }}>
  <button
    onClick={() => exportSingleAttemptCSV(history.student, attempt)}
    title={`Export Attempt ${attempt.attempt_no} as CSV`}
    style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.2rem',
      padding: '0.15rem 0.4rem', borderRadius: 4, fontSize: '0.65rem',
      fontWeight: 600, cursor: 'pointer',
      background: '#f0fdf4', color: '#15803d',
      border: '1px solid #bbf7d0',
    }}
  >
    <Download size={9} /> CSV
  </button>
  <button
    onClick={() => void exportSingleAttemptPDF(history.student, attempt)}
    title={`Export Attempt ${attempt.attempt_no} as PDF`}
    style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.2rem',
      padding: '0.15rem 0.4rem', borderRadius: 4, fontSize: '0.65rem',
      fontWeight: 600, cursor: 'pointer',
      background: '#eff6ff', color: '#1d4ed8',
      border: '1px solid #bfdbfe',
    }}
  >
    <FileText size={9} /> PDF
  </button>
</div>
                </div>
              )
            })}

            {/* Empty slots for unsubmitted attempts */}
            {Array.from({ length: 3 - attempts.length }, (_, i) => (
              <div key={`empty-${i}`} className={`${s.attemptCard} ${s.attemptCardEmpty}`}>
                <div className={s.attemptCardHeader}>
                  <span className={s.attemptNo}>Attempt {attempts.length + i + 1}</span>
                </div>
                <div className={s.attemptEmptyLabel}>Not attempted</div>
              </div>
            ))}
          </div>

        </div>
      </td>
    </tr>
  )
}