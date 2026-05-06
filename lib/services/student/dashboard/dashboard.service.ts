// lib/services/student/dashboard/dashboard.service.ts

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database }       from '@/lib/types/database'
import type {
  SubmissionRow,
  ExamRow,
  AssignmentRow,
} from '@/lib/types/student/dashboard/dashboard.types'

type DB = SupabaseClient<Database>

// ── Internal Supabase row shapes ──────────────────────────────────────────────
// These match exactly what .select() returns so TypeScript can narrow safely.

interface RawSubmissionRow {
  id:           string
  exam_id:      string | null
  status:       string
  percentage:   number | null
  passed:       boolean | null
  submitted_at: string | null
  attempt_no:   number
}

interface RawExamRow {
  id:        string
  title:     string
  exam_type: string
}

interface RawAssignmentRow {
  id:          string
  exam_id:     string
  is_active:   boolean
  deadline:    string | null
  assigned_at: string
}

// ── Status guard for narrowing ────────────────────────────────────────────────

import { isDashboardStatus } from '@/lib/utils/student/dashboard/dashboard.mapper'

// ── fetchDashboardSubmissions ─────────────────────────────────────────────────

/**
 * Fetches all terminal submissions for the student, ordered newest first.
 * Includes submitted / graded / reviewed / released — all post-completion states.
 * Excludes in_progress (not yet finalised).
 */
export async function fetchDashboardSubmissions(
  supabase:  DB,
  studentId: string,
): Promise<SubmissionRow[]> {
  const { data, error } = await supabase
    .from('submissions')
    .select('id, exam_id, status, percentage, passed, submitted_at, attempt_no')
    .eq('student_id', studentId)
    .in('status', ['submitted', 'graded', 'reviewed', 'released'])
    .order('submitted_at', { ascending: false })

  if (error !== null) {
    console.error('[dashboard] fetchDashboardSubmissions:', error.message)
    return []
  }

  const rows = (data ?? []) as RawSubmissionRow[]

  const filtered = rows.filter(
    (r: RawSubmissionRow): r is RawSubmissionRow & { status: SubmissionRow['status'] } =>
      isDashboardStatus(r.status),
  )

  return filtered.map((r): SubmissionRow => ({
    id:           r.id,
    exam_id:      r.exam_id,
    status:       r.status,
    percentage:   r.percentage,
    passed:       r.passed,
    submitted_at: r.submitted_at,
    attempt_no:   r.attempt_no,
  }))
}

// ── fetchExamsByIds ───────────────────────────────────────────────────────────

/**
 * Batch-fetches exam metadata (title + type) for a list of exam IDs.
 */
export async function fetchExamsByIds(
  supabase: DB,
  examIds:  string[],
): Promise<ExamRow[]> {
  if (examIds.length === 0) {return []}

  const { data, error } = await supabase
    .from('exams')
    .select('id, title, exam_type')
    .in('id', examIds)

  if (error !== null) {
    console.error('[dashboard] fetchExamsByIds:', error.message)
    return []
  }

  const rows = (data ?? []) as RawExamRow[]

  return rows
    .filter(
      (e: RawExamRow): e is RawExamRow & { exam_type: 'mock' | 'practice' } =>
        e.exam_type === 'mock' || e.exam_type === 'practice',
    )
    .map((e): ExamRow => ({
      id:        e.id,
      title:     e.title,
      exam_type: e.exam_type,
    }))
}

// ── fetchActiveAssignments ────────────────────────────────────────────────────

/**
 * Returns active exam assignments for the student (individual + program-level).
 * FIX: uses the same `or` filter logic as the mock-exams hook.
 */
export async function fetchActiveAssignments(
  supabase:  DB,
  studentId: string,
  programId: string | null,
): Promise<AssignmentRow[]> {
  const orFilter = programId
    ? `student_id.eq.${studentId},program_id.eq.${programId}`
    : `student_id.eq.${studentId}`

  const { data, error } = await supabase
    .from('exam_assignments')
    .select('id, exam_id, is_active, deadline, assigned_at')
    .eq('is_active', true)
    .or(orFilter)
    .order('assigned_at', { ascending: false })

  if (error !== null) {
    console.error('[dashboard] fetchActiveAssignments:', error.message)
    return []
  }

  return (data ?? []).map((a: RawAssignmentRow): AssignmentRow => ({
    id:          a.id,
    exam_id:     a.exam_id,
    is_active:   a.is_active,
    deadline:    a.deadline,
    assigned_at: a.assigned_at,
  }))
}

// ── fetchStudentProgramId ─────────────────────────────────────────────────────

/**
 * Returns the student's program_id, or null if unavailable.
 */
export async function fetchStudentProgramId(
  supabase:  DB,
  studentId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from('students')
    .select('program_id')
    .eq('id', studentId)
    .single()

  const row = data as { program_id: string | null } | null

  return row?.program_id ?? null
}