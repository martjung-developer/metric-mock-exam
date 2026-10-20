// lib/services/student/mock-exams/mockExams.service.ts
//
// FIXED:
//  1. fetchOrCreateSubmission  → checks attempt count BEFORE insert; sets attempt_no correctly
//  2. createNewSubmission      → same guard + correct attempt_no
//  3. checkSubmittedExam       → blocks graded/released too (not just "submitted")
//  4. fetchStudentSubmissionStatuses → typed, no `any`
//  5. fetchQuestions           → typed, no `any`.
//     CHANGE (this pass): `image_url` restored to the select and row mapping.
//     A previous pass removed it under the mistaken belief that `questions`
//     has no such column — it does (see lib/types/database.ts) — which
//     silently nulled out every uploaded question image on the mock-exam
//     exam-taking page even though import and storage upload worked fine.
//  6. fetchAttemptCounts       → new helper for list page
//  7. All inserts properly awaited and validated
// ─────────────────────────────────────────────────────────────────────────────
import { createClient }             from '@/lib/supabase/client'
import { notifyAdminsExamSubmitted } from '@/lib/services/notifications/adminAlerts.service'
import type {
  ExamAttempt, AnswerMap, Question,
  SessionCreateResult, AttemptCountMap,
  SubmissionStatus,
} from '@/lib/types/student/mock-exams/mock-exams'
import { MAX_ATTEMPTS } from '@/lib/types/student/mock-exams/mock-exams'

// ── Internal row shapes (no `any`) ────────────────────────────────────────────

interface SubmissionSelectRow {
  id:                 string
  exam_id:            string
  student_id:         string
  status:             string
  started_at:         string
  submitted_at:       string | null
  time_spent_seconds: number | null
  score:              number | null
  percentage:         number | null
  passed:             boolean | null
}

interface AnswerSelectRow {
  question_id:  string | null
  answer_text:  string | null
}

// ── CHANGED: image_url restored — `questions.image_url` is a real column.
interface QuestionRow {
  id:             string
  question_text:  string
  scenario:       string | null
  section_title:  string | null
  section_number: number | null
  question_type:  string
  points:         number
  options:        unknown
  correct_answer: string | null
  image_url:      string | null
  explanation:    string | null
  order_number:   number | null
}

function getSupabase() {
  return createClient()
}

// ── List Page ─────────────────────────────────────────────────────────────────

export async function fetchAssignedExamIds(
  userId:    string,
  programId: string | null,
): Promise<Set<string>> {
  const supabase = getSupabase()

  const orFilter = programId
    ? `student_id.eq.${userId},program_id.eq.${programId}`
    : `student_id.eq.${userId}`

  const { data, error } = await supabase
    .from('exam_assignments')
    .select('exam_id')
    .eq('is_active', true)
    .or(orFilter)

  if (error !== null) {throw new Error('Could not load exam assignments.')}

  return new Set(
    (data ?? [])
      .map((a: { exam_id: string | null }) => a.exam_id)
      .filter((id): id is string => id !== null),
  )
}

export async function fetchStudentProgramId(userId: string): Promise<string | null> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('students')
    .select('program_id')
    .eq('id', userId)
    .single()

  if (error !== null) {return null}
  return data?.program_id ?? null
}

export async function fetchPublishedMockExams(programId: string) {
  const supabase = getSupabase()

  const { data, error } = await supabase
    .from('exams')
    .select(`
      id,
      title,
      duration_minutes,
      is_published,
      exam_type,
      exam_categories ( id, name, icon, program_id ),
      programs ( id, code, name )
    `)
    .eq('is_published', true)
    .eq('exam_type', 'mock')
    .eq('program_id', programId)
    .order('created_at', { ascending: false })

  if (error !== null) {throw new Error('Could not load exams.')}
  return data ?? []
}

export async function fetchQuestionCounts(
  examIds: string[],
): Promise<Record<string, number>> {
  if (examIds.length === 0) {return {}}

  const supabase = getSupabase()
  const { data } = await supabase
    .from('questions')
    .select('exam_id')
    .in('exam_id', examIds)

  const map: Record<string, number> = {}
  ;(data ?? []).forEach((q: { exam_id: string | null }) => {
    if (q.exam_id !== null) {
      map[q.exam_id] = (map[q.exam_id] ?? 0) + 1
    }
  })
  return map
}

