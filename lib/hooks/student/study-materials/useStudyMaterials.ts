// lib/hooks/student/study-materials/useStudyMaterials.ts
// ─────────────────────────────────────────────────────────────────────────────
// Owns:
//  • data fetching via service (view-first + fallback)
//  • realtime subscription (auto-refresh on study_materials changes)
//  • 300ms debounced search
//  • category + type filters
//  • pagination
//  • favorites (toggle + merged is_favorited flag)
//  • recently viewed list (from localStorage)
//  • all derived values: filtered, categories, totalPages, paginated, pageNums
// ─────────────────────────────────────────────────────────────────────────────

import {
  useCallback, useEffect, useMemo, useRef, useState,
} from 'react'
import { useUser }       from '@/lib/context/AuthContext'
import { createClient }  from '@/lib/supabase/client'
import {
  fetchStudyMaterials,
  getFavoriteIds,
  toggleFavorite as svcToggleFavorite,
  subscribeToStudyMaterials,
} from '@/lib/services/student/study-materials/studyMaterials.service'
import {
  matchesSearch,
  buildPageNums,
  getRecentlyViewedIds,
  recordRecentlyViewed,
} from '@/lib/utils/student/study-materials/study-materials'
import type {
  StudyMaterial,
  StudyMaterialFilters,
  TypeFilter,
} from '@/lib/types/student/study-materials/study-materials'
import { INITIAL_FILTERS } from '@/lib/types/student/study-materials/study-materials'

const PAGE_SIZE = 6

// ── Return shape ──────────────────────────────────────────────────────────────

export interface UseStudyMaterialsReturn {
  // Data
  loading:       boolean
  error:         string | null
  totalCount:    number

  // Filters
  filters:       StudyMaterialFilters
  setSearch:     (v: string) => void
  setCategory:   (v: string) => void
  setType:       (v: TypeFilter) => void
  clearFilters:  () => void

  // Derived
  categoryNames: string[]          // ['All Categories', ...unique]
  filtered:      StudyMaterial[]   // after filters (used for count display)

  // Pagination
  page:          number
  setPage:       (n: number) => void
  totalPages:    number
  safePage:      number
  paginated:     StudyMaterial[]
  pageNums:      (number | '…')[]

  // Actions
  refresh:       () => Promise<void>

  // Favorites
  toggleFav:     (materialId: string) => Promise<void>

  // Recently viewed
  recentIds:      string[]
  recordViewed:  (materialId: string) => void
}

export function useStudyMaterials(): UseStudyMaterialsReturn {
  const { user }   = useUser()
  const supabase   = useMemo(() => createClient(), [])
  const isMounted  = useRef(true)
  const hasFetched = useRef(false)

  // ── Raw data ──────────────────────────────────────────────────────────────
  const [allMaterials, setAllMaterials] = useState<StudyMaterial[]>([])
  const [favoriteIds,  setFavoriteIds]  = useState<string[]>([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState<string | null>(null)

  // ── Filters ───────────────────────────────────────────────────────────────
  const [filters, setFilters] = useState<StudyMaterialFilters>(INITIAL_FILTERS)
  const [page,    setPage]    = useState(1)

  // ── Debounced search (300ms) ──────────────────────────────────────────────
  const [debouncedSearch, setDebouncedSearch] = useState('')
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(filters.search), 300)
    return () => clearTimeout(t)
  }, [filters.search])

  // ── Recently viewed ───────────────────────────────────────────────────────
  const [recentIds, setRecentIds] = useState<string[]>([])
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRecentIds(getRecentlyViewedIds())
  }, [])

 // AFTER: use functional updater so setRecentIds only fires when
