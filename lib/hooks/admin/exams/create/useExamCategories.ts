// lib/hooks/admin/exams/create/useExamCategories.ts
//
// FIXED: also fetches programs (needed by the create form's program dropdown).
// Previously programs weren't fetched here, forcing the form to either
// hardcode them or receive them from outside.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect }  from 'react'
import { createClient }         from '@/lib/supabase/client'
import { fetchCategories }      from '@/lib/services/admin/exams/create/exam.service'
import type {
  CategoryOption,
}                               from '@/lib/types/admin/exams/create/exam.types'

// ── ProgramOption (matches the admin exam.types ProgramOption shape) ──────────
interface ProgramOption {
  id:   string
  code: string
  name: string
}

export interface UseExamCategoriesReturn {
  categories: CategoryOption[]
  programs:   ProgramOption[]
  catLoading: boolean
}

export function useExamCategories(): UseExamCategoriesReturn {
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [programs,   setPrograms]   = useState<ProgramOption[]>([])
  const [catLoading, setCatLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const supabase = createClient()

        const [cats, progs] = await Promise.all([
          fetchCategories(supabase),
          supabase
            .from('programs')
            .select('id, code, name')
            .order('code')
            .then(({ data }) => (data ?? []) as ProgramOption[]),
        ])

        if (!cancelled) {
          setCategories(cats)
          setPrograms(progs)
        }
      } catch {
        if (!cancelled) {
          setCategories([])
          setPrograms([])
        }
      } finally {
        if (!cancelled) {setCatLoading(false)}
      }
    }

    void load()
    return () => { cancelled = true }
  }, [])

  return { categories, programs, catLoading }
}
