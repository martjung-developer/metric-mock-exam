/**
 * lib/hooks/admin/exams/assignments/useAssignments.ts
 *
 * Manages all data state for the assignments page:
 *   - fetching assignments + programs
 *   - assigning students / programs
 *   - unassigning
 *   - filtering + pagination
 *   - modal open/close state
 *
 * Rules:
 *   - No JSX
 *   - No Supabase calls (service layer only)
 *   - All heavy derivations are memoised
 *   - All actions are useCallback-stabilised
 */

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'

import {
  fetchAssignmentsForExam,
  assignStudentsToExam,
  assignProgramToExam,
  unassignFromExam,
} from '@/lib/services/admin/exams/assignments/assignments.service'

import type {
  Assignment,
  AssignmentFiltersState,
  DisplaySubmissionStatus,
  Program,
  StudentSearchResult,
} from '@/lib/types/admin/exams/assignments/assignments.types'

export const PAGE_SIZE = 10

// ── Hook return type ──────────────────────────────────────────────────────────

export interface UseAssignmentsReturn {
  // Data
  assignments:    Assignment[]
  programs:       Program[]
  filtered:       Assignment[]
  paginated:      Assignment[]
  totalPages:     number

  // Async state
  loading:        boolean
  error:          string | null
  clearError:     () => void

  // Filters
  filters:        AssignmentFiltersState
  setSearch:      (q: string) => void
  setStatusFilter:(s: DisplaySubmissionStatus | 'all') => void

  // Pagination
  page:           number
  setPage:        (n: number) => void

  // Assign panel
  showPanel:      boolean
  assignMode:     'student' | 'program'
  openPanel:      () => void
  closePanel:     () => void
  setAssignMode:  (mode: 'student' | 'program') => void

  // Student assignment
  selected:       StudentSearchResult[]
  deadline:       string
  assigning:      boolean
  setDeadline:    (d: string) => void
  toggleSelect:   (student: StudentSearchResult) => void
  handleAssignStudents: () => Promise<void>

  // Program assignment
  selectedProg:   string
  progDeadline:   string
  setSelectedProg:(id: string) => void
  setProgDeadline:(d: string) => void
  handleAssignProgram: () => Promise<void>

  // Unassign
  unassignTarget: Assignment | null
  unassigning:    boolean
  setUnassignTarget: (a: Assignment | null) => void
  handleUnassign: () => Promise<void>

  // Refresh
  refresh:        () => void
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAssignments(examId: string): UseAssignmentsReturn {
  const supabase = useMemo(() => createClient(), [])

  // ── Core data ─────────────────────────────────────────────────────────────
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [programs,    setPrograms]    = useState<Program[]>([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState<string | null>(null)

  // ── Filters ───────────────────────────────────────────────────────────────
  const [filters, setFilters] = useState<AssignmentFiltersState>({
    search:       '',
    statusFilter: 'all',
  })
  const [page, setPageRaw] = useState(1)

  // ── Panel / modal ─────────────────────────────────────────────────────────
  const [showPanel,  setShowPanel]  = useState(false)
  const [assignMode, setAssignMode] = useState<'student' | 'program'>('student')

  // ── Student assign state ──────────────────────────────────────────────────
  const [selected,  setSelected]  = useState<StudentSearchResult[]>([])
  const [deadline,  setDeadline]  = useState('')
  const [assigning, setAssigning] = useState(false)

  // ── Program assign state ──────────────────────────────────────────────────
  const [selectedProg, setSelectedProg] = useState('')
  const [progDeadline, setProgDeadline] = useState('')

  // ── Unassign state ────────────────────────────────────────────────────────
  const [unassignTarget, setUnassignTarget] = useState<Assignment | null>(null)
  const [unassigning,    setUnassigning]    = useState(false)

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const result = await fetchAssignmentsForExam(supabase, examId)
    if (result.error) {
      setError(result.error)
    } else {
      setAssignments(result.assignments)
      setPrograms(result.programs)
    }
    setLoading(false)
  }, [supabase, examId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  // ── Derived: filtered ─────────────────────────────────────────────────────
  const filtered = useMemo<Assignment[]>(() => {
    const q = filters.search.toLowerCase()
    return assignments.filter((a) => {
      const matchSearch =
        !filters.search ||
        a.student.full_name.toLowerCase().includes(q) ||
        a.student.email.toLowerCase().includes(q) ||
        (a.student.student_id ?? '').toLowerCase().includes(q) ||
        (a.program_name ?? '').toLowerCase().includes(q)

      const matchStatus =
        filters.statusFilter === 'all' ||
        a.submission_status === filters.statusFilter

      return matchSearch && matchStatus
    })
  }, [assignments, filters])

  // ── Derived: pagination ───────────────────────────────────────────────────
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)),
    [filtered.length],
  )

