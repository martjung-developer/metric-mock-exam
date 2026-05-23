// lib/utils/admin/exams/detail/mappers.ts
// Pure functions that transform raw Supabase shapes into UI types.
// No Supabase calls, no side effects, fully typed.

import type { ExamType } from '@/lib/types/database'
import type {
  ExamDetailRaw,
  ExamCategoryJoin,
  ExamProgramJoin,
  ExamDetail,
  ExamStats,
  CategoryOption,
  ProgramOption,
} from '@/lib/types/admin/exams/detail/exam.types'

// ── safeExamType ────────────────────────────────────────────────────────────
// Narrows a DB string (which may be null) to the ExamType union.

export function safeExamType(raw: string | null): ExamType {
  if (raw === 'practice') {return 'practice'}
  return 'mock'
}

// ── unwrapCategory ──────────────────────────────────────────────────────────
// Supabase returns joined rows as a single object or array depending on
// cardinality. We handle both shapes without unsafe casting.

export function unwrapCategory(
  raw: ExamCategoryJoin | ExamCategoryJoin[] | null,
): ExamCategoryJoin | null {
  if (!raw) {return null}
  if (Array.isArray(raw)) {return raw[0] ?? null}
  return raw
}

// ── unwrapProgram ───────────────────────────────────────────────────────────

export function unwrapProgram(
  raw: ExamProgramJoin | ExamProgramJoin[] | null,
): ExamProgramJoin | null {
  if (!raw) {return null}
  if (Array.isArray(raw)) {return raw[0] ?? null}
  return raw
}

// ── mapRawToExamDetail ──────────────────────────────────────────────────────
// Combines the raw exam row with computed stats into the UI-level ExamDetail.

export function mapRawToExamDetail(
  raw:   ExamDetailRaw,
  stats: ExamStats,
): ExamDetail {
  const cat  = unwrapCategory(raw.exam_categories)
  const prog = unwrapProgram(raw.programs)

  const category: CategoryOption | null = cat
    ? { id: cat.id, name: cat.name }
    : null

  const program: ProgramOption | null = prog
    ? { id: prog.id, code: prog.code, name: prog.name }
    : null

  return {
    id:               raw.id,
    title:            raw.title,
    description:      raw.description,
    category,
    program,
    exam_type:        safeExamType(raw.exam_type),
    duration_minutes: raw.duration_minutes,
    total_points:     raw.total_points,
    passing_score:    raw.passing_score,
    is_published:     raw.is_published,
    question_count:   stats.question_count,
    assigned_count:   stats.assigned_count,
    submission_count: stats.submission_count,
    avg_score:        stats.avg_score,
    created_at:       raw.created_at,
    updated_at:       raw.updated_at,
    approval_status:  raw.approval_status,
    review_notes:     raw.review_notes,
  }
}

// ── computeAvgScore ─────────────────────────────────────────────────────────
// Computes average score from an array of nullable percentages.

export function computeAvgScore(percentages: (number | null)[]): number | null {
  const valid = percentages.filter((p): p is number => p !== null)
  if (valid.length === 0) {return null}
  return valid.reduce((a, b) => a + b, 0) / valid.length
}

// ── formatDate ──────────────────────────────────────────────────────────────

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-PH', {
    year:  'numeric',
    month: 'short',
    day:   'numeric',
  })
}
