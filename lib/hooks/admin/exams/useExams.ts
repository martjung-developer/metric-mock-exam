// hooks/useExams.ts
// ─────────────────────────────────────────────────────────────────────────────
// Single hook that owns:
//  • data fetching (load once, stable client via useMemo)
//  • filter + pagination state (memoised derived values — no re-fetch)
//  • optimistic delete & update
//  • toast notifications
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  getAllExamsWithMeta,
  getPrograms,
  getCategories,
  updateExam,
  deleteExam,
} from '@/lib/services/admin/exams/exam.service'
import type {
  Exam,
  CategoryOption,
  ProgramOption,
  EditForm,
  EditFormErrors,
  ExamFilters,
  ToastState,
  ExamUpdatePayload,
} from '@/lib/types/admin/exams/exam.types'
import { INITIAL_FILTERS } from '@/lib/types/admin/exams/exam.types'

const PAGE_SIZE = 8

// ── Return shape ──────────────────────────────────────────────────────────────

export interface UseExamsReturn {
  // Data
  loading:      boolean
  refreshing:   boolean
  error:        string | null
  programs:     ProgramOption[]
  categoryRows: CategoryOption[]
  categoryNames: string[]          // ['All Categories', ...unique names]

  // Filter state
  filters:      ExamFilters
  setFilters:   React.Dispatch<React.SetStateAction<ExamFilters>>
  clearFilters: () => void
  hasFilters:   boolean

  // Pagination
  page:         number
  setPage:      React.Dispatch<React.SetStateAction<number>>
  totalPages:   number
  paginated:    Exam[]
  totalFiltered: number

  // Edit modal
  editTarget:   Exam | null
  editForm:     EditForm | null
  editErrors:   EditFormErrors
  editSaving:   boolean
  openEdit:     (exam: Exam) => void
  closeEdit:    () => void
  setEditForm:  React.Dispatch<React.SetStateAction<EditForm | null>>
  saveEdit:     () => Promise<void>

  // Delete modal
  deleteTarget: Exam | null
  deleting:     boolean
  setDeleteTarget: React.Dispatch<React.SetStateAction<Exam | null>>
  confirmDelete:   () => Promise<void>

  // Toast
  toast:        ToastState | null
  clearToast:   () => void
  refreshData:  () => Promise<void>
  isFaculty:    boolean
}

// ── Validation ────────────────────────────────────────────────────────────────

function validateEditForm(form: EditForm): EditFormErrors {
  const errs: EditFormErrors = {}
  if (!form.title.trim()) {errs.title = 'Title is required.'}
  if (!form.duration_minutes || Number(form.duration_minutes) < 1)
    {errs.duration_minutes = 'Must be at least 1 minute.'}
  if (!form.total_points || Number(form.total_points) < 1)
    {errs.total_points = 'Must be at least 1 point.'}
  const ps = Number(form.passing_score)
  if (isNaN(ps) || ps < 0 || ps > 100)
    {errs.passing_score = 'Must be 0–100.'}
  return errs
}