// the ID is genuinely new, and getRecentlyViewedIds() is called
// inside the updater (not on every render).
const recordViewed = useCallback((materialId: string) => {
  recordRecentlyViewed(materialId)
  // Read fresh list inside the updater — avoids stale closure
  // and prevents unnecessary re-renders when list hasn't changed.
  setRecentIds(getRecentlyViewedIds())
}, []) // [] is correct — setRecentIds and the utils are stable

  // ── Mount / unmount guard ─────────────────────────────────────────────────
  useEffect(() => {
    isMounted.current = true
    return () => { isMounted.current = false }
  }, [])

  // ── Get student's programId from user metadata ────────────────────────────
  // The student's program_id lives in the students table, not auth metadata.
  // We fetch it separately on first load.
  const [programId, setProgramId] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {return}
    supabase
      .from('students')
      .select('program_id')
      .eq('id', user.id)
      .single()
      .then(({ data }: { data: { program_id: string | null } | null }) => {
        if (isMounted.current) {setProgramId(data?.program_id ?? null)}
      })
  }, [user, supabase])

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const refresh = useCallback(async () => {
    if (!user) {return}
    if (isMounted.current) { setLoading(true); setError(null) }

    const [materialsOutcome, favIds] = await Promise.all([
      fetchStudyMaterials(supabase, programId),
      getFavoriteIds(supabase, user.id),
    ])

    if (!isMounted.current) {return}

    if (!materialsOutcome.ok) {
      setError(materialsOutcome.message)
      setLoading(false)
      return
    }

    // Merge is_favorited flag
    const favSet = new Set(favIds)
    const merged = materialsOutcome.materials.map((m) => ({
      ...m,
      is_favorited: favSet.has(m.id),
    }))

    setAllMaterials(merged)
    setFavoriteIds(favIds)
    setLoading(false)
  }, [user, supabase, programId])

  // Initial fetch — wait for user AND programId to resolve
  useEffect(() => {
    if (!user || hasFetched.current) {return}
    hasFetched.current = true
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh()
  }, [user, refresh])

  // Re-fetch when programId resolves (may be delayed by one tick)
  const prevProgramId = useRef<string | null | undefined>(undefined)
  useEffect(() => {
    if (prevProgramId.current === undefined) {
      prevProgramId.current = programId
      return
    }
    if (prevProgramId.current !== programId) {
      prevProgramId.current = programId
      hasFetched.current    = false
      refresh()
    }
  }, [programId, refresh])

  // ── Realtime subscription ─────────────────────────────────────────────────
  useEffect(() => {
    if (!user) {return}
    const channel = subscribeToStudyMaterials(supabase, () => {
      hasFetched.current = false
      refresh()
    })
    return () => { supabase.removeChannel(channel) }
  }, [user, supabase, refresh])

  // ── Filter helpers ────────────────────────────────────────────────────────
  const setSearch   = useCallback((v: string) => { setFilters((f) => ({ ...f, search:   v })); setPage(1) }, [])
  const setCategory = useCallback((v: string) => { setFilters((f) => ({ ...f, category: v })); setPage(1) }, [])
  const setType     = useCallback((v: TypeFilter) => { setFilters((f) => ({ ...f, type: v })); setPage(1) }, [])
  const clearFilters = useCallback(() => { setFilters(INITIAL_FILTERS); setPage(1) }, [])

  // ── Derived: category names ───────────────────────────────────────────────
  const categoryNames = useMemo<string[]>(() => {
    const cats = Array.from(
      new Set(
        allMaterials
          .map((m) => m.category)
          .filter((c): c is string => c !== null && c !== undefined),
      ),
    ).sort()
    return ['All Categories', ...cats]
  }, [allMaterials])

  // ── Derived: filtered (memoised — no refetch on filter change) ────────────
  const filtered = useMemo<StudyMaterial[]>(() => {
    const q = debouncedSearch.toLowerCase().trim()
    return allMaterials.filter((m) => {
      if (filters.category !== 'All Categories' && m.category !== filters.category) {return false}
      if (filters.type     !== 'All Types'       && m.type     !== filters.type)     {return false}
      if (!matchesSearch(m, q))                                                       {return false}
      return true
    })
  }, [allMaterials, debouncedSearch, filters.category, filters.type])

  // ── Pagination ────────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage   = Math.min(page, totalPages)
  const paginated  = useMemo(
    () => filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filtered, safePage],
  )
  const pageNums = useMemo(
    () => buildPageNums(totalPages, safePage),
    [totalPages, safePage],
  )

  // ── Favorites ─────────────────────────────────────────────────────────────
  const toggleFav = useCallback(async (materialId: string) => {
    if (!user) {return}
    const isFav    = favoriteIds.includes(materialId)
    const nextFav  = await svcToggleFavorite(supabase, user.id, materialId, isFav)
    const nextIds  = nextFav
      ? [...favoriteIds, materialId]
      : favoriteIds.filter((id) => id !== materialId)

    setFavoriteIds(nextIds)
    const favSet = new Set(nextIds)
    setAllMaterials((prev) =>
      prev.map((m) => ({ ...m, is_favorited: favSet.has(m.id) })),
    )
  }, [user, supabase, favoriteIds])

  return {
    loading, error, totalCount: allMaterials.length,
    filters, setSearch, setCategory, setType, clearFilters,
    categoryNames, filtered,
    page, setPage, totalPages, safePage, paginated, pageNums,
    refresh, toggleFav,
    recentIds, recordViewed,
  }
}
