// lib/hooks/admin/study-materials/useStudyMaterials.ts
//
// Manages server state for the Study Materials list:
//   - fetching materials + programs
//   - optimistic updates for toggle-publish and delete
//   - delegating mutations to the service layer
//
// FIX: remove() uses functional setState to avoid capturing stale `materials`
// in the closure, which caused the rollback snapshot to always be empty.

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type {
  StudyMaterial,
  ProgramOption,
} from '@/lib/types/admin/study-materials/study-materials'
import type { RawFormState } from '@/lib/utils/admin/study-materials/validators'
import {
  fetchStudyMaterials,
  fetchPrograms,
  createStudyMaterial,
  updateStudyMaterial,
  deleteStudyMaterial,
  toggleMaterialPublish,
} from '@/lib/services/admin/study-materials/studyMaterials.service'

// ── Hook return shape ─────────────────────────────────────────────────────────

export interface UseStudyMaterialsReturn {
  materials:     StudyMaterial[]
  programs:      ProgramOption[]
  loading:       boolean
  error:         string | null
  refresh:       () => Promise<void>
  clearError:    () => void
  create:        (form: RawFormState, file: File | null) => Promise<void>
  update:        (
    id: string,
    form: RawFormState,
    file: File | null,
    existingFileUrl: string | null,
  ) => Promise<void>
  remove:        (id: string) => Promise<void>
  togglePublish: (id: string, currentValue: boolean) => Promise<void>
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useStudyMaterials(): UseStudyMaterialsReturn {
  const supabase = useMemo(() => createClient(), [])

  const [materials, setMaterials] = useState<StudyMaterial[]>([])
  const [programs,  setPrograms]  = useState<ProgramOption[]>([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState<string | null>(null)

  const abortRef = useRef<AbortController | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const refresh = useCallback(async () => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    setError(null)

    try {
      const [mats, progs] = await Promise.all([
        fetchStudyMaterials(supabase),
        fetchPrograms(supabase),
      ])

      if (!controller.signal.aborted) {
        setMaterials(mats)
        setPrograms(progs)
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        setError(err instanceof Error ? err.message : 'Failed to load data.')
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false)
      }
    }
  }, [supabase])

  useEffect(() => {
    void refresh()
    return () => { abortRef.current?.abort() }
  }, [refresh])

  // Keep list/counts in sync with non-blocking realtime updates.
  useEffect(() => {
    channelRef.current = supabase
      .channel('admin_study_materials_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'study_materials' },
        () => { void refresh() },
      )
      .subscribe()

    return () => {
      if (channelRef.current) {
        void supabase.removeChannel(channelRef.current)
      }
      channelRef.current = null
    }
  }, [supabase, refresh])

  // ── Optimistic toggle publish ─────────────────────────────────────────────

  const togglePublish = useCallback(async (id: string, currentValue: boolean) => {
    const next = !currentValue

    setMaterials((prev) =>
      prev.map((m) => (m.id === id ? { ...m, is_published: next } : m)),
    )

    try {
      await toggleMaterialPublish(supabase, id, next)
    } catch (err) {
      // Roll back
      setMaterials((prev) =>
        prev.map((m) => (m.id === id ? { ...m, is_published: currentValue } : m)),
      )
      setError(err instanceof Error ? err.message : 'Failed to update publish status.')
    }
  }, [supabase])

  // ── Optimistic delete ─────────────────────────────────────────────────────
  // FIX: capture snapshot inside functional updater to avoid stale closure

  const remove = useCallback(async (id: string) => {
    let snapshot: StudyMaterial | null = null

    setMaterials((prev) => {
      snapshot = prev.find((m) => m.id === id) ?? null
      return prev.filter((m) => m.id !== id)
    })

    try {
      await deleteStudyMaterial(supabase, id)
    } catch (err) {
      if (snapshot) {
        const captured = snapshot
        setMaterials((prev) => [captured, ...prev])
      }
      setError(err instanceof Error ? err.message : 'Failed to delete material.')
    }
  }, [supabase])

  // ── Create ────────────────────────────────────────────────────────────────

  const create = useCallback(async (form: RawFormState, file: File | null) => {
    await createStudyMaterial({ supabase, form, file })
    await refresh()
  }, [supabase, refresh])

  // ── Update ────────────────────────────────────────────────────────────────

  const update = useCallback(async (
    id: string,
    form: RawFormState,
    file: File | null,
    existingFileUrl: string | null,
  ) => {
    await updateStudyMaterial({ supabase, id, form, file, existingFileUrl })
    await refresh()
  }, [supabase, refresh])

  return {
    materials,
    programs,
    loading,
    error,
    refresh,
    clearError: () => setError(null),
    create,
    update,
    remove,
    togglePublish,
  }
}
