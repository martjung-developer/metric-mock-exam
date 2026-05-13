// app/(dashboard)/admin/students/page.tsx
'use client'
import { useCallback }          from 'react'
import { useAuthGuard }         from '@/lib/hooks/admin/students/useAuthGuard'
import { useStudents }          from '@/lib/hooks/admin/students/useStudents'
import { usePrograms }          from '@/lib/hooks/admin/students/usePrograms'
import { useStudentFilters }    from '@/lib/hooks/admin/students/useStudentFilters'
import { usePagination }        from '@/lib/hooks/admin/students/usePagination'
import { useDeleteStudent }     from '@/lib/hooks/admin/students/useDeleteStudent'
import {
  StudentsHeader, ProgramTabs, StudentsFilters,
  StudentsTable, Pagination, DeleteStudentModal, ErrorBanner,
} from '@/components/dashboard/admin/students'
import styles from './students.module.css'

export default function StudentsPage() {
  const { isReady } = useAuthGuard()
  const { students, loading, error, refetch } = useStudents()
  const { programs } = usePrograms()
  const { activeTab, yearFilter, search, filtered,
          setActiveTab, setYearFilter, setSearch } = useStudentFilters(students)
  const { safePage, totalPages, paginated, setPage } = usePagination(filtered)

  const removeStudent = useCallback(
    () => refetch(),
    [refetch],
  )

  const { deleteModal, deleting, openDeleteModal,
          closeDeleteModal, handleDelete } = useDeleteStudent(removeStudent, refetch)

  if (!isReady) {return null}

  return (
    <div className={styles.page}>
      <StudentsHeader totalCount={students.length} loading={loading} />
      <ProgramTabs programs={programs} activeTab={activeTab} onTabChange={setActiveTab} />
      <StudentsFilters search={search} yearFilter={yearFilter} onSearchChange={setSearch} onYearChange={setYearFilter} />
      {error && <ErrorBanner message={error} />}
      <StudentsTable paginated={paginated} loading={loading} activeTab={activeTab} search={search} onDelete={openDeleteModal} />
      <Pagination safePage={safePage} totalPages={totalPages} totalItems={filtered.length} onPageChange={setPage} />
      {deleteModal && <DeleteStudentModal student={deleteModal} deleting={deleting} onConfirm={handleDelete} onCancel={closeDeleteModal} />}
    </div>
  )
}
