// lib/types/student/help/faq.types.ts
// All FAQ-related types for the Student Help page.

// ── Supabase row shape ──────────────────────────────────────────────────────
// Matches the `help_faqs` table columns used in the .select() query.
// Kept separate from FaqItem so the service boundary is explicit.

export interface FaqRow {
  id:       string
  question: string
  answer:   string
  category: string
}

// ── UI-level FAQ shape ──────────────────────────────────────────────────────
// Identical to FaqRow for now, but decoupled so UI logic never depends
// directly on the DB representation.

export interface FaqItem {
  id:       string
  question: string
  answer:   string
  category: string
}

// ── Category definition ─────────────────────────────────────────────────────
// Used in the category filter strip. Icon is a React component type.

import type { LucideIcon } from 'lucide-react'

export interface FaqCategory {
  key:   string
  label: string
  icon:  LucideIcon
  color: string
  bg:    string
}

// Category with computed count (derived in the hook via useMemo)
export interface FaqCategoryWithCount extends FaqCategory {
  count: number
}

// ── Hook return shapes ──────────────────────────────────────────────────────

export interface UseFaqsReturn {
  faqs:                  FaqItem[]
  filteredFaqs:          FaqItem[]
  categoriesWithCounts:  FaqCategoryWithCount[]
  loading:               boolean
  error:                 string | null
  search:                string
  activeCategory:        string
  openFaqId:             string | null
  setSearch:             (value: string) => void
  setActiveCategory:     (key: string) => void
  toggleFaq:             (id: string) => void
}