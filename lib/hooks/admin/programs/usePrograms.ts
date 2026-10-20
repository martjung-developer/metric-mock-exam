/**
 * hooks/usePrograms.ts
 *
 * Single source of truth for the Programs admin page.
 * Owns all state, derived state, and actions.
 *
 * Rules:
 *   - No JSX / no UI logic
 *   - All Supabase access goes through the service layer
 *   - Heavy computations are memoised
 *   - Actions are stabilised with useCallback
 */

'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter }   from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useUser }      from '@/lib/context/AuthContext'

import {
  fetchAllProgramData,
  updateProgramDescription,
} from '@/lib/services/admin/programs/programs.service'

import type {
  ProgramDisplay,
  ProgramFilters,
  ProgramStats,
  DescriptionEditState,
  EditingId,
} from '@/lib/types/admin/programs/programs.types'

// ── Mapping helper (pure function, not a hook) ────────────────────────────────

import type { FetchAllProgramDataResult } from '@/lib/types/admin/programs/programs.types'

function mapToDisplayPrograms(raw: FetchAllProgramDataResult): ProgramDisplay[] {
  const DEPARTMENT_MAP: Record<string, string> = {
    BLIS: 'SBIT',
    BSPSYCH: 'SSLATE',
    'BS-PSYCH': 'SSLATE',
    BEED: 'SSLATE',
    BSEDMATH: 'SSLATE',
    'BSED-MATH': 'SSLATE',
    BSEDSCI: 'SSLATE',
    'BSED-SCI': 'SSLATE',
    BSEDENG: 'SSLATE',
    'BSED-ENG': 'SSLATE',
    BSEDFIL: 'SSLATE',
    'BSED-FIL': 'SSLATE',
    BSARCH: 'SARFAID',
    'BS-ARCH': 'SARFAID',
    BSID: 'SARFAID',
    'BS-ID': 'SARFAID',
  }

  return raw.programs.map((prog) => {
    const progStudents = raw.students
      .filter((s) => s.program_id === prog.id)
      .map((s) => ({
        id:         s.profiles.id,
        full_name:  s.profiles.full_name,
        email:      s.profiles.email,
        year_level: s.year_level,
      }))

    const progExams = raw.exams
      .filter((e) => e.program_id === prog.id)
      .map((e) => ({
        id:           e.id,
        title:        e.title,
        is_published: e.is_published,
        exam_type:    e.exam_type,
      }))

    const schoolJoin = prog.school ?? prog.schools ?? null
    const school = Array.isArray(schoolJoin) ? schoolJoin[0] : schoolJoin
    const normalizedCode = prog.code.toUpperCase().replace(/\s+/g, '')
    const fallbackDepartment = DEPARTMENT_MAP[normalizedCode] ?? 'UNASSIGNED'
    const departmentCode = school?.code ?? fallbackDepartment

    return {
      ...prog,
      studentCount: progStudents.length,
      examCount:    progExams.length,
      students:     progStudents,
      exams:        progExams,
      school_code: school?.code ?? null,
      school_name: school?.name ?? null,
      school_full_name: school?.full_name ?? null,
      departmentCode,
    }
  })
}

// ── Hook return type ──────────────────────────────────────────────────────────

export interface UseProgramsReturn {
  // Data
  programs:         ProgramDisplay[]
  filteredPrograms: ProgramDisplay[]
  stats:            ProgramStats
  degreeTypes:      string[]   // ['all', ...unique degree_type values]
  departmentOptions: string[]  // ['all', ...department codes]
  groupedPrograms: Array<{ key: string; label: string; programs: ProgramDisplay[] }>

  // Async state
  loading: boolean
  error:   string | null

  // Filters
  filters:        ProgramFilters
  setSearch:      (q: string) => void
  setFilterDeg:   (deg: string) => void
  setDepartment:  (department: string) => void

  // Modal
  selectedProgram: ProgramDisplay | null
  openModal:       (prog: ProgramDisplay) => void
  closeModal:      () => void

  // Description editing
  editState:           DescriptionEditState
  startEditDescription:(id: EditingId, currentDesc: string | null) => void
  setEditDesc:         (value: string) => void
  saveDescription:     (programId: string) => Promise<void>
  cancelEdit:          () => void