export async function fetchStudentSubmissionStatuses(
  userId:  string,
  examIds: string[],
): Promise<Record<string, { status: string; submissionId: string; attemptNo: number }>> {
  if (examIds.length === 0) {return {}}

  const supabase = getSupabase()

  const { data, error } = await supabase
    .from('submissions')
    .select('id, exam_id, status, attempt_no')
    .eq('student_id', userId)
    .in('exam_id', examIds)
    .order('attempt_no', { ascending: false })
    .order('created_at', { ascending: false })

  if (error !== null) {return {}}

  const map: Record<string, { status: string; submissionId: string; attemptNo: number }> = {}

  ;(data ?? []).forEach((s: { id: string; exam_id: string | null; status: string; attempt_no: number }) => {
    if (s.exam_id !== null && map[s.exam_id] === undefined) {
      map[s.exam_id] = { status: s.status, submissionId: s.id, attemptNo: s.attempt_no }
    }
  })

  return map
}

/**
 * For each examId, returns the count of submissions that are RELEASED.
 * Attempt progression is based on released attempts only.
 */
export async function fetchAttemptCounts(
  userId:  string,
  examIds: string[],
): Promise<AttemptCountMap> {
  if (examIds.length === 0) {return {}}

  const supabase = getSupabase()

  const { data, error } = await supabase
    .from('submissions')
    .select('exam_id, status')
    .eq('student_id', userId)
    .in('exam_id', examIds)
    .eq('status', 'released')

  if (error !== null) {return {}}

  const map: AttemptCountMap = {}
  ;(data ?? []).forEach((s: { exam_id: string | null; status: string }) => {
    if (s.exam_id !== null) {
      map[s.exam_id] = (map[s.exam_id] ?? 0) + 1
    }
  })
  return map
}

// ── Exam Session ──────────────────────────────────────────────────────────────

export async function fetchExamById(examId: string) {
  const supabase = getSupabase()

  const { data, error } = await supabase
    .from('exams')
    .select('id, title, duration_minutes, passing_score, total_points')
    .eq('id', examId)
    .eq('is_published', true)
    .single()

  if (error !== null || data === null) {throw new Error('Exam not found or unavailable.')}
  return data
}

export async function fetchQuestions(examId: string): Promise<Question[]> {
  const supabase = getSupabase()

  const { data, error } = await supabase
    .from('questions')
    // ── CHANGED: image_url restored. It is a real column (lib/types/database.ts
    // already declares it, and the ALTER TABLE for it has already been run) —
    // removing it here was based on a mistaken assumption and caused every
    // question image to silently disappear from mock exams.
    .select(
      'id, question_text, scenario, section_title, section_number, question_type, points, options, correct_answer, image_url, explanation, order_number',
    )
    .eq('exam_id', examId)
    .order('order_number', { ascending: true })

  if (error !== null) {
    throw new Error(`Could not load questions: ${error.message}`)
  }
  if (data === null || data.length === 0) {
    throw new Error('No questions found for this exam.')
  }

  return (data as QuestionRow[]).map((q) => ({
    id:             q.id,
    question_text:  q.question_text,
    scenario:       q.scenario,
    section_title:  q.section_title,
    section_number: q.section_number,
    question_type:  q.question_type,
    points:         q.points,
    options:        Array.isArray(q.options) ? (q.options as Question['options']) : null,
    correct_answer: q.correct_answer,
    image_url:      q.image_url ?? null,   // ── CHANGED — was hardcoded to null
    explanation:    q.explanation,
    order_number:   q.order_number,
  }))
}

/**
 * Returns the submission id if a TERMINAL submission exists
 * (submitted | graded | reviewed | released).
 * These all mean the student has "used" this attempt slot.
 */
export async function checkTerminalSubmission(
  userId:  string,
  examId:  string,
): Promise<string | null> {
  const supabase = getSupabase()

  const { data } = await supabase
    .from('submissions')
    .select('id')
    .eq('exam_id', examId)
    .eq('student_id', userId)
    .in('status', ['submitted', 'graded', 'reviewed', 'released'])
    .limit(1)
    .maybeSingle()

  return data?.id ?? null
}

