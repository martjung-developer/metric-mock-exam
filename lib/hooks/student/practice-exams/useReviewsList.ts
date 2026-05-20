// lib/hooks/student/practice-exams/useReviewsList.ts
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useUser } from '@/lib/context/AuthContext'
import {
  fetchStudentProgramId,
  fetchReviewsForStudent,
  type ReviewItem,
} from '@/lib/services/student/practice-exams/practiceExamList.service'

const ALL_CATEGORIES = 'All Categories'
const PAGE_SIZE      = 12

export { ALL_CATEGORIES, PAGE_SIZE }

export interface UseReviewsListReturn {
  // Data
  allReviews:    ReviewItem[]
  filtered:      ReviewItem[]
  paginated:     ReviewItem[]
  categories:    string[]
  availableCount: number

  // Filters
  search:    string
  category:  string
  setSearch:   (v: string) => void
  setCategory: (v: string) => void

  // Pagination
  page:       number
  safePage:   number
  totalPages: number
  pageNums:   (number | '…')[]
  setPage:    (p: number) => void

  // Status
  loading: boolean
  error:   string | null
  refetch: () => Promise<void>
}

export function useReviewsList(): UseReviewsListReturn {
  const { user, loading: authLoading, error: authError } = useUser()

  const [allReviews,  setAllReviews]  = useState<ReviewItem[]>([])
  const [dataLoading, setDataLoading] = useState(false)
  const [dataError,   setDataError]   = useState<string | null>(null)
  const [search,      setSearch]      = useState('')
  const [category,    setCategory]    = useState(ALL_CATEGORIES)
  const [page,        setPage]        = useState(1)
  const [programId,   setProgramId]   = useState<string | null>(null)
  const [programReady, setProgramReady] = useState(false)

  // Load program_id once
  useEffect(() => {
    if (!user) {return}
    const controller = new AbortController()
    fetchStudentProgramId(user.id, controller.signal).then(id => {
      if (!controller.signal.aborted) {
        setProgramId(id)
        setProgramReady(true)
      }
    })
    return () => controller.abort()
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const refetch = useCallback(async () => {
    if (!user || !programReady) {return}
    const controller = new AbortController()
    setDataLoading(true)
    setDataError(null)

    await fetchReviewsForStudent(user.id, programId, controller.signal).then(
      ({ reviews, error }) => {
        if (controller.signal.aborted) {return}
        setAllReviews(reviews)
        setDataError(error)
        setDataLoading(false)
      },
    )
    controller.abort()
  }, [programId, programReady, user])

  // Load reviews
  useEffect(() => {
    void refetch()
  }, [refetch])

  const categories = useMemo(() => {
    const unique = Array.from(new Set(allReviews.map(r => r.category))).sort()
    return [ALL_CATEGORIES, ...unique]
  }, [allReviews])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return allReviews.filter(r => {
      const matchCat = category === ALL_CATEGORIES || r.category === category
      const matchQ   = !q || r.title.toLowerCase().includes(q) || r.shortCode.toLowerCase().includes(q)
      return matchCat && matchQ
    })
  }, [allReviews, search, category])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage   = Math.min(page, totalPages)
  const paginated  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const pageNums = useMemo((): (number | '…')[] => {
    const nums: (number | '…')[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {nums.push(i)}
    } else {
      nums.push(1)
      if (safePage > 3) {nums.push('…')}
      for (let i = Math.max(2, safePage - 1); i <= Math.min(totalPages - 1, safePage + 1); i++) {nums.push(i)}
      if (safePage < totalPages - 2) {nums.push('…')}
      nums.push(totalPages)
    }
    return nums
  }, [totalPages, safePage])

  const handleSetSearch = useCallback((v: string) => { setSearch(v); setPage(1) }, [])
  const handleSetCategory = useCallback((v: string) => { setCategory(v); setPage(1) }, [])

  return {
    allReviews,
    filtered,
    paginated,
    categories,
    availableCount: allReviews.filter(r => r.status === 'available').length,
    search,
    category,
    setSearch:   handleSetSearch,
    setCategory: handleSetCategory,
    page,
    safePage,
    totalPages,
    pageNums,
    setPage,
    loading: authLoading || dataLoading,
    error:   authError ?? dataError,
    refetch,
  }
}
