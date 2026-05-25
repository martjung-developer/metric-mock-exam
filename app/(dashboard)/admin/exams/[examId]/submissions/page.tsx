// app/(dashboard)/admin/exams/[examId]/submissions/page.tsx
'use client'

import { useCallback }           from 'react'
import { useParams }             from 'next/navigation'
import { AlertCircle, X }        from 'lucide-react'

import { useSubmissions }        from '@/lib/hooks/admin/exams/submissions/useSubmissions'
import { useSubmissionDetails }  from '@/lib/hooks/admin/exams/submissions/useSubmissionDetails'
import { useGrading }            from '@/lib/hooks/admin/exams/submissions/useGrading'
import { useAnswerKey }          from '@/lib/hooks/admin/exams/submissions/useAnswerKey'
import { useBulkGrading, useReleaseResults } from '@/lib/hooks/admin/exams/submissions/useBulkGrading'

import {
  SubmissionsHeader,
  GradingPanel,
  AnswerKeyPanel,
  StatusPills,
  SubmissionsFilters,
  SubmissionsTable,
  Pagination,
  ViewSubmissionModal,
} from '@/components/dashboard/admin/exams/submissions'

import type { Submission } from '@/lib/types/admin/exams/submissions/submission.types'
import s from './submissions.module.css'

export default function SubmissionsPage() {
  const { examId } = useParams<{ examId: string }>()

  const subs    = useSubmissions(examId)
  const details = useSubmissionDetails()
  const grading = useGrading(examId)
  const key     = useAnswerKey(examId)
  const bulk    = useBulkGrading()
  const release = useReleaseResults()

  // Shared optimistic patcher
  const patchSubmission = useCallback((id: string, patch: Partial<Submission>) => {
    subs.setSubmissions(prev =>
      prev.map(sub => sub.id === id ? { ...sub, ...patch } : sub),
    )
  }, [subs])

  const preview = grading.previewScore(details.answers, subs.examInfo)

  async function handleToggleAnswerKey() {
    if (key.answerKey.length === 0) {await key.loadAnswerKey()}
    key.setShowAnswerKey(!key.showAnswerKey)
  }

  function handleModeChange(mode: 'auto' | 'manual') {
    void grading.handleModeChange(
      mode, key.loadAnswerKey, key.setShowAnswerKey, key.answerKey.length > 0,
    )
  }

  function handleBulkGrade() {
    if (!subs.examInfo) {return}
    void bulk.bulkGradeAll(
      subs.submissions, subs.examInfo, grading.gradingMode, key.keyMap, patchSubmission,
    )
  }

async function handleRelease() {
  await release.releaseResults(
    subs.submissions,
    patchSubmission,
  )
  await subs.refetch()
}

function handleGradeSubmission() {
  if (!details.viewTarget || !subs.examInfo) {return}
  void grading.gradeSubmission(
    details.viewTarget,
    details.answers,
    key.keyMap,
    subs.examInfo,
    details.setAnswers,
    patch => patchSubmission(details.viewTarget?.id ?? '', patch),
    async () => { details.closeModal() },
  )
}

  return (
    <div className={s.page}>
      <SubmissionsHeader
        examId={examId}
        totalCount={subs.submissions.length}
        loading={subs.loading}
        onRefresh={subs.refetch}
      />

      {subs.error && (
        <div className={s.errorBanner}>
          <AlertCircle size={14} />
          {subs.error}
          <button
            onClick={subs.clearError}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <X size={13} />
          </button>
        </div>
      )}

      <GradingPanel
        gradingMode={grading.gradingMode}
        savingMode={grading.savingMode}
        bulkGrading={bulk.bulkGrading}
        bulkProgress={bulk.bulkProgress}
        releasing={release.releasing}
        gradeableCount={subs.gradeableCount}
        reviewedCount={subs.reviewedCount}
        answerKeyLoading={key.answerKeyLoading}
        showAnswerKey={key.showAnswerKey}
        answerKeyLoaded={key.answerKey.length > 0}
        onModeChange={handleModeChange}
        onBulkGrade={handleBulkGrade}
        onRelease={handleRelease}
        onToggleAnswerKey={handleToggleAnswerKey}
      />

      {grading.gradingMode === 'manual' && key.showAnswerKey && key.answerKey.length > 0 && (
        <AnswerKeyPanel
          answerKey={key.answerKey}
          onReset={key.loadAnswerKey}
          onUpdateEntry={key.updateKeyEntry}
        />
      )}

      <StatusPills submissions={subs.submissions} />

      <SubmissionsFilters
        search={subs.search}
        statusFilter={subs.statusFilter}
        filteredCount={subs.filtered.length}
        onSearch={v => { subs.setSearch(v); subs.setPage(1) }}
        onStatusFilter={v => { subs.setStatusFilter(v); subs.setPage(1) }}
      />

      {/* onForceSubmit enables the ▶ button on in_progress rows */}
      <SubmissionsTable
        paginated={subs.paginated}
        loading={subs.loading}
        takeSort={subs.takeSort}
        onTakeSort={subs.setTakeSort}
        onView={(sub, mode) => void details.openModal(sub, examId, mode)}
        onForceSubmit={subs.forceSubmit}
      />

      <Pagination
        page={subs.page}
        totalPages={subs.totalPages}
        totalItems={subs.filtered.length}
        onPage={subs.setPage}
      />

      {details.viewTarget && (
        <ViewSubmissionModal
          examId={examId}
          target={details.viewTarget}
          mode={details.modalMode}
          previewScore={preview}
          examInfo={subs.examInfo}
          gradingMode={grading.gradingMode}
          gradingSubmission={grading.gradingSubmission}
          onClose={details.closeModal}
          onGrade={handleGradeSubmission}
        />
      )}
    </div>
  )
}
