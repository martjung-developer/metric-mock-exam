// lib/services/admin/exams/submissions/submission.service.ts
// ─────────────────────────────────────────────────────────────────────────────
// FIX E: The SELECT in getSubmissionsByExam was missing several columns
// required to populate the Submission display model:
//   - created_at   (needed for ordering / display)
//   - passed       (needed by GradingPanel pass-rate and the table)
// These were actually in the original SELECT; keeping them here for clarity.
//
// FIX E-2: forceSubmitInProgress now uses `satisfies SubmissionUpdate` to
// catch any type errors at the call site rather than casting.
//
// FIX E-3: The assembled SubmissionRaw now uses SubmissionStatus (not string)
// for the status field, which lets coerceStatus() in mappers.ts get strict
// compile-time checking all the way from the DB row to the UI model.
//
// WHY TWO-STEP FETCH (do not simplify):
//   submissions.student_id → students.id → profiles.id
//   A single PostgREST join throws "more than one relationship found for
//   students and id". Fix: flat SELECT + batch lookup + in-memory assemble.
// ─────────────────────────────────────────────────────────────────────────────

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database }       from '@/lib/types/database'
import type {
  ServiceResult,
  SubmissionRaw,
  SubmissionStatus,
} from '@/lib/types/admin/exams/submissions/submission.types'
import type { AnswerRaw }    from '@/lib/types/admin/exams/submissions/answer.types'
import type { AnswerKeyRaw } from '@/lib/utils/admin/submissions/mappers'
import { coerceStatus }      from '@/lib/utils/admin/submissions/mappers'

type DB = SupabaseClient<Database>
type SubmissionUpdate = Database['public']['Tables']['submissions']['Update']
type AnswerUpdate     = Database['public']['Tables']['answers']['Update']

type SubmissionRowLite = Pick<
  Database['public']['Tables']['submissions']['Row'],
  'id' | 'student_id' | 'attempt_no' | 'started_at' | 'submitted_at' | 'time_spent_seconds' |
  'status' | 'score' | 'percentage' | 'passed'
>
type ProfileLite = Pick<Database['public']['Tables']['profiles']['Row'], 'id' | 'full_name' | 'email'>
type StudentLite = Pick<Database['public']['Tables']['students']['Row'], 'id' | 'student_id'>

type ExamAccessLite = {
  allowed_programs: string[] | null
  allowed_year_levels: number[] | null
}
type StudentAccessLite = {
  program_id: string | null
  year_level: number | null
}

function ok<T>(data: T): ServiceResult<T>             { return { data, error: null } }
function err<T = void>(msg: string): ServiceResult<T> { return { data: null, error: msg } }

// ── getSubmissionsByExam ──────────────────────────────────────────────────────

export async function getSubmissionsByExam(
  supabase: DB,
  examId:   string,
): Promise<ServiceResult<SubmissionRaw[]>> {

  // Step 1: flat submissions — no joins.
  // FIX E: Select ALL columns needed by the Submission display model.
  // Previously 'passed' was in SELECT but double-check nothing is missing.
  const { data: subRows, error: subErr } = await supabase
    .from('submissions')
    .select(
      'id, student_id, attempt_no, started_at, submitted_at, time_spent_seconds, ' +
      'status, score, percentage, passed',
    )
    .eq('exam_id', examId)
    .order('started_at', { ascending: false })
    .overrideTypes<SubmissionRowLite[], { merge: false }>()

  if (subErr) {return err(subErr.message)}

  const rows: SubmissionRowLite[] = subRows ?? []
  if (rows.length === 0) {return ok([])}

  // Step 2: batch-fetch profiles + students
  const studentIds = [
    ...new Set(
      rows
        .map(r => r.student_id)
        .filter((id): id is string => id !== null),
    ),
  ]

  const [profilesRes, studentsRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', studentIds)
      .overrideTypes<ProfileLite[], { merge: false }>(),
    supabase
      .from('students')
      .select('id, student_id')
      .in('id', studentIds)
      .overrideTypes<StudentLite[], { merge: false }>(),
  ])

  // Step 3: O(1) lookup maps
  const profileMap = new Map<string, { id: string; full_name: string | null; email: string }>()
  for (const p of profilesRes.data ?? []) {profileMap.set(p.id, p)}

  const studentMap = new Map<string, { id: string; student_id: string | null }>()
  for (const s of studentsRes.data ?? []) {studentMap.set(s.id, s)}

  // Step 4: assemble SubmissionRaw[]
  // FIX E-3: status is coerced to SubmissionStatus here so the assembled
  // shape is typed correctly before reaching mapSubmission().
  const assembled: SubmissionRaw[] = rows.map(row => {
    const profile = row.student_id ? (profileMap.get(row.student_id) ?? null) : null
    const student = row.student_id ? (studentMap.get(row.student_id) ?? null) : null

    return {
      id:                 row.id,
      student_id:         row.student_id,
      attempt_no:         row.attempt_no,
      started_at:         row.started_at,
      submitted_at:       row.submitted_at,
      time_spent_seconds: row.time_spent_seconds,
      // Coerce here so SubmissionRaw.status is always typed SubmissionStatus
      status:             coerceStatus(row.status) as SubmissionStatus,
      score:              row.score,
      percentage:         row.percentage,
      passed:             row.passed,
      students: student
        ? { student_id: student.student_id, profiles: profile }
        : null,
    }
  })

  return ok(assembled)
}

