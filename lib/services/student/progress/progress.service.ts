// lib/services/student/progress/progress.service.ts
//
// All Supabase data access for the student Progress feature.
// No React, no hooks, no UI logic.
// Returns typed domain objects or throws a plain Error.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database }       from '@/lib/types/database'
import type {
  RawSubmission,
  RawExam,
  RawCategory,
  ProgressServiceData,
  ProgressSubmissionStatus,
} from '@/lib/types/student/progress/progress.types'

type SupabaseDB = SupabaseClient<Database>

const PROGRESS_STATUSES: ProgressSubmissionStatus[] = [
  'in_progress', 'submitted', 'graded', 'released',
]

// ── Student record guard ──────────────────────────────────────────────────────

/**
 * Verifies the student record exists for the given userId.
 * Throws if not found — caller should surface this as an error.
 */
export async function verifyStudentRecord(
  supabase:  SupabaseDB,
  studentId: string,
): Promise<void> {
  const { data, error } = await supabase
    .from('students')
    .select('id')
    .eq('id', studentId)
    .single()

  if (error || !data) {
    throw new Error('Student record not found.')
  }
}

// ── Submissions ───────────────────────────────────────────────────────────────

/**
 * Fetches all submissions for the student across all statuses.
 * Score data is only exposed to the UI for 'released' rows — that filtering
 * is enforced in the metrics computation layer, not here.
 */
export async function fetchSubmissions(
  supabase:  SupabaseDB,
  studentId: string,
): Promise<RawSubmission[]> {
  const { data, error } = await supabase
    .from('submissions')
    .select('id, exam_id, submitted_at, time_spent_seconds, status, percentage, passed, created_at')
    .eq('student_id', studentId)
    .in('status', PROGRESS_STATUSES)
    .order('submitted_at', { ascending: false })

  if (error) {throw new Error('Could not load submissions.')}

  return (data ?? []) as RawSubmission[]
}

// ── Exam + category metadata ──────────────────────────────────────────────────

/**
 * Given a list of exam IDs, fetches the exam titles + category_ids,
 * then fetches the category names for those category IDs.
 *
 * Returns empty arrays when examIds is empty — avoids an unnecessary query.
 */
export async function fetchExamMetadata(
  supabase: SupabaseDB,
  examIds:  string[],
): Promise<{ exams: RawExam[]; categories: RawCategory[] }> {
  if (examIds.length === 0) {return { exams: [], categories: [] }}

  const { data: examData, error: examErr } = await supabase
    .from('exams')
    .select('id, title, category_id')
    .in('id', examIds)

  if (examErr) {throw new Error(examErr.message)}

  const exams = (examData ?? []) as RawExam[]

  const catIds = [
    ...new Set(
      exams
        .map((e) => e.category_id)
        .filter((id): id is string => id !== null),
    ),
  ]

  if (catIds.length === 0) {return { exams, categories: [] }}

  const { data: catData, error: catErr } = await supabase
    .from('exam_categories')
    .select('id, name')
    .in('id', catIds)

  if (catErr) {throw new Error(catErr.message)}

  return { exams, categories: (catData ?? []) as RawCategory[] }
}

// ── Orchestrated fetch ────────────────────────────────────────────────────────

/**
 * Fetches all data needed to build ProgressMetrics for a student.
 * Calls verifyStudentRecord, fetchSubmissions, and fetchExamMetadata in sequence.
 *
 * Returns ProgressServiceData — a typed bag of raw rows the hook computes from.
 */
export async function fetchProgressData(
  supabase:  SupabaseDB,
  studentId: string,
): Promise<ProgressServiceData> {
  await verifyStudentRecord(supabase, studentId)

  const submissions = await fetchSubmissions(supabase, studentId)

  if (submissions.length === 0) {
    return { submissions: [], exams: [], categories: [] }
  }

  const examIds = [
    ...new Set(
      submissions
        .map((s) => s.exam_id)
        .filter((id): id is string => id !== null),
    ),
  ]

  const { exams, categories } = await fetchExamMetadata(supabase, examIds)

  return { submissions, exams, categories }
}