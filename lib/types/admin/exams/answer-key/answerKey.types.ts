// lib/types/admin/exams/answer-key/answerKey.types.ts
// ─────────────────────────────────────────────────────────────────────────────
// CHANGES FROM PREVIOUS VERSION:
//   + scenario field added to AnswerKeyEntry
//   + QuestionRaw includes scenario
// ─────────────────────────────────────────────────────────────────────────────

import type { Database } from '@/lib/types/database'
import type { QuestionType, QuestionOption } from '@/lib/types/database'
export type { QuestionType, QuestionOption } from '@/lib/types/database'

export type QuestionRow    = Database['public']['Tables']['questions']['Row']
export type QuestionUpdate = Database['public']['Tables']['questions']['Update']
export type ExamRow        = Database['public']['Tables']['exams']['Row']

export interface QuestionRaw {
  id:             string
  question_text:  string
  question_type:  string
  points:         number
  order_number:   number | null
  options:        unknown
  correct_answer: string | null
  explanation:    string | null
  scenario:       string | null   
}

export interface ExamMeta {
  title:        string
  total_points: number
  exam_type:    string
}

export interface AnswerKeyEntry {
  question_id:            string
  question_text:          string
  question_type:          QuestionType
  points:                 number
  order_number:           number | null
  options:                QuestionOption[] | null
  correct_answer:         string | null
  override:               string | null
  explanation:            string | null
  scenario:               string | null   // NEW
  originalCorrectAnswer:  string | null
  originalExplanation:    string | null
}

export function effectiveAnswer(entry: AnswerKeyEntry): string {
  return entry.override !== null ? entry.override : (entry.correct_answer ?? '')
}

export function isEntryDirty(entry: AnswerKeyEntry): boolean {
  const answerChanged =
    entry.override !== null &&
    entry.override !== (entry.correct_answer ?? '')

  const explanationChanged =
    (entry.explanation ?? null) !== entry.originalExplanation

  return answerChanged || explanationChanged
}

export interface SavePayload {
  question_id:    string
  correct_answer: string | null
  explanation:    string | null
}

export interface ServiceResult<T = void> {
  data:  T | null
  error: string | null
}

export type ToastState = {
  message: string
  type:    'success' | 'error'
} | null

export const AUTO_TYPES:   QuestionType[] = ['multiple_choice', 'true_false', 'fill_blank']
export const MANUAL_TYPES: QuestionType[] = ['short_answer', 'essay', 'matching']

export const GROUP_ORDER: QuestionType[] = [
  'multiple_choice', 'true_false', 'fill_blank',
  'short_answer', 'matching', 'essay',
]

export type TypeColor = 'blue' | 'green' | 'rose' | 'amber' | 'violet' | 'teal'

export interface TypeMeta {
  label: string
  color: TypeColor
}

export const TYPE_META: Record<QuestionType, TypeMeta> = {
  multiple_choice: { label: 'Multiple Choice', color: 'blue'   },
  true_false:      { label: 'True / False',    color: 'green'  },
  short_answer:    { label: 'Short Answer',    color: 'amber'  },
  essay:           { label: 'Essay',           color: 'violet' },
  matching:        { label: 'Matching',        color: 'teal'   },
  fill_blank:      { label: 'Fill in Blank',   color: 'rose'   },
}