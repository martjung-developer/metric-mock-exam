/**
 * lib/hooks/admin/students/useDeleteStudent.ts
 *
 * Manages the delete confirmation modal, delete in-flight state,
 * optimistic UI removal, and a fallback refetch on error.
 */

'use client'

import { useState, useCallback, useMemo } from 'react'
import { createClient }        from '@/lib/supabase/client'
import { deleteStudentById }   from '@/lib/services/admin/students/student.service'
import type { Students }        from '@/lib/types/admin/students/student.types'

export interface UseDeleteStudentReturn {
  deleteModal:       Students | null
  deleting:          boolean
  openDeleteModal:   (student: Students) => void
  closeDeleteModal:  () => void
  handleDelete:      () => Promise<void>
}

export function useDeleteStudent(
  /** Callback to optimistically remove a student from the parent list. */
  removeStudent: (id: string) => void,
  /** Fallback refetch in case the optimistic update needs to be reverted. */
  refetch: () => void,
): UseDeleteStudentReturn {
  const supabase = useMemo(() => createClient(), [])

  const [deleteModal, setDeleteModal] = useState<Students | null>(null)
  const [deleting,    setDeleting]    = useState(false)

  const openDeleteModal  = useCallback((student: Students) => setDeleteModal(student), [])
  const closeDeleteModal = useCallback(() => setDeleteModal(null), [])

  const handleDelete = useCallback(async () => {
    if (!deleteModal) {return}
    setDeleting(true)

    // Optimistic: remove from UI immediately
    removeStudent(deleteModal.id)
    closeDeleteModal()

    const result = await deleteStudentById(supabase, deleteModal.id)

    if (result.error) {
      // Revert the optimistic removal by re-fetching the full list
      refetch()
    }

    setDeleting(false)
  }, [supabase, deleteModal, removeStudent, closeDeleteModal, refetch])

  return {
    deleteModal,
    deleting,
    openDeleteModal,
    closeDeleteModal,
    handleDelete,
  }
}