function examToEditForm(exam: Exam): EditForm {
  return {
    title:            exam.title,
    description:      exam.description ?? '',
    category_id:      exam.category?.id ?? '',
    program_id:       exam.program?.id  ?? '',
    exam_type:        exam.exam_type,
    duration_minutes: String(exam.duration_minutes),
    total_points:     String(exam.total_points),
    passing_score:    String(exam.passing_score),
    is_published:     exam.is_published,
  }
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useExams(): UseExamsReturn {
  const supabase    = useMemo(() => createClient(), [])
  const hasFetched  = useRef(false)

  // ── Raw data ──────────────────────────────────────────────────────────────
  const [allExams,      setAllExams]      = useState<Exam[]>([])
  const [programs,      setPrograms]      = useState<ProgramOption[]>([])
  const [categoryRows,  setCategoryRows]  = useState<CategoryOption[]>([])
  const [loading,       setLoading]       = useState(true)
  const [refreshing,    setRefreshing]    = useState(false)
  const [error,         setError]         = useState<string | null>(null)

  // ── Filter + pagination ───────────────────────────────────────────────────
  const [filters, setFilters] = useState<ExamFilters>(INITIAL_FILTERS)
  const [page,    setPage]    = useState(1)

  // ── Edit modal ────────────────────────────────────────────────────────────
  const [editTarget,  setEditTarget]  = useState<Exam | null>(null)
  const [editForm,    setEditForm]    = useState<EditForm | null>(null)
  const [editErrors,  setEditErrors]  = useState<EditFormErrors>({})
  const [editSaving,  setEditSaving]  = useState(false)

  // ── Delete modal ──────────────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<Exam | null>(null)
  const [deleting,     setDeleting]     = useState(false)

  // ── Toast ─────────────────────────────────────────────────────────────────
  const [toast, setToast] = useState<ToastState | null>(null)
  const [isFaculty, setIsFaculty] = useState(false)

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const refreshData = useCallback(async () => {
    setRefreshing(true)
    setError(null)
    try {
      const [exams, progs, cats] = await Promise.all([
        getAllExamsWithMeta(supabase),
        getPrograms(supabase),
        getCategories(supabase),
      ])
      setAllExams(exams)
      setPrograms(progs)
      setCategoryRows(cats)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load exams.')
    } finally {
      setRefreshing(false)
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    if (hasFetched.current) {return}
    hasFetched.current = true
    void refreshData()
  }, [refreshData])

  useEffect(() => {
    let mounted = true
    void (async () => {
      const { data: auth } = await supabase.auth.getUser()
      const uid = auth.user?.id
      if (!uid || !mounted) {
        return
      }
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', uid).maybeSingle()
      if (mounted) {
        setIsFaculty(profile?.role === 'faculty')
      }
    })()
    return () => { mounted = false }
  }, [supabase])

  // ── Derived: category names for the filter <select> ───────────────────────
  const categoryNames = useMemo<string[]>(() => {
    const names = Array.from(
      new Set(
        allExams
          .map((e) => e.category?.name)
          .filter((n): n is string => n !== undefined && n !== null),
      ),
    ).sort()
    return ['All Categories', ...names]
  }, [allExams])

  // ── Derived: filtered list (memoised — no re-fetch) ───────────────────────
  const filtered = useMemo<Exam[]>(() => {
    const { search, category, status, examType, programId } = filters
    return allExams.filter((e) => {
      if (search    && !e.title.toLowerCase().includes(search.toLowerCase())) {return false}
      if (category !== 'All Categories' && e.category?.name !== category)    {return false}
      if (status === 'published' && !e.is_published)                         {return false}
      if (status === 'draft'     && e.is_published)                          {return false}
      if (examType !== 'all'     && e.exam_type !== examType)                {return false}
      if (programId !== 'all'    && e.program?.id !== programId)             {return false}
      return true
    })
  }, [allExams, filters])

  const totalPages    = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated     = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page],
  )
  const totalFiltered = filtered.length

  const hasFilters =
    filters.search    !== '' ||
    filters.category  !== 'All Categories' ||
    filters.status    !== 'all' ||
    filters.examType  !== 'all' ||
    filters.programId !== 'all'

  const clearFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS)
    setPage(1)
  }, [])

  // ── Edit ──────────────────────────────────────────────────────────────────
  const openEdit = useCallback((exam: Exam) => {
    setEditTarget(exam)
    setEditForm(examToEditForm(exam))
    setEditErrors({})
  }, [])

  const closeEdit = useCallback(() => {
    if (editSaving) {return}
    setEditTarget(null)
    setEditForm(null)
    setEditErrors({})
  }, [editSaving])

  const saveEdit = useCallback(async () => {
    if (!editTarget || !editForm) {return}

    const errs = validateEditForm(editForm)
    if (Object.keys(errs).length > 0) {
      setEditErrors(errs)
      return
    }

    setEditSaving(true)

    const payload: ExamUpdatePayload = {
      title:            editForm.title.trim(),
      description:      editForm.description.trim() || null,
      category_id:      editForm.category_id  || null,
      program_id:       editForm.program_id   || null,
      exam_type:        editForm.exam_type,
      duration_minutes: Number(editForm.duration_minutes),
      total_points:     Number(editForm.total_points),
      passing_score:    Number(editForm.passing_score),
      is_published:     editForm.is_published,
      updated_at:       new Date().toISOString(),
    }

    try {
      await updateExam(supabase, editTarget.id, payload)

      // Resolve display names for optimistic update
      const newCat  = categoryRows.find((c) => c.id === editForm.category_id)
      const newProg = programs.find((p)     => p.id === editForm.program_id)

      // Optimistic update — no refetch
      setAllExams((prev) =>
        prev.map((e) =>
          e.id !== editTarget.id
            ? e
            : {
                ...e,
                ...payload,
                category: newCat  ? { id: newCat.id,  name: newCat.name  } : null,
                program:  newProg ? { id: newProg.id, code: newProg.code, name: newProg.name } : null,
              },
        ),
      )

      closeEdit()
      setToast({ message: `"${payload.title}" updated successfully.`, type: 'success' })
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : 'Failed to save changes.',
        type:    'error',
      })
    } finally {
      setEditSaving(false)
    }
  }, [editTarget, editForm, supabase, categoryRows, programs, closeEdit])

  // ── Delete ────────────────────────────────────────────────────────────────
  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) {return}
    setDeleting(true)

    try {
      await deleteExam(supabase, deleteTarget.id)
      setAllExams((prev) => prev.filter((e) => e.id !== deleteTarget.id))
      setToast({ message: `"${deleteTarget.title}" deleted.`, type: 'success' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete exam.')
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }, [deleteTarget, supabase])

  return {
    loading, refreshing, error,
    programs, categoryRows, categoryNames,
    filters, setFilters, clearFilters, hasFilters,
    page, setPage, totalPages, paginated, totalFiltered,
    editTarget, editForm, editErrors, editSaving,
    openEdit, closeEdit, setEditForm, saveEdit,
    deleteTarget, deleting, setDeleteTarget, confirmDelete,
    toast, clearToast: () => setToast(null),
    refreshData,
    isFaculty,
  }
}