  const paginated = useMemo<Assignment[]>(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page],
  )

  // ── Filter actions ────────────────────────────────────────────────────────
  const setSearch = useCallback((q: string) => {
    setFilters((prev) => ({ ...prev, search: q }))
    setPageRaw(1)
  }, [])

  const setStatusFilter = useCallback((s: DisplaySubmissionStatus | 'all') => {
    setFilters((prev) => ({ ...prev, statusFilter: s }))
    setPageRaw(1)
  }, [])

  const setPage = useCallback((n: number) => setPageRaw(n), [])

  // ── Panel actions ─────────────────────────────────────────────────────────
  const openPanel  = useCallback(() => setShowPanel(true),  [])
  const closePanel = useCallback(() => setShowPanel(false), [])

  const clearError = useCallback(() => setError(null), [])

  // ── Student selection ─────────────────────────────────────────────────────
  const toggleSelect = useCallback((student: StudentSearchResult) => {
    setSelected((prev) =>
      prev.some((s) => s.id === student.id)
        ? prev.filter((s) => s.id !== student.id)
        : [...prev, student],
    )
  }, [])

  // ── Assign students ───────────────────────────────────────────────────────
  const handleAssignStudents = useCallback(async () => {
    if (selected.length === 0) {return}
    setAssigning(true)
    setError(null)

    const result = await assignStudentsToExam(supabase, {
      examId,
      studentIds: selected.map((s) => s.id),
      deadline:   deadline || null,
    })

    if (result.error) {
      setError(result.error)
      setAssigning(false)
      return
    }

    // Reset panel state
    setSelected([])
    setDeadline('')
    setShowPanel(false)
    setAssigning(false)
    void load()
  }, [supabase, examId, selected, deadline, load])

  // ── Assign program ────────────────────────────────────────────────────────
  const handleAssignProgram = useCallback(async () => {
    if (!selectedProg) {return}
    setAssigning(true)
    setError(null)

    const selectedProgramExists = programs.some((program) => program.id === selectedProg)
    if (!selectedProgramExists) {
      setError('Please select a valid program.')
      setAssigning(false)
      return
    }

    const { data: { user }, error: userErr } = await supabase.auth.getUser()
    if (userErr || !user) {
      setError('Could not identify the assigning user.')
      setAssigning(false)
      return
    }

    const result = await assignProgramToExam(supabase, {
      examId,
      programId: selectedProg,
      assignedBy: user.id,
      deadline:  progDeadline || null,
    })

    if (result.error) {
      setError(result.error)
      setAssigning(false)
      return
    }

    setSelectedProg('')
    setProgDeadline('')
    setShowPanel(false)
    setAssigning(false)
    void load()
  }, [supabase, examId, selectedProg, progDeadline, programs, load])

  // ── Unassign ──────────────────────────────────────────────────────────────
  const handleUnassign = useCallback(async () => {
    if (!unassignTarget) {return}
    setUnassigning(true)
    setError(null)

    const result = await unassignFromExam(supabase, unassignTarget.id)

    if (result.error) {
      setError('Could not unassign.')
    } else {
      // Optimistic update — remove from local list immediately
      setAssignments((prev) =>
        prev.filter((a) => a.id !== unassignTarget.id),
      )
    }

    setUnassigning(false)
    setUnassignTarget(null)
  }, [supabase, unassignTarget])

  // ── Public API ────────────────────────────────────────────────────────────
  return {
    assignments,
    programs,
    filtered,
    paginated,
    totalPages,

    loading,
    error,
    clearError,

    filters,
    setSearch,
    setStatusFilter,

    page,
    setPage,

    showPanel,
    assignMode,
    openPanel,
    closePanel,
    setAssignMode,

    selected,
    deadline,
    assigning,
    setDeadline,
    toggleSelect,
    handleAssignStudents,

    selectedProg,
    progDeadline,
    setSelectedProg,
    setProgDeadline,
    handleAssignProgram,

    unassignTarget,
    unassigning,
    setUnassignTarget,
    handleUnassign,

    refresh: load,
  }
}
