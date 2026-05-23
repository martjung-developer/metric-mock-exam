// components/dashboard/admin/exams/ExamTable.tsx
import Link from 'next/link'
import {
  BookOpen, Eye, Pencil, Trash2,
  Clock, HelpCircle, Users, CheckCircle, XCircle,
} from 'lucide-react'
import type { Exam } from '@/lib/types/admin/exams/exam.types'
import { EXAM_TYPE_META } from '@/lib/types/database'
import s from '@/app/(dashboard)/admin/exams/exams.module.css'

const PAGE_SIZE = 8

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className={s.skeletonRow}>
      <td>
        <div className={s.skelCell}>
          <div className={`${s.skeleton} ${s.skelIcon}`} />
          <div>
            <div className={`${s.skeleton} ${s.skelText}`} style={{ width: 180 }} />
            <div className={`${s.skeleton} ${s.skelText}`} style={{ width: 100, marginTop: 5 }} />
          </div>
        </div>
      </td>
      <td><div className={`${s.skeleton} ${s.skelBadge}`} /></td>
      <td><div className={`${s.skeleton} ${s.skelBadge}`} /></td>
      <td><div className={`${s.skeleton} ${s.skelBadge}`} /></td>
      <td><div className={`${s.skeleton} ${s.skelText}`} style={{ width: 55 }} /></td>
      <td><div className={`${s.skeleton} ${s.skelText}`} style={{ width: 40 }} /></td>
      <td><div className={`${s.skeleton} ${s.skelText}`} style={{ width: 45 }} /></td>
      <td><div className={`${s.skeleton} ${s.skelBadge}`} /></td>
      <td>
        <div className={s.skelActions}>
          <div className={`${s.skeleton} ${s.skelBtn}`} />
          <div className={`${s.skeleton} ${s.skelBtn}`} />
          <div className={`${s.skeleton} ${s.skelBtn}`} />
        </div>
      </td>
    </tr>
  )
}

// ── Exam Row ──────────────────────────────────────────────────────────────────

interface ExamRowProps {
  exam:          Exam
  isFaculty:     boolean
  onEdit:        (exam: Exam) => void
  onDeleteClick: (exam: Exam) => void
}

function ExamRow({ exam, isFaculty, onEdit, onDeleteClick }: ExamRowProps) {
  const status = exam.approval_status
  const editLocked = isFaculty && status === 'pending_review'
  const rejectedReason = status === 'rejected' ? exam.review_notes : null
  return (
    <tr className={s.tableRow}>
      <td>
        <div className={s.examCell}>
          <div className={s.examIcon}>
            <BookOpen size={16} color="var(--primary)" />
          </div>
          <div>
            <div className={s.examTitle}>{exam.title}</div>
            <div className={s.examMeta}>
              {exam.total_points} pts · Pass {exam.passing_score}%
            </div>
          </div>
        </div>
      </td>
      <td>
        <span className={s.categoryBadge}>{exam.category?.name ?? '—'}</span>
      </td>
      <td>
        {exam.program
          ? <span className={s.programBadge} title={exam.program.name}>{exam.program.code}</span>
          : <span className={s.programNone}>—</span>}
      </td>
      <td>
        <span className={exam.exam_type === 'mock' ? s.badgeMock : s.badgePractice}>
          {EXAM_TYPE_META[exam.exam_type].label}
        </span>
      </td>
      <td>
        <div className={s.durationCell}>
          <Clock size={12} className={s.durationIcon} />
          {exam.duration_minutes} min
        </div>
      </td>
      <td>
        <div className={s.countCell}>
          <HelpCircle size={12} className={s.countIcon} />
          {exam.question_count}
        </div>
      </td>
      <td>
        <div className={s.countCell}>
          <Users size={12} className={s.countIcon} />
          {exam.assigned_count}
        </div>
      </td>
      <td>
        {exam.is_published
          ? <span className={s.badgePublished}><CheckCircle size={11} /> Published</span>
          : <span className={s.badgeDraft}><XCircle size={11} /> Draft</span>}
        {!exam.is_published && status && status !== 'draft' && (
          <div style={{ marginTop: 6 }}>
            <span className={`${s.categoryBadge} ${status === 'pending_review' ? s.approvalPending : status === 'rejected' ? s.approvalRejected : ''}`} title={rejectedReason ?? undefined}>
              {status === 'pending_review' ? 'Pending Review' : status === 'rejected' ? 'Rejected' : `Approval: ${status.replace(/_/g, ' ')}`}
            </span>
          </div>
        )}
      </td>
      <td>
        <div className={s.actions}>
          <Link href={`/admin/exams/${exam.id}`} className={s.actionView} title="View">
            <Eye size={14} />
          </Link>
          <button className={s.actionEdit} title={editLocked ? 'Under admin review - editing is locked' : 'Edit'} onClick={() => onEdit(exam)} disabled={editLocked}>
            <Pencil size={14} />
          </button>
          <button className={s.actionDelete} title="Delete" onClick={() => onDeleteClick(exam)}>
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  )
}

// ── ExamTable ─────────────────────────────────────────────────────────────────

interface ExamTableProps {
  exams:         Exam[]
  loading:       boolean
  isFaculty:     boolean
  onEdit:        (exam: Exam) => void
  onDeleteClick: (exam: Exam) => void
}

export function ExamTable({ exams, loading, isFaculty, onEdit, onDeleteClick }: ExamTableProps) {
  return (
    <div className={s.tableWrap}>
      <table className={s.table}>
        <thead>
          <tr>
            <th>Exam Title</th>
            <th>Category</th>
            <th>Program</th>
            <th>Type</th>
            <th>Duration</th>
            <th>Questions</th>
            <th>Assigned</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <SkeletonRow key={i} />
            ))
          ) : exams.length === 0 ? (
            <tr>
              <td colSpan={9}>
                <div className={s.emptyState}>
                  <div className={s.emptyIcon}>
                    <BookOpen size={22} color="var(--text-muted)" />
                  </div>
                  <p className={s.emptyTitle}>No exams found</p>
                  <p className={s.emptySub}>Try adjusting your filters or create a new exam.</p>
                </div>
              </td>
            </tr>
          ) : (
            exams.map((exam) => (
              <ExamRow
                key={exam.id}
                exam={exam}
                isFaculty={isFaculty}
                onEdit={onEdit}
                onDeleteClick={onDeleteClick}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
