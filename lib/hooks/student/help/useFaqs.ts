// lib/hooks/student/help/useFaqs.ts
// Manages FAQ fetching, filtering, search, and accordion state.

import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  HelpCircle, ClipboardList, BarChart2, BookOpen,
  Clock, ShieldCheck, UserCircle, AlertTriangle,
} from 'lucide-react'
import { createClient }   from '@/lib/supabase/client'
import { getFaqs }        from '@/lib/services/student/help/faq.service'
import { FALLBACK_FAQS }  from '@/lib/utils/student/help/fallbackFaqs'
import type { FaqItem, FaqCategory, FaqCategoryWithCount, UseFaqsReturn } from '@/lib/types/student/help/faq.types'

// ── Category definitions ─────────────────────────────────────────────────────

const CATEGORIES: FaqCategory[] = [
  { key: 'all',       label: 'All Topics',       icon: HelpCircle,    color: '#1e3a5f', bg: '#dce8f5' },
  { key: 'taking',    label: 'Taking Exams',      icon: ClipboardList, color: '#2563a8', bg: '#dbeafe' },
  { key: 'results',   label: 'Results & Scores',  icon: BarChart2,     color: '#059669', bg: '#d1fae5' },
  { key: 'reviewers', label: 'Reviewers',         icon: BookOpen,      color: '#7c3aed', bg: '#ede9fe' },
  { key: 'timing',    label: 'Timers & Limits',   icon: Clock,         color: '#d97706', bg: '#fef3c7' },
  { key: 'programs',  label: 'Degree Programs',   icon: ShieldCheck,   color: '#0e7490', bg: '#cffafe' },
  { key: 'account',   label: 'My Account',        icon: UserCircle,    color: '#64748b', bg: '#f1f5f9' },
  { key: 'technical', label: 'Technical Issues',  icon: AlertTriangle, color: '#dc2626', bg: '#fee2e2' },
]

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useFaqs(): UseFaqsReturn {
  const [faqs,           setFaqs]           = useState<FaqItem[]>([])
  const [loading,        setLoading]        = useState(true)
  const [error,          setError]          = useState<string | null>(null)
  const [search,         setSearchState]    = useState('')
  const [activeCategory, setActiveCatState] = useState('all')
  const [openFaqId,      setOpenFaqId]      = useState<string | null>(null)

  // ── Fetch ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false

    async function fetch() {
      setLoading(true)
      setError(null)

      try {
        const db   = createClient()
        const data = await getFaqs(db)
        if (!cancelled) {
          setFaqs(data.length > 0 ? data : FALLBACK_FAQS)
        }
      } catch {
        // FAQ fetch failure is non-fatal — show fallback content
        if (!cancelled) {setFaqs(FALLBACK_FAQS)}
      } finally {
        if (!cancelled) {setLoading(false)}
      }
    }

    void fetch()
    return () => { cancelled = true }
  }, [])

  // ── Derived: categories with counts ──────────────────────────────────────

  const categoriesWithCounts: FaqCategoryWithCount[] = useMemo(
    () =>
      CATEGORIES.map((cat) => ({
        ...cat,
        count:
          cat.key === 'all'
            ? faqs.length
            : faqs.filter((f) => f.category === cat.key).length,
      })),
    [faqs],
  )

  // ── Derived: filtered FAQs ────────────────────────────────────────────────

  const filteredFaqs: FaqItem[] = useMemo(() => {
    const q = search.toLowerCase()
    return faqs.filter((faq) => {
      const matchCat    = activeCategory === 'all' || faq.category === activeCategory
      const matchSearch =
        !q ||
        faq.question.toLowerCase().includes(q) ||
        faq.answer.toLowerCase().includes(q)
      return matchCat && matchSearch
    })
  }, [faqs, activeCategory, search])

  // ── Handlers ──────────────────────────────────────────────────────────────

  const setSearch = useCallback((value: string) => {
    setSearchState(value)
    setActiveCatState('all')
  }, [])

  const setActiveCategory = useCallback((key: string) => {
    setActiveCatState(key)
    setSearchState('')
  }, [])

  const toggleFaq = useCallback((id: string) => {
    setOpenFaqId((prev) => (prev === id ? null : id))
  }, [])

  return {
    faqs,
    filteredFaqs,
    categoriesWithCounts,
    loading,
    error,
    search,
    activeCategory,
    openFaqId,
    setSearch,
    setActiveCategory,
    toggleFaq,
  }
}