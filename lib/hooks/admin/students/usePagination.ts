/**
 * lib/hooks/admin/students/usePagination.ts
 *
 * Manages pagination state for any filtered array.
 * Resets to page 1 whenever the source list changes length
 * (covers filter changes, deletions, refetches).
 */

'use client'

import { useState, useEffect, useMemo } from 'react'
import { PAGE_SIZE } from '@/lib/utils/admin/students/constants'

export interface UsePaginationReturn<T> {
  page:       number
  totalPages: number
  safePage:   number
  paginated:  T[]
  setPage:    (n: number) => void
}

export function usePagination<T>(items: T[]): UsePaginationReturn<T> {
  const [page, setPage] = useState(1)

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(items.length / PAGE_SIZE)),
    [items.length],
  )

  // Clamp the page if the list shrinks (deletions / filter changes)
  const safePage = Math.min(page, totalPages)

  // Reset to page 1 whenever the source array length changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1)
  }, [items.length])

  const paginated = useMemo<T[]>(
    () => items.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [items, safePage],
  )

  return {
    page,
    totalPages,
    safePage,
    paginated,
    setPage,
  }
}