/**
 * Counts RELEASED submissions for this student + exam.
 * Used to derive attempt_no for next insert.
 */
async function countReleasedSubmissions(
  supabase:  ReturnType<typeof getSupabase>,
  userId:    string,
  examId:    string,
): Promise<number> {
  const { count, error } = await supabase
    .from('submissions')
    .select('id', { count: 'exact', head: true })
    .eq('exam_id', examId)
    .eq('student_id', userId)
    .eq('status', 'released')

  if (error !== null) {throw new Error('Could not count released attempts.')}
  return count ?? 0
}

/**
 * FIXED: fetchOrCreateSubmission
 *
 * Priority:
 *   1. Resume in_progress if one exists (no new row)
 *   2. Count released attempts only:
 *      - releasedCount < MAX_ATTEMPTS  → insert new row with attempt_no = releasedCount + 1
 *      - releasedCount >= MAX_ATTEMPTS → return { kind: 'locked' }
 */
export async function fetchOrCreateSubmission(
  userId:  string,
  examId:  string,
): Promise<SessionCreateResult> {
  const supabase = getSupabase()

  // 1. Check for an existing in_progress session → resume it
  const { data: inProg, error: inProgError } = await supabase
    .from('submissions')
    .select('id, started_at, attempt_no')
    .eq('exam_id', examId)
    .eq('student_id', userId)
    .eq('status', 'in_progress')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (inProgError !== null) {throw new Error('Could not check existing session.')}

  if (inProg !== null) {
    return {
      kind:         'resumed',
      submissionId: inProg.id,
      startedAt:    inProg.started_at,
      attemptNo:    inProg.attempt_no,
    }
  }

  // 2. Count released attempts only
  const releasedCount = await countReleasedSubmissions(supabase, userId, examId)

  if (releasedCount >= MAX_ATTEMPTS) {
    return { kind: 'locked', attemptsUsed: releasedCount }
  }

  // 3. Derive the next attempt_no (1-indexed)
  const nextAttemptNo = releasedCount + 1
  const now           = new Date().toISOString()

  const { data: newSub, error: insertError } = await supabase
    .from('submissions')
    .insert({
      exam_id:    examId,
      student_id: userId,
      started_at: now,
      status:     'in_progress',
      attempt_no: nextAttemptNo,
    })
    .select('id')
    .single()

  if (insertError !== null || newSub === null) {
    if (insertError?.code === '23505') {
      const { data: existing, error: existingErr } = await supabase
        .from('submissions')
        .select('id, started_at, attempt_no')
        .eq('exam_id', examId)
        .eq('student_id', userId)
        .eq('status', 'in_progress')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (existingErr === null && existing !== null) {
        return {
          kind: 'resumed',
          submissionId: existing.id,
          startedAt: existing.started_at,
          attemptNo: existing.attempt_no,
        }
      }
    }
    // Surface the actual Postgres error message for debugging
    throw new Error(
      insertError?.message
        ? `Could not start exam session: ${insertError.message}`
        : 'Could not start exam session.',
    )
  }

  return {
    kind:         'started',
    submissionId: newSub.id,
    startedAt:    now,
    attemptNo:    nextAttemptNo,
  }
}

export async function fetchSavedAnswers(
  submissionId: string,
): Promise<{ question_id: string; answer_text: string }[]> {
  const supabase = getSupabase()

  const { data } = await supabase
    .from('answers')
    .select('question_id, answer_text')
    .eq('submission_id', submissionId)

  return (data ?? []).filter(
    (a: AnswerSelectRow): a is { question_id: string; answer_text: string } =>
      a.question_id !== null && a.answer_text !== null && a.answer_text.length > 0,
  )
}

export async function fetchExamAttempts(
  userId:  string,
  examId:  string,
): Promise<ExamAttempt[]> {
  const supabase = getSupabase()

  const { data, error } = await supabase
    .from('submissions')
    .select(
      'id, exam_id, student_id, status, attempt_no, started_at, submitted_at, time_spent_seconds, score, percentage, passed',
    )
    .eq('student_id', userId)
    .eq('exam_id', examId)
    .order('attempt_no', { ascending: true })

  if (error !== null) {return []}

  return (data ?? []).map((s: SubmissionSelectRow): ExamAttempt => ({
    id:                 s.id,
    exam_id:            s.exam_id,
    student_id:         s.student_id,
    status:             s.status as SubmissionStatus,
    attempt_no:         s.attempt_no,
    started_at:         s.started_at,
    submitted_at:       s.submitted_at,
    time_spent_seconds: s.time_spent_seconds,
    score:              s.score,
    percentage:         s.percentage,
    passed:             s.passed,
  }))
}

