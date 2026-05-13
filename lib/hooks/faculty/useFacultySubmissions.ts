// lib/hooks/faculty/useFacultySubmissions.ts
// Faculty hook — manages drafts, submissions, and resubmit flow.

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient }       from '@/lib/supabase/client'
import { useUser }            from '@/lib/context/AuthContext'
import type {
  QuestionBank,
  FacultySubmissionSummary,
  ApprovalStatus,
} from '@/lib/types/approval'
import {
  fetchFacultyQuestionBanks,
  fetchFacultySubmissionSummary,
  submitForReview,
} from '@/lib/services/approval/approval.service'

export interface UseFacultySubmissionsReturn {
  banks:       QuestionBank[]
  summary:     FacultySubmissionSummary
  loading:     boolean
  error:       string | null
  submitting:  string | null   // entity id currently being submitted
  statusFilter: ApprovalStatus | 'all'
  filteredBanks: QuestionBank[]
  setStatusFilter: (s: ApprovalStatus | 'all') => void
  handleSubmitForReview: (bankId: string) => Promise<void>
  handleRefresh: () => void
}

const BLANK_SUMMARY: FacultySubmissionSummary = {
  drafts: 0, pending: 0, approved: 0, rejected: 0, published: 0,
}

export function useFacultySubmissions(): UseFacultySubmissionsReturn {
  const supabase = useMemo(() => createClient(), [])
  const { user } = useUser()

  const [banks,        setBanks]        = useState<QuestionBank[]>([])
  const [summary,      setSummary]      = useState<FacultySubmissionSummary>(BLANK_SUMMARY)
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState<string | null>(null)
  const [submitting,   setSubmitting]   = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<ApprovalStatus | 'all'>('all')

  const fetchAll = useCallback(async () => {
    if (!user) {
      return
    }
    setLoading(true)
    setError(null)
    try {
      const [bankData, summaryData] = await Promise.all([
        fetchFacultyQuestionBanks(supabase, user.id),
        fetchFacultySubmissionSummary(supabase, user.id),
      ])
      setBanks(bankData)
      setSummary(summaryData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load submissions.')
    } finally {
      setLoading(false)
    }
  }, [supabase, user])

  useEffect(() => { void fetchAll() }, [fetchAll])

  const handleRefresh = useCallback(() => { void fetchAll() }, [fetchAll])

  const filteredBanks = useMemo(() => {
    if (statusFilter === 'all') {
      return banks
    }
    return banks.filter((b) => b.approval_status === statusFilter)
  }, [banks, statusFilter])

  const handleSubmitForReview = useCallback(async (bankId: string) => {
    if (!user) {
      return
    }
    setSubmitting(bankId)
    setError(null)
    try {
      await submitForReview(supabase, 'question_bank', bankId, user.id)
      await fetchAll()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed.')
    } finally {
      setSubmitting(null)
    }
  }, [supabase, user, fetchAll])

  return {
    banks, summary, loading, error,
    submitting, statusFilter, filteredBanks,
    setStatusFilter,
    handleSubmitForReview,
    handleRefresh,
  }
}