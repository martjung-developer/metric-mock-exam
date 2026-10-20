'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'
import type { Attempt, StudentSummary } from '@/lib/types/admin/exams/results/results.types'
import type { TosAreaBreakdown } from '@/lib/utils/admin/results/tosBreakdown'
import { normalizeAreaTitle } from '@/lib/utils/admin/submissions/grading'
import { fmtDate } from '@/lib/utils/admin/results/results.utils'
import s from '@/app/(dashboard)/admin/exams/[examId]/results/results.module.css'

interface TosSummaryModalProps {
  student: StudentSummary
  attempt: Attempt
  areas: TosAreaBreakdown[]
  onClose: () => void
}

export function TosSummaryModal({ student, attempt, areas, onClose }: TosSummaryModalProps) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {onClose()}
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const hasTos = areas.some((area) => area.weight_percent !== undefined)
  const allUnclassified = areas.length > 0 && areas.every(
    (area) => normalizeAreaTitle(area.area_title) === 'unclassified',
  )
  const strongest = allUnclassified ? undefined : areas.reduce<TosAreaBreakdown | undefined>(
    (best, area) => !best || area.percent > best.percent ? area : best,
    undefined,
  )
  const weakest = allUnclassified ? undefined : areas.reduce<TosAreaBreakdown | undefined>(
    (lowest, area) => !lowest || area.percent < lowest.percent ? area : lowest,
    undefined,
  )
  const metMinimum = areas.filter((area) => area.minimum_met === true).length

  return (
    <div className={s.tosModalOverlay} onMouseDown={(event) => {
      if (event.target === event.currentTarget) {onClose()}
    }}>
      <section className={s.tosModal} role="dialog" aria-modal="true" aria-labelledby="tos-summary-title">
        <header className={s.tosModalHeader}>
          <div>
            <h2 id="tos-summary-title">TOS Summary</h2>
            <p>{student.full_name} · ID {student.student_id ?? '—'} · Attempt {attempt.attempt_no}</p>
            <p>{attempt.score} pts · {attempt.percentage.toFixed(1)}% · {attempt.passed ? 'Pass' : 'Fail'} · {fmtDate(attempt.submitted_at)}</p>
          </div>
          <button type="button" className={s.tosModalIconButton} onClick={onClose} aria-label="Close TOS summary">
            <X size={18} />
          </button>
        </header>

        <div className={s.tosModalBody}>
          {allUnclassified ? (
            <p className={s.tosUnclassifiedNote}>Questions have no area assigned yet.</p>
          ) : (
            <div className={s.tosSummaryCards}>
              <div><span>Total areas</span><strong>{areas.length}</strong></div>
              {hasTos && <div><span>Areas meeting minimum</span><strong>{metMinimum} / {areas.length}</strong></div>}
              {strongest && <div><span>Strongest area</span><strong>{strongest.area_title} · {strongest.percent.toFixed(1)}%</strong></div>}
              {weakest && <div><span>Weakest area</span><strong>{weakest.area_title} · {weakest.percent.toFixed(1)}%</strong></div>}
            </div>
          )}

          <div className={s.tosSummaryTableWrap}>
            <table className={s.tosSummaryTable}>
              <thead><tr>
                <th>Area</th><th>Questions</th><th>Answered</th><th>Correct</th><th>Wrong</th>
                <th>Unanswered</th><th>Points</th><th>Percent</th>
                {hasTos && <><th>Weight</th><th>Expected items</th><th>Minimum</th><th>Min met</th><th>Weighted score</th></>}
              </tr></thead>
              <tbody>{areas.map((area) => (
                <tr key={area.area_title}>
                  <td>{area.area_title}</td><td>{area.total_questions}</td><td>{area.answered}</td>
                  <td>{area.correct}</td><td>{area.wrong}</td><td>{area.unanswered}</td>
                  <td>{area.points_earned} / {area.points_possible}</td><td>{area.percent.toFixed(1)}%</td>
                  {hasTos && <>
                    <td>{area.weight_percent === undefined ? '—' : `${area.weight_percent}%`}</td>
                    <td>{area.expected_items === undefined ? '—' : `${area.expected_items} (actual ${area.total_questions})`}</td>
                    <td>{area.min_percent === undefined ? '—' : `${area.min_percent}%`}</td>
                    <td>{area.minimum_met === undefined ? '—' : area.minimum_met ? 'Yes' : 'No'}</td>
                    <td>{area.weighted_score === undefined ? '—' : `${area.weighted_score.toFixed(2)}%`}</td>
                  </>}
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>

        <footer className={s.tosModalFooter}>
          <button type="button" onClick={onClose}>Close</button>
        </footer>
      </section>
    </div>
  )
}
