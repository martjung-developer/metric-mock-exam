// lib/types/admin/exams/questions/questions.types.ts
//
// All domain types for the questions page.
// Derived from the database schema — no `any`, no unsafe casting.

import type { Database } from '@/lib/types/database'

// ── Re-export for convenience ──────────────────────────────────────────────

export type { QuestionType, QuestionOption } from '@/lib/types/database'
import type { QuestionType, QuestionOption } from '@/lib/types/database'

// ── DB row alias ───────────────────────────────────────────────────────────

export type QuestionRow = Database['public']['Tables']['questions']['Row']
export type QuestionInsert = Database['public']['Tables']['questions']['Insert']
export type QuestionUpdate = Database['public']['Tables']['questions']['Update']

// ── App-level Question shape ───────────────────────────────────────────────
// Narrows `options` from the DB's `Json | null` to the concrete union type.

export interface Question {
  id:             string
  exam_id:        string | null
  question_text:  string
  question_type:  QuestionType
  points:         number
  order_number:   number | null
  options:        QuestionOption[] | null
  correct_answer: string | null
  image_url:      string | null
  explanation:    string | null
  created_at:     string
}

// ── Form state ─────────────────────────────────────────────────────────────

export interface QuestionForm {
  question_text:  string
  question_type:  QuestionType
  points:         number
  options:        QuestionOption[]
  correct_answer: string
  image_url:      string
  explanation:    string
}

export const BLANK_FORM: QuestionForm = {
  question_text:  '',
  question_type:  'multiple_choice',
  points:         1,
  options: [
    { label: 'A', text: '' },
    { label: 'B', text: '' },
    { label: 'C', text: '' },
    { label: 'D', text: '' },
  ],
  correct_answer: '',
  image_url:      '',
  explanation:    '',
}

// ── Grading classification ─────────────────────────────────────────────────

export const AUTO_GRADE_TYPES: ReadonlyArray<QuestionType> = [
  'multiple_choice',
  'true_false',
  'fill_blank',
] as const

export const MANUAL_GRADE_TYPES: ReadonlyArray<QuestionType> = [
  'short_answer',
  'matching',
  'essay',
] as const

export function isAutoGraded(type: QuestionType): boolean {
  return (AUTO_GRADE_TYPES as ReadonlyArray<string>).includes(type)
}

// ── Grouped data shape ─────────────────────────────────────────────────────

export type GroupedQuestions = Partial<Record<QuestionType, Question[]>>

// ── Type ordering + display metadata ──────────────────────────────────────

export const GROUP_ORDER: ReadonlyArray<QuestionType> = [
  'multiple_choice',
  'true_false',
  'fill_blank',
  'short_answer',
  'matching',
  'essay',
] as const

export type ColorToken =
  | 'blue'
  | 'green'
  | 'rose'
  | 'amber'
  | 'teal'
  | 'violet'

export interface TypeMeta {
  label:       string
  /** Lucide icon component — passed as a prop, not rendered directly here */
  color:       ColorToken
  description: string
  autoGrade:   boolean
}

// ── Toast ──────────────────────────────────────────────────────────────────

export interface ToastState {
  message: string
  type:    'success' | 'error'
}

// ── Service result wrapper ─────────────────────────────────────────────────

export interface ServiceResult<T = void> {
  data:  T | null
  error: string | null
}

// ── Filter / UI state ──────────────────────────────────────────────────────

export type TypeFilter = QuestionType | 'all'

// ── Modal mode ─────────────────────────────────────────────────────────────

export type ModalMode =
  | { open: false }
  | { open: true; mode: 'create'; defaultType: QuestionType }
  | { open: true; mode: 'edit';   target: Question }

// ── Validation error shape ─────────────────────────────────────────────────

export interface ValidationError {
  field:   string
  message: string
}

export type ValidationResult =
  | { valid: true }
  | { valid: false; errors: [ValidationError, ...ValidationError[]] }