  // Refresh
  refreshPrograms: () => void
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function usePrograms(): UseProgramsReturn {
  const router              = useRouter()
  const { user, profile, loading: authLoading } = useUser()

  // Stable client instance for the lifetime of this hook
  const supabase = useMemo(() => createClient(), [])

  // ── Core data state ────────────────────────────────────────────────────────
  const [programs, setPrograms] = useState<ProgramDisplay[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string | null>(null)
  const [viewerSchoolId, setViewerSchoolId] = useState<string | null>(null)
  const [viewerSchoolLoaded, setViewerSchoolLoaded] = useState(false)

  // ── Filter state ──────────────────────────────────────────────────────────
  const [filters, setFilters] = useState<ProgramFilters>({
    search:    '',
    filterDeg: 'all',
    department: 'all',
  })

  // ── Modal state ───────────────────────────────────────────────────────────
  const [selectedProgram, setSelectedProgram] = useState<ProgramDisplay | null>(null)

  // ── Edit description state ────────────────────────────────────────────────
  const [editState, setEditState] = useState<DescriptionEditState>({
    editingId:     null,
    editDesc:      '',
    savingDesc:    false,
    saveDescError: '',
    saveDescOk:    false,
  })

  // ── Role guard ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (authLoading) {
      return
    }
    if (!user) {
      router.replace('/login')
      return
    }

    const role =
      (user.user_metadata?.role as string | undefined) ??
      (user.app_metadata?.role  as string | undefined)

    if (role !== 'admin' && role !== 'faculty') {
      router.replace('/unauthorized')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (authLoading || !user) {
      return
    }

    const role =
      (user.user_metadata?.role as string | undefined) ??
      (user.app_metadata?.role  as string | undefined) ??
      profile?.role

    if (role !== 'faculty' && role !== 'admin') {
      queueMicrotask(() => {
        setViewerSchoolId(null)
        setViewerSchoolLoaded(true)
      })
      return
    }

    let cancelled = false

    void (async () => {
      const metaSchoolId =
        (user.user_metadata?.school_id as string | undefined) ??
        (user.app_metadata?.school_id  as string | undefined) ??
        profile?.school_id ??
        null

      if (metaSchoolId) {
        if (!cancelled) {
          setViewerSchoolId(metaSchoolId)
          setViewerSchoolLoaded(true)
        }
        return
      }

      const { data } = role === 'faculty'
        ? await supabase
            .from('faculty')
            .select('school_id')
            .eq('user_id', user.id)
            .single()
        : await supabase
            .from('admins')
            .select('school_id')
            .eq('user_id', user.id)
            .single()

      if (!cancelled) {
        setViewerSchoolId(data?.school_id ?? null)
        setViewerSchoolLoaded(true)
      }
    })()

    return () => { cancelled = true }
  }, [authLoading, user, profile?.role, profile?.school_id, supabase])

  // ── Data fetching ─────────────────────────────────────────────────────────
  const loadPrograms = useCallback(async () => {
    setLoading(true)
    setError(null)

    const role =
      (user?.user_metadata?.role as string | undefined) ??
      (user?.app_metadata?.role  as string | undefined) ??
      profile?.role

    if ((role === 'faculty' || role === 'admin') && !viewerSchoolId) {
      setPrograms([])
      setLoading(false)
      return
    }

    const raw = await fetchAllProgramData(supabase, viewerSchoolId)

    if (raw.error) {
      setError('Could not load programs. Please try again.')
      setLoading(false)
      return
    }

    setPrograms(mapToDisplayPrograms(raw))
    setLoading(false)
  }, [supabase, user, profile?.role, viewerSchoolId])

  // Fire on mount (deferred by one tick to avoid blocking the initial paint)
  useEffect(() => {
    if (!viewerSchoolLoaded) {
      return
    }
    const t = window.setTimeout(() => { void loadPrograms() }, 0)
    return () => window.clearTimeout(t)
  }, [loadPrograms, viewerSchoolLoaded])

  // ── Derived: degree type list ─────────────────────────────────────────────
  const scopedPrograms = useMemo<ProgramDisplay[]>(() => {
    const role =
      (user?.user_metadata?.role as string | undefined) ??
      (user?.app_metadata?.role  as string | undefined) ??
      profile?.role

    if (role !== 'faculty' && role !== 'admin') {
      return programs
    }

    if (!viewerSchoolId) {
      return role === 'faculty' || role === 'admin' ? [] : programs
    }

    return programs.filter((p) => p.school_id === viewerSchoolId)
  }, [programs, user, profile?.role, viewerSchoolId])

  const degreeTypes = useMemo<string[]>(() => {
    const types = Array.from(new Set(scopedPrograms.map((p) => p.degree_type))).sort()
    return ['all', ...types]
  }, [scopedPrograms])

  // ── Derived: filtered programs ────────────────────────────────────────────
  const filteredPrograms = useMemo<ProgramDisplay[]>(() => {
    const q = filters.search.toLowerCase().trim()

    return scopedPrograms.filter((p) => {
      if (filters.filterDeg !== 'all' && p.degree_type !== filters.filterDeg) {
        return false
      }
      if (filters.department !== 'all' && p.departmentCode !== filters.department) {
        return false
      }
      if (
        q &&
        !p.name.toLowerCase().includes(q) &&
        !p.code.toLowerCase().includes(q) &&
        !p.full_name.toLowerCase().includes(q)
      ) {
        return false
      }
      return true
    })
  }, [scopedPrograms, filters])

