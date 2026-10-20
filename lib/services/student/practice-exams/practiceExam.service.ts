// lib/services/student/practice-exams/practiceExam.service.ts

import { createClient }          from '@/lib/supabase/client'
import type {
  PracticeQuestion,
  PracticeAttemptSummary,
  ExamMeta,
  Question,
  Submission,
  Answer,
}                                from '@/lib/types/student/practice-exams/practice-exam.types'
import type { QuestionType }     from '@/lib/types/database'
import { parseOptions }          from '@/lib/utils/student/practice-exams/practiceExam.utils'
import { PRACTICE_STATUS }       from '@/lib/constants/student/practice-exams/practice-exams'

const supabase = createClient()

// ── Exam + questions ──────────────────────────────────────────────────────────

export async function fetchPracticeExamMeta(
  examId: string,
  userId: string,
  programId: string,
  signal: AbortSignal,
): Promise<{ exam: ExamMeta | null; error: string | null }> {
  const [examRes, assignmentRes] = await Promise.all([
    supabase
      .from('exams')
      .select('id, title, total_points, duration_minutes, exam_type, is_published')
      .eq('id', examId)
      .eq('is_published', true)
      .eq('exam_type', 'practice')
      .eq('program_id', programId)
      .single()
      .abortSignal(signal),
    supabase
      .from('exam_assignments')
      .select('id')
      .eq('exam_id', examId)
      .eq('is_active', true)
      .or(`student_id.eq.${userId},program_id.eq.${programId}`)
      .limit(1)
      .maybeSingle()
      .abortSignal(signal),
  ])

  if (examRes.error || !examRes.data) {return { exam: null, error: 'Reviewer not found or unavailable.' }}
  if (!assignmentRes.data) {return { exam: null, error: 'This reviewer is not assigned to your program.' }}
  return { exam: examRes.data as ExamMeta, error: null }
}

export async function fetchPracticeQuestions(
  examId: string,
  signal: AbortSignal,
): Promise<{ questions: PracticeQuestion[]; error: string | null }> {
  const { data, error } = await supabase
    .from('questions')
    // ── CHANGED: added image_url — this column already existed and was
    // already being populated on import/create, but was never selected
    // here, so reviewers silently dropped every question's image.
    .select('id, question_text, scenario, section_title, section_number, question_type, points, options, correct_answer, explanation, image_url, order_number')
    .eq('exam_id', examId)
    .order('order_number', { ascending: true, nullsFirst: false })
    .abortSignal(signal)

  if (error || !data?.length) {return { questions: [], error: 'No questions found for this reviewer.' }}

  const questions: PracticeQuestion[] = (data as Question[]).map(q => ({
    id:             q.id,
    question_text:  q.question_text,
    scenario:       q.scenario ?? null,
    section_title:  q.section_title ?? null,
    section_number: q.section_number ?? null,
    question_type:  q.question_type as QuestionType,
    points:         q.points,
    options:        parseOptions(q.options),
    correct_answer: q.correct_answer,
    explanation:    q.explanation,
    image_url:      q.image_url ?? null,   // ── ADDED
    order_number:   q.order_number,
  }))

  return { questions, error: null }
}

// ── Attempt management ────────────────────────────────────────────────────────

/** Returns all past attempts for this student+exam, newest first. */
export async function fetchPastAttempts(
  examId:    string,
  studentId: string,
  signal:    AbortSignal,
): Promise<PracticeAttemptSummary[]> {
  const { data } = await supabase
    .from('submissions')
    .select('id, score, percentage, passed, started_at, submitted_at, status')
    .eq('exam_id', examId)
    .eq('student_id', studentId)
    .order('started_at', { ascending: false })
    .abortSignal(signal)

  if (!data) {return []}

  return (data as Submission[]).map((row, idx) => ({
    id:           row.id,
    attempt_num:  data.length - idx,
    score:        row.score,
    percentage:   row.percentage,
    passed:       row.passed,
    started_at:   row.started_at,
    submitted_at: row.submitted_at,
    // Cast is safe — DB constraint guarantees valid SubmissionStatus values
    status:       row.status as PracticeAttemptSummary['status'],
  }))
}

/** Creates a new submission row and returns its id. */
export async function createAttempt(
  examId:    string,
  studentId: string,
): Promise<{ submissionId: string | null; error: string | null }> {
  const { data, error } = await supabase
    .from('submissions')
    .insert({
      exam_id:    examId,
      student_id: studentId,
      status:     PRACTICE_STATUS.IN_PROGRESS,
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error || !data) {return { submissionId: null, error: 'Could not start attempt.' }}
  return { submissionId: (data as Pick<Submission, 'id'>).id, error: null }
}

/** Upserts a single answer row (auto-save). */
export async function saveAnswer(
  submissionId: string,
  questionId:   string,
  answerText:   string,
  isCorrect:    boolean | null,
  pointsEarned: number,
): Promise<void> {
  await supabase
    .from('answers')
    .upsert(
      {
        submission_id: submissionId,
        question_id:   questionId,
        answer_text:   answerText,
        is_correct:    isCorrect,
        points_earned: pointsEarned,
      },
      { onConflict: 'submission_id,question_id' },
    )
}

/**
 * Marks the attempt as "submitted" and writes the final score.
 * Using "submitted" keeps the row visible in the admin submissions page
 * which queries .in("status", ["submitted","graded","released"]).
 */
export async function completeAttempt(
  submissionId: string,
  score:        number,
  percentage:   number,
  passed:       boolean,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('submissions')
    .update({
      status:       PRACTICE_STATUS.SUBMITTED,
      submitted_at: new Date().toISOString(),
      score,
      percentage,
      passed,
    })
    .eq('id', submissionId)

  if (error) {return { error: 'Could not save final result.' }}
  return { error: null }
}

/** Loads saved answers for an in-progress attempt (resume). */
export async function fetchSavedAnswers(
  submissionId: string,
  signal:       AbortSignal,
): Promise<Record<string, string>> {
  const { data } = await supabase
    .from('answers')
    .select('question_id, answer_text')
    .eq('submission_id', submissionId)
    .abortSignal(signal)

  const map: Record<string, string> = {}
  for (const row of (data ?? []) as Answer[]) {
    if (row.question_id && row.answer_text !== null) {
      map[row.question_id] = row.answer_text
    }
  }
  return map
}