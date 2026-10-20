/* scripts/stress-test-exam-attempts.ts

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'
 
// ── Config ─────────────────────────────────────────────────────────────────
 
const SUPABASE_URL        = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY   = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const TEST_EMAIL          = process.env.STRESS_TEST_EMAIL!   // a real test account
const TEST_PASSWORD       = process.env.STRESS_TEST_PASSWORD!
const TARGET_EXAM_ID      = process.env.STRESS_TEST_EXAM_ID!
 
const TOTAL_ATTEMPTS      = 100   // how many submissions to create
const CONCURRENCY         = 5     // max in-flight requests at once
const DELAY_BETWEEN_MS    = 200   // ms pause between each batch
 
// ── Types ──────────────────────────────────────────────────────────────────
 
interface AttemptResult {
  index:        number
  success:      boolean
  submissionId: string | null
  error:        string | null
  durationMs:   number
}
 
// ── Utilities ──────────────────────────────────────────────────────────────

 
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

interface Submission {
  id: string
  exam_id: string
  student_id: string
  status: string
  started_at: string
}

interface Question {
  id: string
  question_type: string
  correct_answer: string | null
  points: number
}

interface Answer {
  submission_id: string
  question_id: string
  answer_text: string
  is_correct: boolean | null
  points_earned: number | null
}
 
async function runWithConcurrency<T>(
  tasks:   (() => Promise<T>)[],
  limit:   number,
  delayMs: number,
): Promise<T[]> {
  const results: T[] = []
  let index = 0
 
  async function worker() {
    while (index < tasks.length) {
      const i    = index++
      const task = tasks[i]
      results[i] = await task()
      if (delayMs > 0) await sleep(delayMs)
    }
  }
 
  // Spawn `limit` workers; they each pull from the shared queue
  const workers = Array.from({ length: limit }, () => worker())
  await Promise.all(workers)
  return results
}
 
// ── Simulate one exam attempt ──────────────────────────────────────────────
 
async function simulateAttempt(
  supabase:  ReturnType<typeof createClient>,
  studentId: string,
  examId:    string,
  index:     number,
): Promise<AttemptResult> {
  const start = Date.now()
 
  try {
    // ── 1. Create submission ───────────────────────────────────────────
    const { data: submission, error: subErr } = await supabase
      .from('submissions')
      .insert({
        exam_id:    examId,
        student_id: studentId,
        status:     'in_progress',
        started_at: new Date().toISOString(),
      } as Record<string, unknown>)
      .select('id')
      .single() as { data: { id: string } | null; error: any }
 
    if (subErr || !submission) {
      return {
        index,
        success:      false,
        submissionId: null,
        error:        subErr?.message ?? 'Failed to create submission',
        durationMs:   Date.now() - start,
      }
    }
 
    const submissionId = submission.id
 
    // ── 2. Fetch exam questions ────────────────────────────────────────
    const { data: questions, error: qErr } = await supabase
      .from('questions')
      .select('id, question_type, correct_answer, points')
      .eq('exam_id', examId) as { data: Question[] | null; error: any }
 
    if (qErr || !questions?.length) {
      return {
        index,
        success:      false,
        submissionId,
        error:        qErr?.message ?? 'No questions found for exam',
        durationMs:   Date.now() - start,
      }
    }
 
    // ── 3. Build simulated answers ─────────────────────────────────────
    // For stress-testing purposes we answer ~70% of questions correctly.
    const answers = questions.map(q => {
      const answerCorrectly = Math.random() < 0.7
      let answerText: string
 
      switch (q.question_type) {
        case 'multiple_choice':
          answerText = answerCorrectly
            ? (q.correct_answer ?? 'A')
            : ['A', 'B', 'C', 'D'].filter(l => l !== q.correct_answer)[0] ?? 'A'
          break
        case 'true_false':
          answerText = answerCorrectly
            ? (q.correct_answer ?? 'true')
            : q.correct_answer === 'true' ? 'false' : 'true'
          break
        default:
          answerText = answerCorrectly
            ? (q.correct_answer ?? 'Sample answer text')
            : 'I am not sure about this one.'
      }
 
      const isAutoGraded = ['multiple_choice', 'true_false', 'fill_blank'].includes(q.question_type)
      const isCorrect    = isAutoGraded ? answerText === q.correct_answer : null
      const pointsEarned = isCorrect ? (q.points ?? 1) : 0
 
      return {
        submission_id: submissionId,
        question_id:   q.id,
        answer_text:   answerText,
        is_correct:    isCorrect,
        points_earned: isAutoGraded ? pointsEarned : null,
      }
    })
 
    // ── 4. Insert answers (batch insert — one DB round-trip) ──────────
    const { error: ansErr } = await supabase
      .from('answers')
      .insert(answers as Record<string, unknown>[])
 
    if (ansErr) {
      return {
        index,
        success:      false,
        submissionId,
        error:        `Failed to insert answers: ${ansErr.message}`,
        durationMs:   Date.now() - start,
      }
    }
 
    // ── 5. Calculate score ─────────────────────────────────────────────
    const totalPoints = questions.reduce((sum, q) => sum + (q.points ?? 1), 0)
    const earnedPoints = answers
      .filter(a => a.is_correct === true)
      .reduce((sum, a) => sum + (a.points_earned ?? 0), 0)
 
    const percentage = totalPoints > 0
      ? Math.round((earnedPoints / totalPoints) * 100)
      : 0
 
    // ── 6. Finalise submission ─────────────────────────────────────────
    const { error: finalErr } = await supabase
      .from('submissions')
      .update({
        status:             'submitted',
        submitted_at:       new Date().toISOString(),
        score:              earnedPoints,
        percentage,
        passed:             percentage >= 75, 
        time_spent_seconds: Math.floor((Date.now() - start) / 1000),
      } as Record<string, unknown>)
      .eq('id', submissionId)
 
    if (finalErr) {
      return {
        index,
        success:      false,
        submissionId,
        error:        `Failed to finalize submission: ${finalErr.message}`,
        durationMs:   Date.now() - start,
      }
    }
 
    return {
      index,
      success:      true,
      submissionId,
      error:        null,
      durationMs:   Date.now() - start,
    }
 
  } catch (err) {
    return {
      index,
      success:      false,
      submissionId: null,
      error:        err instanceof Error ? err.message : String(err),
      durationMs:   Date.now() - start,
    }
  }
}
 
// ── Main ───────────────────────────────────────────────────────────────────
 
async function main() {
  console.log('─────────────────────────────────────────')
  console.log('  Exam Submission Stress Test')
  console.log(`  Attempts   : ${TOTAL_ATTEMPTS}`)
  console.log(`  Concurrency: ${CONCURRENCY}`)
  console.log(`  Delay/batch: ${DELAY_BETWEEN_MS}ms`)
  console.log('─────────────────────────────────────────')
 
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
 
  // ── STEP 1: Auth — called ONCE, result reused everywhere ──────────────
  console.log('\n[1/3] Authenticating…')
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email:    TEST_EMAIL,
    password: TEST_PASSWORD,
  })
 
  if (authErr || !authData.user) {
    console.error('Auth failed:', authErr?.message)
    process.exit(1)
  }
 
  const studentId = authData.user.id
  console.log(`      ✓ Signed in as ${studentId}`)
 
  // ── STEP 2: Validate exam exists ─────────────────────────────────────
  console.log('\n[2/3] Validating exam…')
  const { data: exam, error: examErr } = await supabase
    .from('exams')
    .select('id, title, total_points')
    .eq('id', TARGET_EXAM_ID)
    .single()
 
  if (examErr || !exam) {
    console.error('Exam not found:', examErr?.message)
    process.exit(1)
  }
  console.log(`      ✓ Exam: "${exam.title}"`)
 
  // ── STEP 3: Run attempts ─────────────────────────────────────────────
  console.log(`\n[3/3] Running ${TOTAL_ATTEMPTS} attempts…\n`)
  const startAll = Date.now()
 
  const tasks = Array.from({ length: TOTAL_ATTEMPTS }, (_, i) => {
    const client = supabase as unknown as ReturnType<typeof createClient>
    return () => simulateAttempt(client, studentId, TARGET_EXAM_ID, i + 1)
  })
 
  const results = await runWithConcurrency(tasks, CONCURRENCY, DELAY_BETWEEN_MS)
 
  const elapsed     = ((Date.now() - startAll) / 1000).toFixed(1)
  const succeeded   = results.filter(r => r.success).length
  const failed      = results.filter(r => !r.success).length
  const avgMs       = Math.round(results.reduce((s, r) => s + r.durationMs, 0) / results.length)
  const errors      = results.filter(r => r.error).map(r => `  #${r.index}: ${r.error}`)
 
  // ── Results summary ───────────────────────────────────────────────────
  console.log('─────────────────────────────────────────')
  console.log('  RESULTS')
  console.log('─────────────────────────────────────────')
  console.log(`  Total    : ${TOTAL_ATTEMPTS}`)
  console.log(`  Succeeded: ${succeeded} ✓`)
  console.log(`  Failed   : ${failed} ✗`)
  console.log(`  Elapsed  : ${elapsed}s`)
  console.log(`  Avg/req  : ${avgMs}ms`)
 
  if (errors.length > 0) {
    console.log('\n  ERRORS:')
    errors.slice(0, 20).forEach(e => console.log(e))
    if (errors.length > 20) console.log(`  … and ${errors.length - 20} more`)
  }
 
  console.log('─────────────────────────────────────────\n')
 
  // ── Sign out cleanly ──────────────────────────────────────────────────
  await supabase.auth.signOut()
  console.log('Signed out. Done.')
}
 
main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})

*/