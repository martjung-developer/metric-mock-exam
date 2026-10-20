// lib/utils/admin/submissions/constants.ts
import {
  Clock, CheckCircle, CheckSquare, Send,
  CheckSquare as CheckSquareIcon, ToggleLeft, AlignLeft, Hash, List,
} from 'lucide-react'
import type { ElementType } from 'react'
import type { SubmissionStatus } from '@/lib/types/admin/exams/submissions/submission.types'
import type { QuestionType } from '@/lib/types/database'

// ── Question type helpers ─────────────────────────────────────────────────────
export const AUTO_TYPES:   QuestionType[] = ['multiple_choice', 'true_false', 'fill_blank']
export const MANUAL_TYPES: QuestionType[] = ['short_answer', 'essay', 'matching']

export const PAGE_SIZE = 10

// ── Status display config ─────────────────────────────────────────────────────
export interface StatusConfig {
  label: string
  icon:  ElementType
  color: 'amber' | 'blue' | 'teal' | 'violet' | 'green'
}

export const STATUS_CONFIG: Record<SubmissionStatus, StatusConfig> = {
  in_progress: { label: 'In Progress', icon: Clock,         color: 'amber'  },
  submitted:   { label: 'Submitted',   icon: CheckCircle,   color: 'blue'   },
  graded:      { label: 'Graded',      icon: CheckCircle,   color: 'teal'   },
  reviewed:    { label: 'Reviewed',    icon: CheckSquare,   color: 'violet' },
  released:    { label: 'Released',    icon: Send,          color: 'green'  },
}

export const GRADEABLE_STATUSES: SubmissionStatus[] = ['submitted', 'graded', 'reviewed']

// ── Question type icon map ────────────────────────────────────────────────────
export const TYPE_ICONS: Record<QuestionType, ElementType> = {
  multiple_choice: CheckSquareIcon,
  true_false:      ToggleLeft,
  short_answer:    AlignLeft,
  essay:           AlignLeft,
  matching:        List,
  fill_blank:      Hash,
}

export const RELEASABLE_STATUSES: SubmissionStatus[] = ['reviewed']

// ── Valid submission statuses for safe narrowing ──────────────────────────────
export const VALID_STATUSES: SubmissionStatus[] = [
  'in_progress', 'submitted', 'graded', 'reviewed', 'released',
]