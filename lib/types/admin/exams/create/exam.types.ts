// lib/types/admin/exams/create/exam.types.ts
// All form-level and UI-level types for the Create Exam page.
// Uses Supabase-generated Database types as the source of truth.

import type { Database } from '@/lib/types/database'

// ── Supabase Row Aliases ────────────────────────────────────────────────────

export type ExamInsert    = Database['public']['Tables']['exams']['Insert']
export type CategoryRow   = Database['public']['Tables']['exam_categories']['Row']

// ── UI projection: only what we display in the category dropdown ────────────
// Pick ensures we stay in sync with the generated schema.

export interface CategoryOption {
  id:   string
  name: string
}
 
// ── Form State ──────────────────────────────────────────────────────────────
// All fields are strings in the form (controlled inputs).
// Numeric values are parsed before the Supabase insert.
export type ProgramType =
  | 'BSPsych'
  | 'BSID'
  | 'BLIS'
  | 'BSArch'
  | 'BSEd-MATH'
  | 'BSEd-SCI'
  | 'BSEd-ENG'
  | 'BEEd'
  | 'BSEd-FIL'
export interface ExamFormData {
  title:            string
  description:      string
  category_id:      string   
  program_id:       string  
  exam_type:        'mock' | 'practice'
  duration_minutes: string
  total_points:     string
  passing_score:    string
  is_published:     boolean
}

// ── Validation Errors ───────────────────────────────────────────────────────
// All keys are optional — only errored fields are present.

export interface ExamFormErrors {
  title?:            string
  description?:      string
  category_id?:      string
  program_id?:       string   // ← was "program"
  exam_type?:        string
  duration_minutes?: string
  total_points?:     string
  passing_score?:    string
  general?:          string
}

// ── Hook Return Shape ───────────────────────────────────────────────────────

export interface UseCreateExamReturn {
  form:        ExamFormData
  errors:      ExamFormErrors
  submitting:  boolean
  success:     boolean
  submitError: string | null
  setField:    <K extends keyof ExamFormData>(field: K, value: ExamFormData[K]) => void
  submit:      (e: React.FormEvent<Element>) => Promise<void>
}
export interface UseExamCategoriesReturn {
  categories:  CategoryOption[]
  catLoading:  boolean
}
