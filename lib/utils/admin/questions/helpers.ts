// lib/utils/admin/questions/helpers.ts
//
// Pure utility functions — no React, no Supabase, no state.

import type { Json } from '@/lib/types/database'
import type {
  ColorToken,
  GroupedQuestions,
  Question,
  QuestionOption,
  QuestionRow,
  QuestionType,
  TypeFilter,
  TypeMeta,
} from '@/lib/types/admin/exams/questions/questions.types'
import { GROUP_ORDER } from '@/lib/types/admin/exams/questions/questions.types'
import {
  AlignLeft,
  CheckSquare,
  FileText,
  Hash,
  List,
  ToggleLeft,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

// ── Row parser ─────────────────────────────────────────────────────────────
// Converts a raw DB row (with `Json | null` options) to the app-level Question.

function parseOptions(raw: Json | null): QuestionOption[] | null {
  if (!raw) {return null}
  if (!Array.isArray(raw)) {return null}

  // Validate each element has the shape { label: string, text: string }
  const result: QuestionOption[] = []
  for (const item of raw) {
    if (
      item !== null &&
      typeof item === 'object' &&
      !Array.isArray(item) &&
      'label' in item &&
      'text' in item &&
      typeof (item as Record<string, unknown>).label === 'string' &&
      typeof (item as Record<string, unknown>).text  === 'string'
    ) {
      result.push({
        label: (item as Record<string, string>).label,
        text:  (item as Record<string, string>).text,
      })
    }
  }
  return result.length > 0 ? result : null
}

export function parseQuestionRow(row: QuestionRow): Question {
  return {
    id:             row.id,
    exam_id:        row.exam_id,
    question_text:  row.question_text,
    question_type:  row.question_type,
    points:         row.points,
    order_number:   row.order_number,
    options:        parseOptions(row.options),
    correct_answer: row.correct_answer,
    image_url:      row.image_url,
    explanation:    row.explanation,
    created_at:     row.created_at,
  }
}

// ── Grouping ───────────────────────────────────────────────────────────────

export function groupQuestions(questions: Question[]): GroupedQuestions {
  const map: GroupedQuestions = {}
  for (const q of questions) {
    const bucket = map[q.question_type]
    if (bucket) {
      bucket.push(q)
    } else {
      map[q.question_type] = [q]
    }
  }
  return map
}

// ── Filtering ──────────────────────────────────────────────────────────────

export function filterQuestions(
  questions: Question[],
  search:    string,
  typeFilter: TypeFilter,
): Question[] {
  const q = search.trim().toLowerCase()
  return questions.filter((qn) => {
    const matchSearch = !q || qn.question_text.toLowerCase().includes(q) ||
      (qn.options?.some((option) => option.text.toLowerCase().includes(q)) ?? false)
    const matchType   = typeFilter === 'all' || qn.question_type === typeFilter
    return matchSearch && matchType
  })
}

// ── Aggregates ─────────────────────────────────────────────────────────────

export function calcTotalPoints(questions: Question[]): number {
  return questions.reduce((sum, q) => sum + q.points, 0)
}

export function calcMaxOrderNumber(questions: Question[]): number {
  return questions.reduce((max, q) => Math.max(max, q.order_number ?? 0), 0)
}

// ── Type metadata ──────────────────────────────────────────────────────────

export const TYPE_META: Record<QuestionType, TypeMeta & { icon: LucideIcon }> = {
  multiple_choice: {
    label:       'Multiple Choice',
    icon:        CheckSquare,
    color:       'blue'   as ColorToken,
    description: 'Students pick one correct option (A–D)',
    autoGrade:   true,
  },
  true_false: {
    label:       'True / False',
    icon:        ToggleLeft,
    color:       'green'  as ColorToken,
    description: 'Binary True/False question',
    autoGrade:   true,
  },
  fill_blank: {
    label:       'Fill in Blank',
    icon:        Hash,
    color:       'rose'   as ColorToken,
    description: 'Student fills a blank; exact match graded',
    autoGrade:   true,
  },
  short_answer: {
    label:       'Short Answer',
    icon:        AlignLeft,
    color:       'amber'  as ColorToken,
    description: 'Brief written response; manual/AI graded',
    autoGrade:   false,
  },
  matching: {
    label:       'Matching',
    icon:        List,
    color:       'teal'   as ColorToken,
    description: 'Match column A to column B; manual graded',
    autoGrade:   false,
  },
  essay: {
    label:       'Essay',
    icon:        FileText,
    color:       'violet' as ColorToken,
    description: 'Extended response; rubric + AI assisted',
    autoGrade:   false,
  },
}

// ── Option label generator ─────────────────────────────────────────────────

const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'] as const

export function nextOptionLabel(currentCount: number): string {
  return OPTION_LABELS[currentCount] ?? String(currentCount + 1)
}

// ── Initial expand set ─────────────────────────────────────────────────────

export function buildInitialExpandedSet(): Set<QuestionType> {
  return new Set<QuestionType>(GROUP_ORDER)
}

export { GROUP_ORDER }
