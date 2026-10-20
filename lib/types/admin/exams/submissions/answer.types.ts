// lib/types/admin/exams/submissions/answer.types.ts

import type { QuestionType, Json } from '@/lib/types/database'

// ── Raw Supabase join shape ───────────────────────────────────────────────────

export interface RawQuestionJoin {
  question_text:  string
  question_type:  string    // narrowed to QuestionType in mapper
  points:         number
  options:        Json | null
  correct_answer: string | null
  explanation:    string | null
  order_number:   number | null
  section_title?: string | null
  section_number?: number | null
} 

export interface AnswerRaw {
  id:            string
  question_id:   string | null
  answer_text:   string | null
  is_correct:    boolean | null
  points_earned: number | null
  feedback:      string | null
  questions:     RawQuestionJoin | RawQuestionJoin[] | null
}

// ── UI-facing domain types ────────────────────────────────────────────────────

export interface QuestionDetail {
  question_text:  string
  question_type:  QuestionType
  points:         number
  options:        Array<{ label: string; text: string }> | null
  correct_answer: string | null
  explanation:    string | null
  order_number:   number | null
  section_title?: string | null
  section_number?: number | null
}

export interface AnswerDetail {
  id:            string
  question_id:   string
  answer_text:   string | null
  is_correct:    boolean | null
  points_earned: number | null
  feedback:      string
  question:      QuestionDetail | null
}

export interface AnswerKeyEntry {
  question_id:    string // questions.id (UUID)
  correct_answer: string | null
  question_text:  string
  question_type:  QuestionType
  order_number:   number | null
}

export interface AnswerStats {
  correct:   number
  incorrect: number
  pending:   number
  total:     number
}
