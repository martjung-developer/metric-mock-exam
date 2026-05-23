/**
 * app/(dashboard)/admin/exams/[examId]/assignments/page.tsx
 *
 * ── Responsibilities ──────────────────────────────────────────────────────────
 *   1. Extract `examId` from route params
 *   2. Call useAssignments() and useStudentSearch()
 *   3. Render layout shell + wire props to pure UI components
 *
 * ── NOT allowed here ──────────────────────────────────────────────────────────
 *   ✗  Supabase calls
 *   ✗  Filtering / mapping / merging logic
 *   ✗  State beyond hook destructuring
 *   ✗  Business logic of any kind
 */

'use client'

import { useEffect, useMemo, useState } from 'react'
import Link          from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, AlertCircle, Plus, Users, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

import { useAssignments }   from '@/lib/hooks/admin/exams/assignments/useAssignments'
import { useStudentSearch } from '@/lib/hooks/admin/exams/assignments/useStudentSearch'

import { StatusPills }        from '@/components/dashboard/admin/exams/assignments/StatusPills'
import { AssignmentFilters }  from '@/components/dashboard/admin/exams/assignments/AssignmentFilters'
import { AssignmentsTable }   from '@/components/dashboard/admin/exams/assignments/AssignmentsTable'
import { AssignModal }        from '@/components/dashboard/admin/exams/assignments/AssignModal'
import { UnassignModal }      from '@/components/dashboard/admin/exams/assignments/UnassignModal'

import s from './assignments.module.css'

export default function AssignmentsPage() {
  const { examId } = useParams<{ examId: string }>()
  const supabase = useMemo(() => createClient(), [])
  const [examStatus, setExamStatus] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    void (async () => {
      const { data } = await supabase.from('exams').select('approval_status').eq('id', examId).maybeSingle()
      if (mounted) {
        setExamStatus(data?.approval_status ?? null)
      }
    })()
    return () => { mounted = false }
  }, [supabase, examId])

  const assignLocked = examStatus === 'pending_review' || examStatus === 'rejected'
  const assignLockReason = examStatus === 'pending_review'
    ? 'Exam must be approved before assigning students'
    : 'Exam was rejected - please resubmit for review'

  const {
    assignments, programs, filtered, paginated, totalPages,
    loading, error, clearError,
    filters, setSearch, setStatusFilter,
    page, setPage,
    showPanel, assignMode, openPanel, closePanel, setAssignMode,
    selected, deadline, assigning, setDeadline, toggleSelect, handleAssignStudents,
    selectedProg, progDeadline, setSelectedProg, setProgDeadline, handleAssignProgram,
    unassignTarget, unassigning, setUnassignTarget, handleUnassign,
  } = useAssignments(examId)

  // Student search is scoped to "by student" mode only
  const {
    studentSearch,
    setStudentSearch,
    studentResults,
    searching,
    clearSearch,
  } = useStudentSearch(showPanel && assignMode === 'student', examId)

  // When the panel closes, also clear the student search
  function handleClosePanel() {
    closePanel()
    clearSearch()
  }

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
              <Users size={20} color="#fff" />
            </div>
            <div>
              <h1 className={s.heading}>Assignments</h1>
              <p className={s.headingSub}>
                {assignments.length} student
                {assignments.length !== 1 ? 's' : ''} assigned to this exam
              </p>
            </div>
          </div>
          <button className={s.btnPrimary} onClick={openPanel} disabled={assignLocked} title={assignLocked ? assignLockReason : 'Assign students'}>
            <Plus size={14} /> Assign
          </button>
        </div>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div className={s.errorBanner}>
          <AlertCircle size={14} />
          {error}
          <button onClick={clearError} className={s.errorClose} aria-label="Dismiss error">
            <X size={13} />
          </button>
        </div>
      )}

      {/* ── Status summary pills ── */}
      <StatusPills assignments={assignments} />

      {/* ── Filters ── */}
      <AssignmentFilters
        filters={filters}
        onSearchChange={setSearch}
        onStatusChange={setStatusFilter}
      />

      {/* ── Assignments table ── */}
      <AssignmentsTable
        paginated={paginated}
        filtered={filtered}
        loading={loading}
        page={page}
        totalPages={totalPages}
        onUnassign={setUnassignTarget}
        onPageChange={setPage}
      />

      {/* ── Assign panel modal ── */}
      {showPanel && (
        <AssignModal
          assignMode={assignMode}
          onModeChange={setAssignMode}
          onClose={handleClosePanel}
          // Student props
          studentSearch={studentSearch}
          studentResults={studentResults}
          searching={searching}
          selected={selected}
          deadline={deadline}
          onSearchChange={setStudentSearch}
          onToggleSelect={toggleSelect}
          onDeadlineChange={setDeadline}
          onAssignStudents={handleAssignStudents}
          // Program props
          programs={programs}
          selectedProg={selectedProg}
          progDeadline={progDeadline}
          assigning={assigning}
          onProgChange={setSelectedProg}
          onProgDeadlineChange={setProgDeadline}
          onAssignProgram={handleAssignProgram}
        />
      )}

      {/* ── Unassign confirm modal ── */}
      {unassignTarget && (
        <UnassignModal
          target={unassignTarget}
          unassigning={unassigning}
          onConfirm={handleUnassign}
          onCancel={() => setUnassignTarget(null)}
        />
      )}
    </div>
  )
}