// ── forceSubmitInProgress ─────────────────────────────────────────────────────

export async function forceSubmitInProgress(
  supabase:     DB,
  submissionId: string,
  startedAt:    string,
): Promise<ServiceResult<{ submitted_at: string; time_spent_seconds: number }>> {
  const now       = new Date().toISOString()
  const timeSpent = Math.max(
    0,
    Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000),
  )

  // FIX E-2: `satisfies` catches type errors at compile time.
  // Previously this could silently pass invalid status values because
  // SubmissionUpdate.status used the old 3-value enum.
  const patch = {
    status:             'submitted',
    submitted_at:       now,
    time_spent_seconds: timeSpent,
  } satisfies SubmissionUpdate

  const { error } = await supabase
    .from('submissions')
    .update(patch)
    .eq('id', submissionId)

  if (error) {return err(error.message)}
  return ok({ submitted_at: now, time_spent_seconds: timeSpent })
}

// ── updateSubmission ──────────────────────────────────────────────────────────

export async function updateSubmission(
  supabase: DB,
  id:       string,
  patch:    SubmissionUpdate,
): Promise<ServiceResult<{ id: string }>> {
  const { data, error } = await supabase
    .from('submissions')
    .update(patch)
    .eq('id', id)
    .select('id')
    .single()

  if (error) {return err(error.message)}
  if (!data) {return err('Update succeeded but no row returned — RLS may have blocked it')}
  return ok(data)
}

// ── getSubmissionAnswers ──────────────────────────────────────────────────────

export async function getSubmissionAnswers(
  supabase:     DB,
  submissionId: string,
): Promise<ServiceResult<AnswerRaw[]>> {
  const { data, error } = await supabase
    .from('answers')
    .select(`
      id,
      question_id,
      answer_text,
      is_correct,
      points_earned,
      feedback,
      questions:question_id (
        question_text,
        question_type,
        points,
        options,
        correct_answer,
        explanation,
        order_number
      )
    `)
    .eq('submission_id', submissionId)
    .order('created_at', { ascending: true })

  if (error) {return err(error.message)}
  return ok((data ?? []) as unknown as AnswerRaw[])
}

// ── updateAnswer ──────────────────────────────────────────────────────────────

export async function updateAnswer(
  supabase: DB,
  id:       string,
  patch:    AnswerUpdate,
): Promise<ServiceResult> {
  const { error } = await supabase
    .from('answers')
    .update(patch)
    .eq('id', id)
  return error ? err(error.message) : ok(undefined)
}

// ── getAnswerKey ──────────────────────────────────────────────────────────────

export async function getAnswerKey(
  supabase: DB,
  examId:   string,
): Promise<ServiceResult<AnswerKeyRaw[]>> {
  const { data, error } = await supabase
    .from('questions')
    .select('id, correct_answer, question_text, question_type, order_number')
    .eq('exam_id', examId)
    .order('order_number', { ascending: true, nullsFirst: false })

  if (error) {return err(error.message)}
  return ok((data ?? []) as AnswerKeyRaw[])
}

// ── validateExamAccess ───────────────────────────────────────────────────────

export async function validateExamAccess(
  supabase: DB,
  examId: string,
  studentId: string,
): Promise<ServiceResult<boolean>> {
  // Fetch exam constraints
  const { data: exam, error: examErr } = await supabase
    .from('exams')
    .select('allowed_programs, allowed_year_levels')
    .eq('id', examId)
    .single()
    .overrideTypes<ExamAccessLite, { merge: false }>()

  if (examErr || !exam) {return err(examErr?.message ?? 'Exam not found')}

  // Fetch student info
  const { data: student, error: studentErr } = await supabase
    .from('students')
    .select('program_id, year_level')
    .eq('id', studentId)
    .single()
    .overrideTypes<StudentAccessLite, { merge: false }>()

  if (studentErr || !student) {return err(studentErr?.message ?? 'Student not found')}

  const programAllowed =
    !exam.allowed_programs ||
    exam.allowed_programs.length === 0 ||
    (student.program_id !== null && exam.allowed_programs.includes(student.program_id))

  const yearAllowed =
    !exam.allowed_year_levels ||
    exam.allowed_year_levels.length === 0 ||
    (student.year_level !== null && exam.allowed_year_levels.includes(student.year_level))

  return ok(programAllowed && yearAllowed)
}
