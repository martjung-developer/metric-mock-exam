// lib/utils/student/practice-exams/practiceExam.utils.ts

import type { PracticeQuestion, FeedbackEntry, WeakTopic } from '@/lib/types/student/practice-exams/practice-exam.types'
import { AUTO_GRADE_TYPES } from '@/lib/constants/student/practice-exams/practice-exams'
import type { QuestionOption } from '@/lib/types/admin/exams/questions/questions.types'

// ── Grading ───────────────────────────────────────────────────────────────────

export function gradeAnswer(q: PracticeQuestion, answer: string): boolean | null {
  if (!q.correct_answer) {return null}
  if (AUTO_GRADE_TYPES.has(q.question_type as 'multiple_choice' | 'true_false' | 'fill_blank')) {
    return answer.trim().toLowerCase() === q.correct_answer.trim().toLowerCase()
  }
  return null // manual types: essay, short_answer, matching
}

export function stripDiffTag(raw: string | null): string {
  if (!raw) {return ''}
  return raw.replace(/^\[(easy|medium|hard)\]\s*/i, '')
}

export function parseOptions(raw: unknown): QuestionOption[] | null {  
  if (!Array.isArray(raw)) { return null }
  return raw as QuestionOption[]
}

// ── Score computation ─────────────────────────────────────────────────────────

export function computeScore(
  questions:  PracticeQuestion[],
  answers:    Record<string, string>,
  feedbacks:  Record<string, FeedbackEntry>,
): { score: number; correctCount: number; gradableCount: number } {
  let score        = 0
  let correctCount = 0
  let gradableCount = 0

  for (const q of questions) {
    const fb = feedbacks[q.id]
    if (!fb) {continue}
    if (fb.isCorrect === null) {continue} // manual type — skip
    gradableCount++
    if (fb.isCorrect) {
      score += q.points
      correctCount++
    }
  }

  return { score, correctCount, gradableCount }
}

// ── Weak topics ───────────────────────────────────────────────────────────────

export function computeWeakTopics(
  questions:  PracticeQuestion[],
  feedbacks:  Record<string, FeedbackEntry>,
): WeakTopic[] {
  // questions don't carry category directly, so we bucket by question_type as proxy
  const map: Record<string, { correct: number; total: number }> = {}

  for (const q of questions) {
    const fb = feedbacks[q.id]
    if (!fb?.submitted || fb.isCorrect === null) {continue}
    const key = q.question_type
    if (!map[key]) {map[key] = { correct: 0, total: 0 }}
    map[key].total++
    if (fb.isCorrect) {map[key].correct++}
  }

  return Object.entries(map)
    .map(([category, { correct, total }]) => ({
      category,
      correct,
      total,
      accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
    }))
    .filter(t => t.accuracy < 70) // only surface weak areas
    .sort((a, b) => a.accuracy - b.accuracy)
}

// ── Time formatting ───────────────────────────────────────────────────────────

export function formatSeconds(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m === 0) {return `${s}s`}
  return `${m}m ${s}s`
}