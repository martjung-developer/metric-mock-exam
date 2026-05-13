/**
 * components/dashboard/admin/exams/assignments/AssignmentsTable.tsx
 *
 * Pure presentational component.
 * Renders the assignments data table, skeleton loading rows, and empty state.
 */

import { Users, Trash2, GraduationCap, User } from 'lucide-react'

import { STATUS_CONFIG } from './StatusPills'
import { Pagination }    from './Pagination'

import { formatDate, getInitials } from '@/lib/utils/admin/assignments/assignment-helpers'
import type { Assignment }         from '@/lib/types/admin/exams/assignments/assignments.types'

import s from '@/app/(dashboard)/admin/exams/[examId]/assignments/assignments.module.css'

// ── Skeleton row ─────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className={s.skeletonRow}>
      <td>
        <div className={s.skelCell}>
          <div className={`${s.skeleton} ${s.skelAvatar}`} />
          <div>
            <div className={`${s.skeleton} ${s.skelText}`} style={{ width: 130 }} />
            <div className={`${s.skeleton} ${s.skelText}`} style={{ width: 90, marginTop: 5 }} />
          </div>
        </div>
      </td>
      {([70, 80, 80, 80, 80, 80, 40, 40] as const).map((w, i) => (
        <td key={i}>
          <div className={`${s.skeleton} ${s.skelText}`} style={{ width: w }} />
        </td>
      ))}
    </tr>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <tr>
      <td colSpan={9}>
        <div className={s.emptyState}>
          <div className={s.emptyIcon}>
            <Users size={22} color="var(--text-muted)" />
          </div>
          <p className={s.emptyTitle}>No assignments found</p>
          <p className={s.emptySub}>Assign students or a program to get started.</p>
        </div>
      </td>
    </tr>
  )
}

// ── Assignment row ────────────────────────────────────────────────────────────

interface AssignmentRowProps {
  assignment:       Assignment
  onUnassign:       (a: Assignment) => void
}

function AssignmentRow({ assignment: a, onUnassign }: AssignmentRowProps) {
  const cfg = STATUS_CONFIG[a.submission_status]

  return (
    <tr className={s.tableRow}>
      {/* Student */}
      <td>
        <div className={s.studentCell}>
          <div className={s.avatar}>
            <span className={s.avatarInitials}>
              {getInitials(a.student.full_name)}
            </span>
          </div>
          <div>
            <div className={s.studentName}>{a.student.full_name}</div>
            <div className={s.studentEmail}>{a.student.email}</div>
          </div>
        </div>
      </td>

      {/* Student ID */}
      <td>
        <span className={s.idChip}>{a.student.student_id ?? '—'}</span>
      </td>

      {/* Program */}
      <td>
        <span className={s.dateCell}>{a.program_name ?? '—'}</span>
      </td>

      {/* Assigned date */}
      <td>
        <span className={s.dateCell}>{formatDate(a.assigned_at)}</span>
      </td>

      {/* Deadline */}
      <td>
        <span className={s.dateCell}>
          {a.deadline ? formatDate(a.deadline) : '—'}
        </span>
      </td>

      {/* Status badge */}
      <td>
        <span className={`${s.statusBadge} ${s[`statusBadge_${cfg.color}`]}`}>
          <cfg.icon size={11} />
          {cfg.label}
        </span>
      </td>

      {/* Assignment source */}
      <td>
        <span className={s.sourceBadge}>
          {a.assignment_source === 'program' ? (
            <>
              <GraduationCap size={12} />
              Assigned via Program
            </>
          ) : (
            <>
              <User size={12} />
              Assigned manually
            </>
          )}
        </span>
      </td>

      {/* Score */}
      <td>
        {a.percentage !== null ? (
          <span
            className={`${s.scoreChip} ${
              a.percentage >= 75 ? s.scorePass : s.scoreFail
            }`}
          >
            {a.percentage.toFixed(1)}%
          </span>
        ) : a.score !== null ? (
          <span className={s.scoreChip}>{a.score} pts</span>
        ) : (
          <span className={s.scoreDash}>—</span>
        )}
      </td>

      {/* Actions */}
      <td>
        <button
          className={s.actionDelete}
          title="Unassign"
          aria-label={`Unassign ${a.student.full_name}`}
          onClick={() => onUnassign(a)}
        >
          <Trash2 size={13} />
        </button>
      </td>
    </tr>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface AssignmentsTableProps {
  paginated:    Assignment[]
  filtered:     Assignment[]
  loading:      boolean
  page:         number
  totalPages:   number
  onUnassign:   (a: Assignment) => void
  onPageChange: (n: number) => void
}

const SKELETON_COUNT = 6

export function AssignmentsTable({
  paginated,
  filtered,
  loading,
  page,
  totalPages,
  onUnassign,
  onPageChange,
}: AssignmentsTableProps) {
  return (
    <div className={s.tableCard}>
      <div className={s.tableWrap}>
        <table className={s.table}>
          <thead>
            <tr>
              <th>Student</th>
              <th>Student ID</th>
              <th>Program</th>
              <th>Assigned</th>
              <th>Deadline</th>
              <th>Status</th>
              <th>Source</th>
              <th>Score</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                <SkeletonRow key={i} />
              ))
            ) : paginated.length === 0 ? (
              <EmptyState />
            ) : (
              paginated.map((a) => (
                <AssignmentRow
                  key={a.id}
                  assignment={a}
                  onUnassign={onUnassign}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {!loading && (
        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={filtered.length}
          onPageChange={onPageChange}
        />
      )}
    </div>
  )
}
