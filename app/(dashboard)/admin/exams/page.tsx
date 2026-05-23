// app/(dashboard)/admin/exams/page.tsx
'use client'

import Link from 'next/link'
import { BookOpen, Plus, AlertCircle, RefreshCw } from 'lucide-react'
import { useExams }            from '@/lib/hooks/admin/exams/useExams'
import { ExamFiltersBar }      from '@/components/dashboard/admin/exams/ExamFilters'
import { ExamTable }           from '@/components/dashboard/admin/exams/ExamTable'
import { EditExamModal }       from '@/components/dashboard/admin/exams/EditExamModal'
import { DeleteExamModal }     from '@/components/dashboard/admin/exams/DeleteExamModal'
import { Toast }               from '@/components/dashboard/admin/exams/Toast'
import { Pagination }          from '@/components/dashboard/admin/exams/Pagination'
import s from './exams.module.css'

const PAGE_SIZE = 8

export default function ExamsPage() {
  const {
    // Data
    loading, refreshing, error,
    programs, categoryRows, categoryNames,

    // Filters
    filters, setFilters, clearFilters, hasFilters,

    // Pagination
    page, setPage, totalPages, paginated, totalFiltered,

    // Edit
    editTarget, editForm, editErrors, editSaving,
    openEdit, closeEdit, setEditForm, saveEdit,

    // Delete
    deleteTarget, deleting, setDeleteTarget, confirmDelete,

    // Toast
    toast, clearToast, refreshData, isFaculty,
  } = useExams()

  return (
    <div className={s.page}>
      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={clearToast}
        />
      )}

      {/* Header */}
      <div className={s.header}>
        <div className={s.headerLeft}>
          <div className={s.headerIcon}>
            <BookOpen size={20} color="#fff" />
          </div>
          <div>
            <h1 className={s.heading}>Exams</h1>
            <p className={s.headingSub}>
              Manage mock exams, practice sets, and assignments
            </p>
          </div>
        </div>
        <div className={s.headerActions}>
          <button
            type="button"
            className={s.btnSecondary}
            onClick={() => void refreshData()}
            disabled={refreshing}
          >
            <RefreshCw size={14} className={refreshing ? s.spinner : undefined} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <Link href="/admin/exams/create" className={s.btnPrimary}>
            <Plus size={14} /> Create Exam
          </Link>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className={s.errorBanner}>
          <AlertCircle size={15} />
          {error}
        </div>
      )}

      {/* Filters */}
      <ExamFiltersBar
        filters={filters}
        categoryNames={categoryNames}
        programs={programs}
        hasFilters={hasFilters}
        onFiltersChange={(patch) => {
          setFilters((prev) => ({ ...prev, ...patch }))
          setPage(1)
        }}
        onClearFilters={clearFilters}
      />

      {/* Table + Pagination */}
      <div className={s.tableCard}>
        <ExamTable
          exams={paginated}
          loading={loading}
          isFaculty={isFaculty}
          onEdit={openEdit}
          onDeleteClick={setDeleteTarget}
        />

        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={totalFiltered}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      </div>

      {/* Edit modal */}
      {editTarget && editForm && (
        <EditExamModal
          exam={editTarget}
          form={editForm}
          errors={editErrors}
          saving={editSaving}
          categories={categoryRows}
          programs={programs}
          onClose={closeEdit}
          onSave={saveEdit}
          onFormChange={setEditForm}
        />
      )}

      {/* Delete modal */}
      {deleteTarget && (
        <DeleteExamModal
          exam={deleteTarget}
          deleting={deleting}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  )
}