  const departmentOptions = useMemo<string[]>(() => {
    const departments = Array.from(
      new Set(scopedPrograms.map((p) => p.departmentCode).filter(Boolean)),
    ).sort()

    return ['all', ...departments]
  }, [scopedPrograms])

  const groupedPrograms = useMemo<Array<{ key: string; label: string; programs: ProgramDisplay[] }>>(() => {
    const grouped = new Map<string, { label: string; programs: ProgramDisplay[] }>()

    filteredPrograms.forEach((program) => {
      const key = program.departmentCode || 'UNASSIGNED'
      const label = program.school_full_name ?? (key === 'UNASSIGNED' ? 'Unassigned' : key)
      const existing = grouped.get(key)
      if (existing) {
        existing.programs.push(program)
      } else {
        grouped.set(key, { label, programs: [program] })
      }
    })

    return Array.from(grouped.entries()).map(([key, value]) => ({
      key,
      label: value.label,
      programs: value.programs,
    }))
  }, [filteredPrograms])

  // ── Derived: stats ────────────────────────────────────────────────────────
  const stats = useMemo<ProgramStats>(
    () => ({
      total:    scopedPrograms.length,
      students: scopedPrograms.reduce((s, p) => s + p.studentCount, 0),
      exams:    scopedPrograms.reduce((s, p) => s + p.examCount,    0),
      active:   scopedPrograms.filter((p) => p.studentCount > 0).length,
    }),
    [scopedPrograms],
  )

  // ── Filter actions ────────────────────────────────────────────────────────
  const setSearch = useCallback((q: string) => {
    setFilters((prev) => ({ ...prev, search: q }))
  }, [])

  const setFilterDeg = useCallback((deg: string) => {
    setFilters((prev) => ({ ...prev, filterDeg: deg }))
  }, [])

  const setDepartment = useCallback((department: string) => {
    setFilters((prev) => ({ ...prev, department }))
  }, [])

  // ── Modal actions ─────────────────────────────────────────────────────────
  const openModal = useCallback((prog: ProgramDisplay) => {
    setSelectedProgram(prog)
  }, [])

  const closeModal = useCallback(() => {
    setSelectedProgram(null)
  }, [])

  // ── Edit description actions ──────────────────────────────────────────────

  const startEditDescription = useCallback(
    (id: EditingId, currentDesc: string | null) => {
      setEditState({
        editingId:     id,
        editDesc:      currentDesc ?? '',
        savingDesc:    false,
        saveDescError: '',
        saveDescOk:    false,
      })
    },
    [],
  )

  const setEditDesc = useCallback((value: string) => {
    setEditState((prev) => ({ ...prev, editDesc: value }))
  }, [])

  const cancelEdit = useCallback(() => {
    setEditState({
      editingId:     null,
      editDesc:      '',
      savingDesc:    false,
      saveDescError: '',
      saveDescOk:    false,
    })
  }, [])

  const saveDescription = useCallback(
    async (programId: string) => {
      setEditState((prev) => ({ ...prev, savingDesc: true, saveDescError: '', saveDescOk: false }))

      const trimmed = editState.editDesc.trim() || null
      const result  = await updateProgramDescription(supabase, programId, trimmed)

      if (result.error) {
        setEditState((prev) => ({
          ...prev,
          savingDesc:    false,
          saveDescError: result.error ?? '',
        }))
        return
      }

      // Optimistic update: patch programs list and open modal (if any)
      setPrograms((prev) =>
        prev.map((p) =>
          p.id === programId ? { ...p, description: trimmed } : p,
        ),
      )
      setSelectedProgram((prev) =>
        prev?.id === programId ? { ...prev, description: trimmed } : prev,
      )

      setEditState((prev) => ({
        ...prev,
        savingDesc: false,
        saveDescOk: true,
      }))

      // Auto-close edit mode after brief success flash
      setTimeout(() => {
        setEditState({
          editingId:     null,
          editDesc:      '',
          savingDesc:    false,
          saveDescError: '',
          saveDescOk:    false,
        })
      }, 1200)
    },
    [supabase, editState.editDesc],
  )

  // ── Public API ────────────────────────────────────────────────────────────
  return {
    programs,
    filteredPrograms,
    stats,
    degreeTypes,
    departmentOptions,
    groupedPrograms,

    loading,
    error,

    filters,
    setSearch,
    setFilterDeg,
    setDepartment,

    selectedProgram,
    openModal,
    closeModal,

    editState,
    startEditDescription,
    setEditDesc,
    saveDescription,
    cancelEdit,

    refreshPrograms: loadPrograms,
  }
}
