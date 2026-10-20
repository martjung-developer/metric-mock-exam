// lib/types/admin/questionnaires/questionnaires.ts

import type { Database, QuestionType, QuestionOption } from '@/lib/types/database'
import type { ApprovalStatus } from '../../approval'

// ── Raw DB row types ────────────────────────────────────────
export type ProgramRow  = Database['public']['Tables']['programs']['Row']
export type ExamRow     = Database['public']['Tables']['exams']['Row']
export type QuestionRow = Database['public']['Tables']['questions']['Row']

// ── Narrow picks used across the feature ──────────────────────────────────────
export type ProgramOption = Pick<ProgramRow, 'id' | 'code' | 'name'>
export interface ExamOption {
  id:         string
  title:      string
  program_id: string
}

// ── Parsed question shape ─────────────────
export interface QuestionInsertPayload {
  question_text:  string
  question_type:  QuestionType
  points:         number
  options:        QuestionOption[] | null
  correct_answer: string | null
  explanation:    string | null
  exam_id:        string | null
  scenario:       string | null
  image_url:      string | null      
  section_title?: string | null
  section_number?: number | null
  approval_status?: ApprovalStatus
  submitted_by?:    string | null
  question_bank_id?: string | null
  created_by?: string | null
}

export interface ParsedQuestion {
  question:       string
  scenario:       string | undefined
  options:        string[]
  correct_answer: string | null
}

// ── Joined shape returned by fetchQuestions ────────────────────────────────────
export interface DisplayQuestion {
  id:             string
  question_text:  string
  question_type:  QuestionType
  points:         number
  options:        QuestionOption[] | null
  correct_answer: string | null
  explanation:    string | null
  scenario:       string | null
  image_url:      string | null      // ── ADDED
  section_title:  string | null
  section_number: number | null
  order_number:   number | null
  exam_id:        string | null
  created_by:     string | null
  created_at:     string
  last_modified_by: string | null
  last_modified_at: string | null
  lastModifiedByName: string | null
  categoryName:   string
  examTitle:      string | null
  examProgramId:  string | null
  difficulty:     DifficultyLevel
  approval_status: ApprovalStatus
  submitted_by:    string | null
  submitted_at:    string | null
  approved_by:     string | null
  approved_at:     string | null
  review_notes:    string | null
  question_bank_id: string | null
}

// ── App-level types ────────────────────────────────────────────────────────────
export type DifficultyLevel = 'easy' | 'medium' | 'hard'
export type ViewMode        = 'programs' | 'program-detail'
export type ImportTab       = 'file' | 'link'
export type LinkSource      = 'google_forms' | 'google_drive' | 'custom_url'

export interface FormState {
  question_text:  string
  question_type:  QuestionType
  points:         number
  correct_answer: string
  explanation:    string
  exam_id:        string
  difficulty:     DifficultyLevel
  choices: Array<{ label: string; text: string }>
  program_id:     string
  scenario:       string
  image_url:      string             // ── ADDED — '' = no image
}

export interface ImportRow {
  _rowIndex:      number
  _valid:         boolean
  _errors:        string[]

  question_text:  string
  question_type:  QuestionType
  correct_answer: string

  option_a:       string
  option_b:       string
  option_c:       string
  option_d:       string

  explanation:    string
  scenario:       string
  image:          string             // ── ADDED — CSV column name is 'image'
  embeddedImage?: EmbeddedImageData
  section_title?: string
  section_number?: number | null
  status?:        'ready' | 'needs_review'

  difficulty:     DifficultyLevel
  points:         number
  exam_id:        string
  program_id:     string
}

export interface EmbeddedImageData {
  fileName: string
  dataUrl:  string
}

// Raw row shape coming out of every file parser
export type RawRow = Record<string, string>

export interface LinkDetectResult {
  source: LinkSource
  valid:  boolean
  hint:   string
}
