// lib/hooks/approval/useApprovalQueue.ts
// Admin hook — manages the pending review queue.

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import type {
  PendingReviewItem,
  ApprovalEntityType,
  ReviewActionPayload,
} from '@/lib/types/approval'
import {
  fetchPendingReviewItems,
  reviewAction,
  fetchApprovalHistory,
} from '@/lib/services/approval/approval.service'
import type { ApprovalEvent } from '@/lib/types/approval'
import { useUser } from '@/lib/context/AuthContext'

export interface UseApprovalQueueReturn {
  items:          PendingReviewItem[]
  loading:        boolean
  refreshing:     boolean
  error:          string | null
  selectedItem:   PendingReviewItem | null
  reviewNotes:    string
  acting:         boolean
  history:        ApprovalEvent[]
  historyLoading: boolean
  filterType:     ApprovalEntityType | 'all'
  filteredItems:  PendingReviewItem[]
  setFilterType:  (t: ApprovalEntityType | 'all') => void
  openReview:     (item: PendingReviewItem) => void
  closeReview:    () => void
  setReviewNotes: (n: string) => void
  handleApprove:  () => Promise<void>
  handleReject:   () => Promise<void>
  handlePublish:  () => Promise<void>
  handleRefresh:  () => void
}

export function useApprovalQueue(): UseApprovalQueueReturn {
  const supabase    = useMemo(() => createClient(), [])
  const { user }    = useUser()

  const [items,          setItems]          = useState<PendingReviewItem[]>([])
  const [loading,        setLoading]        = useState(true)
  const [refreshing,     setRefreshing]     = useState(false)
  const [error,          setError]          = useState<string | null>(null)
  const [selectedItem,   setSelectedItem]   = useState<PendingReviewItem | null>(null)
  const [reviewNotes,    setReviewNotes]    = useState('')
  const [acting,         setActing]         = useState(false)
  const [history,        setHistory]        = useState<ApprovalEvent[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [filterType,     setFilterType]     = useState<ApprovalEntityType | 'all'>('all')

  const fetchAll = useCallback(async (silent = false) => {
    if (silent) { setRefreshing(true) } else { setLoading(true) }
    setError(null)
    try {
      const data = await fetchPendingReviewItems(supabase)
      setItems(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load review queue.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [supabase])

  useEffect(() => { void fetchAll() }, [fetchAll])

  const handleRefresh = useCallback(() => { void fetchAll(true) }, [fetchAll])

  const filteredItems = useMemo(() => {
    if (filterType === 'all') {
      return items
    }
    return items.filter((i) => i.entityType === filterType)
  }, [items, filterType])

  const openReview = useCallback(async (item: PendingReviewItem) => {
    setSelectedItem(item)
    setReviewNotes(item.reviewNotes ?? '')
    setHistory([])
    setHistoryLoading(true)
    try {
      const hist = await fetchApprovalHistory(supabase, item.entityType, item.id)
      setHistory(hist)
    } finally {
      setHistoryLoading(false)
    }
  }, [supabase])

  const closeReview = useCallback(() => {
    setSelectedItem(null)
    setReviewNotes('')
    setHistory([])
  }, [])

  const doAction = useCallback(async (
    action: ReviewActionPayload['action'],
  ) => {
    if (!selectedItem || !user) {
      return
    }
    setActing(true)
    try {
      await reviewAction(
        supabase,
        {
          entityType: selectedItem.entityType,
          entityId:   selectedItem.id,
          action,
          notes:      reviewNotes.trim() || undefined,
        },
        user.id,
      )
      closeReview()
      await fetchAll(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed.')
    } finally {
      setActing(false)
    }
  }, [selectedItem, user, supabase, reviewNotes, closeReview, fetchAll])

  return {
    items, loading, refreshing, error,
    selectedItem, reviewNotes, acting,
    history, historyLoading,
    filterType, filteredItems,
    setFilterType,
    openReview, closeReview,
    setReviewNotes,
    handleApprove: () => doAction('approve'),
    handleReject:  () => doAction('reject'),
    handlePublish: () => doAction('publish'),
    handleRefresh,
  }
}