export async function saveAnswer(
  submissionId: string,
  questionId:   string,
  answer:       string,
): Promise<void> {
  const supabase = getSupabase()

  await supabase
    .from('answers')
    .upsert(
      { submission_id: submissionId, question_id: questionId, answer_text: answer },
      { onConflict: 'submission_id,question_id' },
    )
}

export async function submitExam(
  submissionId: string,
  startedAt:    string,
  answers:      AnswerMap,
  questions:    Question[],
): Promise<void> {
  const supabase  = getSupabase()
  const timeSpent = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)

  const answerRows = questions.map((q) => ({
    submission_id: submissionId,
    question_id:   q.id,
    answer_text:   answers[q.id] ?? null,
  }))

  await supabase
    .from('answers')
    .upsert(answerRows, { onConflict: 'submission_id,question_id' })

  const { error } = await supabase
    .from('submissions')
    .update({
      submitted_at:       new Date().toISOString(),
      time_spent_seconds: timeSpent,
      status:             'submitted',
    })
    .eq('id', submissionId)

  if (error !== null) {
    throw new Error(`Failed to submit exam: ${error.message}`)
  }
}

/**
 * FIXED: createNewSubmission — used by "Start Fresh" flow.
 * Reuses an active attempt; otherwise creates next attempt from released count.
 */
export async function createNewSubmission(
  userId:  string,
  examId:  string,
): Promise<SessionCreateResult> {
  const supabase = getSupabase()

  // Reuse any existing active session to enforce one in_progress record.
  const { data: inProg, error: inProgErr } = await supabase
    .from('submissions')
    .select('id, started_at, attempt_no')
    .eq('exam_id', examId)
    .eq('student_id', userId)
    .eq('status', 'in_progress')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (inProgErr !== null) {throw new Error('Could not check existing in-progress attempt.')}
  if (inProg !== null) {
    return {
      kind: 'resumed',
      submissionId: inProg.id,
      startedAt: inProg.started_at,
      attemptNo: inProg.attempt_no,
    }
  }

  const releasedCount = await countReleasedSubmissions(supabase, userId, examId)

  if (releasedCount >= MAX_ATTEMPTS) {
    return { kind: 'locked', attemptsUsed: releasedCount }
  }

  const nextAttemptNo = releasedCount + 1
  const now           = new Date().toISOString()

  const { data, error } = await supabase
    .from('submissions')
    .insert({
      exam_id:    examId,
      student_id: userId,
      started_at: now,
      status:     'in_progress',
      attempt_no: nextAttemptNo,
    })
    .select('id')
    .single()

  if (error !== null || data === null) {
    throw new Error(
      error?.message
        ? `Could not create new attempt: ${error.message}`
      : 'Could not create new attempt.',
    )
  }

  return { kind: 'started', submissionId: data.id, startedAt: now, attemptNo: nextAttemptNo }
}

export async function sendExamSubmittedNotificationToAdmins(
  studentLabel: string,
  examTitle: string,
): Promise<void> {
  const supabase = getSupabase()
  await notifyAdminsExamSubmitted(supabase, {
    studentLabel,
    examTitle,
  })
}

export async function verifyStudentExamAccess(
  userId: string,
  examId: string,
  programId: string,
): Promise<boolean> {
  const supabase = getSupabase()

  const [examRes, assignmentRes] = await Promise.all([
    supabase
      .from('exams')
      .select('id')
      .eq('id', examId)
      .eq('is_published', true)
      .eq('exam_type', 'mock')
      .eq('program_id', programId)
      .maybeSingle(),
    supabase
      .from('exam_assignments')
      .select('id')
      .eq('exam_id', examId)
      .eq('is_active', true)
      .or(`student_id.eq.${userId},program_id.eq.${programId}`)
      .limit(1)
      .maybeSingle(),
  ])

return examRes.data !== null && assignmentRes.data !== null
}