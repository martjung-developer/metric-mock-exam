// components/dashboard/admin/exams/submissions/SubmissionsTable.tsx
'use client'
import { Eye, Pencil, PlayCircle, Loader2 } from 'lucide-react'
import { useState }                  from 'react'
import type { Submission }           from '@/lib/types/admin/exams/submissions/submission.types'
import { STATUS_CONFIG }             from '@/lib/utils/admin/submissions/constants'
import { fmtDate, fmtTime, initials } from '@/lib/utils/admin/submissions/format'
import { EmptyState, LoadingSkeleton } from './SubmissionsUI'
import s from '@/app/(dashboard)/admin/exams/[examId]/submissions/submissions.module.css'

interface SubmissionsTableProps {
  paginated:    Submission[]
  loading:      boolean
  onView:       (sub: Submission) => void
  onForceSubmit?: (submissionId: string, startedAt: string) => Promise<string | null>
}

export function SubmissionsTable({
  paginated,
  loading,
  onView,
  onForceSubmit,
}: SubmissionsTableProps) {
  // Track which row is currently being force-submitted
  const [forcingId, setForcingId] = useState<string | null>(null)

  async function handleForceSubmit(sub: Submission) {
    if (!onForceSubmit) {return}
    setForcingId(sub.id)
    await onForceSubmit(sub.id, sub.started_at)
    setForcingId(null)
  }

  return (
    <div className={s.tableCard}>
      <div className={s.tableWrap}>
        <table className={s.table}>
          <thead>
            <tr>
              <th>Student</th>
              <th>Student ID</th>
              <th>Submitted</th>
              <th>Time</th>
              <th>Status</th>
              <th>Score</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <LoadingSkeleton />
            ) : paginated.length === 0 ? (
              <tr><td colSpan={7}><EmptyState /></td></tr>
            ) : paginated.map(sub => {
              const cfg        = STATUS_CONFIG[sub.status]
              const isInProgress = sub.status === 'in_progress'
              const canGrade   = ['submitted', 'graded', 'reviewed'].includes(sub.status)
              const isForcing  = forcingId === sub.id

              return (
                <tr
                  key={sub.id}
                  className={`${s.tableRow} ${sub.status === 'released' ? s.tableRowReleased : ''}`}
                >
                  {/* Student */}
                  <td>
                    <div className={s.studentCell}>
                      <div className={s.avatar}>
                        <span className={s.avatarInitials}>{initials(sub.student.full_name)}</span>
                      </div>
                      <div>
                        <div className={s.studentName}>{sub.student.full_name}</div>
                        <div className={s.studentEmail}>{sub.student.email}</div>
                      </div>
                    </div>
                  </td>

                  {/* Student ID */}
                  <td><span className={s.idChip}>{sub.student.student_id ?? '—'}</span></td>

                  {/* Submitted */}
                  <td>
                    <span className={s.dateCell}>
                      {sub.submitted_at
                        ? fmtDate(sub.submitted_at)
                        : <span className={s.na}>—</span>}
                    </span>
                  </td>

                  {/* Time */}
                  <td>
                    <span className={s.timeCell}>
                      {sub.time_spent_seconds !== null
                        ? fmtTime(sub.time_spent_seconds)
                        : <span className={s.na}>—</span>}
                    </span>
                  </td>

                  {/* Status */}
                  <td>
                    <span className={`${s.statusBadge} ${s[`statusBadge_${cfg.color}`]}`}>
                      <cfg.icon size={11} />{cfg.label}
                    </span>
                  </td>

                  {/* Score */}
                  <td>
                    {sub.score !== null
                      ? <span className={`${s.scoreChip} ${sub.passed ? s.scorePass : s.scoreFail}`}>
                          {sub.percentage !== null
                            ? `${sub.percentage.toFixed(1)}%`
                            : `${sub.score} pts`}
                        </span>
                      : <span className={s.na}>—</span>}
                  </td>

                  {/* Actions */}
                  <td>
                    <div className={s.actions}>
                      {/* Force Submit — only shown for in_progress rows */}
                      {isInProgress && onForceSubmit && (
                        <button
                          className={s.actionForceSubmit}
                          title="Force submit (mark as submitted so it can be graded)"
                          onClick={() => handleForceSubmit(sub)}
                          disabled={isForcing}
                        >
                          {isForcing
                            ? <Loader2 size={13} className={s.spinner} />
                            : <PlayCircle size={13} />}
                        </button>
                      )}

                      {/* View / Grade */}
                      <button
                        className={canGrade ? s.actionGrade : s.actionView}
                        title={canGrade ? 'View & Grade' : 'View'}
                        onClick={() => onView(sub)}
                      >
                        {canGrade ? <Pencil size={13} /> : <Eye size={13} />}
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
