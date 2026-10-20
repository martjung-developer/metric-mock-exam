// components/dashboard/student/results/ResultsRow.tsx
import { useState } from 'react'
import { useRouter }     from 'next/navigation'
import { Eye, CheckCircle2, AlertCircle, Clock, FileCheck2 } from 'lucide-react'
import { createClient }        from '@/lib/supabase/client'
import type { ResultRow }      from '@/lib/types/student/results/results.types'
import { getPctColor }         from '@/lib/utils/student/results/getPctColor'
import { getPctFillClass }     from '@/lib/utils/student/results/getPctFillClass'
import { formatDuration, getValidDurationSeconds } from '@/lib/utils/formatDuration'
import { fetchSubmissionStatus } from '@/lib/services/student/results/results.service'
import styles from '@/app/(dashboard)/student/results/results.module.css'

interface Props {
  row: ResultRow
}

export function ResultsRow({ row }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [tooltipOpen, setTooltipOpen] = useState(false)
  const validDuration = getValidDurationSeconds(row.started_at, row.submitted_at, row.duration_minutes)
  const durationUnavailable = validDuration === null

  function formatSubmittedDateTime(value: string | null): string {
    if (!value) {return '—'}
    const date = new Date(value)
    if (!Number.isFinite(date.getTime())) {return '—'}
    return new Intl.DateTimeFormat('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
    }).format(date)
  }

  async function handleReviewClick() {
    const { status } = await fetchSubmissionStatus(supabase, row.id)
    if (status === 'released') {
      router.push(`/student/results/${row.id}`)
      return
    }
    router.push(`/student/results/${row.id}/pending`)
  }

  const statusLabel = row.passed === true ? 'Passed' : row.passed === false ? 'Failed' : 'Pending'
  const statusClass = row.passed === true
    ? styles.resultStatusPassed
    : row.passed === false ? styles.resultStatusFailed : styles.resultStatusPending

  return (
    <article className={styles.resultCard}>
      <div className={styles.resultCardTop}>
        <FileCheck2 size={28} className={styles.resultCardMark} aria-hidden="true" />
        <div className={styles.resultCardBadges}>
          <span className={`${styles.resultTypeBadge} ${row.exam_type === 'mock' ? styles.typeMock : styles.typePractice}`}>
            {row.exam_type === 'mock' ? 'MOCK' : 'PRACTICE'}
          </span>
          <span className={`${styles.resultStatusBadge} ${statusClass}`}>
            {row.passed === true && <CheckCircle2 size={11} />}
            {row.passed === null && <AlertCircle size={11} />}
            {statusLabel}
          </span>
        </div>
      </div>

      <div className={styles.resultCardBody}>
        <div className={styles.resultIdentity}>
          <h2 className={styles.examTitle}>{row.exam_title}</h2>
          <span className={styles.resultCategory}>{row.category}</span>
          <time className={styles.resultDateTime} dateTime={row.submitted_at ?? undefined}>
            {formatSubmittedDateTime(row.submitted_at)}
          </time>
        </div>

        <div className={styles.resultMetrics}>
          <div className={styles.resultMetric}>
            <span className={styles.resultMetricLabel}>Score</span>
            <strong className={styles.resultScore} style={{ color: getPctColor(row.percentage) }}>
              {row.score !== null ? `${row.score} / ${row.total_points}` : '—'}
            </strong>
          </div>
          <div className={styles.resultMetric}>
            <span className={styles.resultMetricLabel}>Percentage</span>
            <div className={styles.pctWrap}>
              <div className={styles.pctLabel} style={{ color: getPctColor(row.percentage) }}>
                {row.percentage !== null ? `${row.percentage}%` : '—'}
              </div>
              <div className={styles.pctTrack}>
                <div
                  className={`${styles.pctFill} ${getPctFillClass(row.percentage, styles as unknown as Record<string, string>)}`}
                  style={{ width: row.percentage !== null ? `${row.percentage}%` : '0%' }}
                />
              </div>
            </div>
          </div>
          <div className={`${styles.resultMetric} ${styles.resultTimeMetric}`}>
            <span className={styles.resultMetricLabel}>Time taken</span>
            <span className={styles.resultTimeValue}>
              <Clock size={13} />
              {durationUnavailable ? (
                <span className={styles.durationTooltipWrap}>
                  <button
                    type="button"
                    className={styles.durationTooltipTrigger}
                    aria-label="Duration unavailable"
                    aria-describedby={`duration-tooltip-${row.id}`}
                    aria-expanded={tooltipOpen}
                    onClick={() => setTooltipOpen(true)}
                    onBlur={() => setTooltipOpen(false)}
                  >—</button>
                  <span
                    id={`duration-tooltip-${row.id}`}
                    role="tooltip"
                    className={`${styles.durationTooltip} ${tooltipOpen ? styles.durationTooltipOpen : ''}`}
                  >Exam was left open past its time limit, so active time can&apos;t be determined.</span>
                </span>
              ) : formatDuration(validDuration)}
            </span>
          </div>
        </div>

        <div className={styles.resultCardFooter}>
          <button className={styles.resultReviewBtn} onClick={() => { void handleReviewClick() }}>
            <Eye size={14} /> Review
          </button>
        </div>
      </div>
    </article>
  )
}
