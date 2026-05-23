'use client'

import React from 'react'
import { useParams } from 'next/navigation'
import { Clock3, XCircle } from 'lucide-react'

import { useExamDetail } from '@/lib/hooks/admin/exams/detail/useExamDetail'
import { useEditExam } from '@/lib/hooks/admin/exams/detail/useEditExam'
import { useUser } from '@/lib/context/AuthContext'

import Toast from '@/components/dashboard/admin/exams/detail/Toast'
import ExamHeader from '@/components/dashboard/admin/exams/detail/ExamHeader'
import ExamStats from '@/components/dashboard/admin/exams/detail/ExamStats'
import ExamDescriptionCard from '@/components/dashboard/admin/exams/detail/ExamDescriptionCard'
import ExamDetailsCard from '@/components/dashboard/admin/exams/detail/ExamDetailsCard'
import ExamSectionsNav from '@/components/dashboard/admin/exams/detail/ExamSectionsNav'
import EditExamModal from '@/components/dashboard/admin/exams/detail/EditExamModal'

import s from './detail.module.css'

export default function ExamDetailPage() {
  const { examId } = useParams<{ examId: string }>()
  const { user } = useUser()
  const role = ((user?.user_metadata?.['role'] as string | undefined) ?? (user?.app_metadata?.['role'] as string | undefined)) ?? ''
  const isFaculty = role === 'faculty'

  const { exam, categories, programs, loading, error, setExam } = useExamDetail(examId)

  const {
    showEdit,
    editForm,
    editErrors,
    editSaving,
    toast,
    openEdit,
    closeEdit,
    setEditField,
    saveEdit,
    clearToast,
  } = useEditExam({ exam, categories, programs, setExam })

  if (loading) {
    return (
      <div className={s.page}>
        <div className={s.skeleton} style={{ width: 200, height: 18, marginBottom: 8 }} />
        <div className={s.skeleton} style={{ width: '60%', height: 28, marginBottom: 32 }} />
        <div className={s.skeletonGrid}>
          {[...Array(4)].map((_, i) => (
            <div key={i} className={`${s.skeleton} ${s.skeletonCard}`} />
          ))}
        </div>
      </div>
    )
  }

  if (error || !exam) {
    return (
      <div className={s.page}>
        <p>{error ?? 'Exam not found.'}</p>
      </div>
    )
  }

  const assignmentLocked = isFaculty && (exam.approval_status === 'pending_review' || exam.approval_status === 'rejected')
  const assignmentLockReason = exam.approval_status === 'pending_review'
    ? 'Exam must be approved before assigning students'
    : 'Exam was rejected - please resubmit for review'

  return (
    <div className={s.page}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={clearToast} />}

      <ExamHeader exam={exam} onEdit={openEdit} />

      {isFaculty && exam.approval_status === 'pending_review' && (
        <div className={s.pendingBanner}>
          <Clock3 size={16} />
          <div>
            <strong>This exam is pending admin review</strong>
            <p>You cannot assign students to this exam until it has been approved. You will be notified once the admin has reviewed it.</p>
          </div>
        </div>
      )}
      {isFaculty && exam.approval_status === 'rejected' && (
        <div className={s.rejectedBanner}>
          <XCircle size={16} />
          <div>
            <strong>This exam was rejected</strong>
            <p>Reason: {exam.review_notes ?? 'No reason provided.'}</p>
            <p>Please edit the exam to address the feedback and resubmit for review.</p>
          </div>
          <button className={s.btnSecondary} onClick={openEdit}>Edit Exam</button>
        </div>
      )}

      <ExamStats exam={exam} />

      <div className={s.layout}>
        <div className={s.mainCol}>
          <ExamDescriptionCard description={exam.description} />
          <ExamDetailsCard exam={exam} />
        </div>
        <div className={s.sideCol}>
          <ExamSectionsNav examId={examId} exam={exam} assignmentLocked={assignmentLocked} assignmentLockReason={assignmentLockReason} />
        </div>
      </div>

      {showEdit && editForm && (
        <EditExamModal
          editForm={editForm}
          editErrors={editErrors}
          editSaving={editSaving}
          categories={categories}
          programs={programs}
          setEditField={setEditField}
          onSave={saveEdit}
          onClose={closeEdit}
        />
      )}
    </div>
  )
}
