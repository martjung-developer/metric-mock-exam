// lib/constants/admin/questionnaires/questionnaires.constants.ts

import type { QuestionType } from '@/lib/types/database'
import type { DifficultyLevel } from '@/lib/types/admin/questionnaires/questionnaires'

// Question types accepted by the import pipeline
export const VALID_TYPES = [
  'multiple_choice',
  'true_false',
  'short_answer',
  'fill_blank',
  'matching',
  'essay',
] as const satisfies readonly QuestionType[]

// Difficulty levels accepted by the import pipeline
export const VALID_DIFF = [
  'easy',
  'medium',
  'hard',
] as const satisfies readonly DifficultyLevel[]

export const IMAGE_BUCKET = 'questionnaire-assets'   

// Column order for the downloadable CSV template
export const TEMPLATE_HEADERS = [
  'question_text',
  'question_type',
  'points',
  'difficulty',
  'option_a',
  'option_b',
  'option_c',
  'option_d',
  'correct_answer',
  'explanation',
  'scenario',
  'image',
] as const

// Display order for question type sections
export const TYPE_ORDER: QuestionType[] = [
  'multiple_choice',
  'true_false',
  'fill_blank',
  'short_answer',
  'matching',
  'essay',
]

// Rows per page in QuestionTypeSection table
export const PAGE_SIZE = 10

// Colours for question type badges / section headers
export const TYPE_COLORS: Record<QuestionType, { bg: string; color: string; border: string }> = {
  multiple_choice: { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
  true_false:      { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
  short_answer:    { bg: '#fffbeb', color: '#b45309', border: '#fde68a' },
  fill_blank:      { bg: '#fdf4ff', color: '#7e22ce', border: '#e9d5ff' },
  matching:        { bg: '#f0fdfa', color: '#0f766e', border: '#99f6e4' },
  essay:           { bg: '#fff1f2', color: '#be123c', border: '#fecdd3' },
}

export const TYPE_LABELS: Record<QuestionType, string> = {
  multiple_choice: 'Multiple Choice',
  true_false:      'True / False',
  short_answer:    'Short Answer',
  fill_blank:      'Fill in Blank',
  matching:        'Matching',
  essay:           'Essay',
}

// Colours cycled through program cards in the programs grid
export const PROGRAM_COLORS = [
  { accent: '#4f5ff7', bg: 'rgba(79,95,247,0.07)',  border: 'rgba(79,95,247,0.18)'  },
  { accent: '#059669', bg: 'rgba(5,150,105,0.07)',   border: 'rgba(5,150,105,0.18)'  },
  { accent: '#d97706', bg: 'rgba(217,119,6,0.07)',   border: 'rgba(217,119,6,0.18)'  },
  { accent: '#7c3aed', bg: 'rgba(124,58,237,0.07)',  border: 'rgba(124,58,237,0.18)' },
  { accent: '#0891b2', bg: 'rgba(8,145,178,0.07)',   border: 'rgba(8,145,178,0.18)'  },
  { accent: '#be123c', bg: 'rgba(190,18,60,0.07)',   border: 'rgba(190,18,60,0.18)'  },
  { accent: '#0f766e', bg: 'rgba(15,118,110,0.07)',  border: 'rgba(15,118,110,0.18)' },
  { accent: '#9333ea', bg: 'rgba(147,51,234,0.07)',  border: 'rgba(147,51,234,0.18)' },
  { accent: '#1d4ed8', bg: 'rgba(29,78,216,0.07)',   border: 'rgba(29,78,216,0.18)'  },
] as const

export type ProgramColorScheme = typeof PROGRAM_COLORS[number]

export const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = {
  easy:   'Easy',
  medium: 'Medium',
  hard:   'Hard',
}

export const ACCEPTED_FILE_TYPES = '.csv,.xlsx,.xls,.docx,.doc,.pdf'
export const ACCEPTED_IMAGE_TYPES = '.png,.jpg,.jpeg,.webp'