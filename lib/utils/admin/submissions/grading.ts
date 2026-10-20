// lib/utils/admin/submissions/grading.ts
import type { QuestionType } from '@/lib/types/database'
import type { GradeResult }  from '@/lib/types/admin/exams/submissions/answer.types'
import type {
  TosAreaConfig,
  TosAreaScore,
  TosQuestionScoreInput,
  TosScoreResult,
} from '@/lib/types/admin/exams/exam.types'
import { AUTO_TYPES }        from './constants'

/**
 * Computes is_correct and points_earned for a single answer.
 *
 * Auto-grade types (MCQ, T/F, fill_blank):
 *   - Case-insensitive trim comparison
 *   - Returns boolean is_correct + full or zero points
 *
 * Manual types (essay, short_answer, matching):
 *   - Returns is_correct: null (pending human review)
 *   - Returns points_earned: 0 (updated by grader manually)
 *
 * FUTURE: Pass manual types to a Python AI service for assisted scoring.
 */
export function gradeAnswer(
  answerText:    string | null,
  correctAnswer: string | null,
  questionType:  QuestionType,
  points:        number,
): GradeResult {
  if (!AUTO_TYPES.includes(questionType)) {
    // FUTURE: sendToPythonService(answerText) for essay/short_answer AI grading
    return { is_correct: null, points_earned: 0 }
  }

  if (correctAnswer === null || answerText === null) {
    return { is_correct: false, points_earned: 0 }
  }

  const correct =
    answerText.trim().toLowerCase() === correctAnswer.trim().toLowerCase()

  return { is_correct: correct, points_earned: correct ? points : 0 }
}

/**
 * Computes the total score from an array of point values.
 */
export function sumPoints(pointsEarned: (number | null)[]): number {
  return pointsEarned.reduce<number>((acc, p) => acc + (p ?? 0), 0)
}

/**
 * Derives percentage and pass/fail from earned points.
 */
export function computeScore(
  earned:      number,
  totalPoints: number,
  passingScore: number,
): { percentage: number; passed: boolean } {
  const percentage =
    totalPoints > 0
      ? parseFloat(((earned / totalPoints) * 100).toFixed(2))
      : 0
  return { percentage, passed: percentage >= passingScore }
}

export function normalizeAreaTitle(title: string): string {
  return title.trim().replace(/\s+/g, ' ').toLowerCase()
}

function getQuestionAreaTitle(question: TosQuestionScoreInput): string {
  const sectionTitle = question.section_title?.trim()
  if (sectionTitle) {return sectionTitle}
  return question.section_number !== null && question.section_number !== undefined
    ? `Section ${question.section_number}`
    : ''
}

export function groupQuestionsByArea<T extends TosQuestionScoreInput>(
  questions: T[],
): Map<string, T[]> {
  const grouped = new Map<string, T[]>()
  for (const question of questions) {
    const key = normalizeAreaTitle(getQuestionAreaTitle(question))
    const current = grouped.get(key)
    if (current) {
      current.push(question)
    } else {
      grouped.set(key, [question])
    }
  }
  return grouped
}

export function validateTosConfig(
  areas: TosAreaConfig[],
  questions: TosQuestionScoreInput[],
): string[] {
  const errors: string[] = []
  const areaKeys = new Set<string>()
  const questionGroups = groupQuestionsByArea(questions)
  let totalWeight = 0

  for (const area of areas) {
    const key = normalizeAreaTitle(area.area_title)
    if (!key) {
      errors.push('Every TOS area must have a title.')
      continue
    }
    if (areaKeys.has(key)) {
      errors.push(`Duplicate TOS area title: ${area.area_title.trim()}.`)
    }
    areaKeys.add(key)

    if (!Number.isFinite(area.weight_percent) || area.weight_percent < 0 || area.weight_percent > 100) {
      errors.push(`Area "${area.area_title}" must have a weight from 0 to 100.`)
    }
    totalWeight += area.weight_percent

    if (!Number.isInteger(area.expected_items) || area.expected_items < 0) {
      errors.push(`Area "${area.area_title}" must have a non-negative whole expected item count.`)
    }
    if (!Number.isFinite(area.min_percent) || area.min_percent < 0 || area.min_percent > 100) {
      errors.push(`Area "${area.area_title}" must have a minimum percentage from 0 to 100.`)
    }

    const members = questionGroups.get(key) ?? []
    if (members.length === 0) {
      errors.push(`Area "${area.area_title}" has no questions.`)
    } else if (members.reduce((sum, question) => sum + question.points, 0) <= 0) {
      errors.push(`Area "${area.area_title}" has no positive possible points.`)
    }
  }

  if (Math.abs(totalWeight - 100) > 0.005) {
    errors.push(`TOS area weights must sum to 100 (currently ${totalWeight}).`)
  }

  for (const [key] of questionGroups) {
    if (!key || !areaKeys.has(key)) {
      errors.push(key
        ? `Question area "${key}" does not match a configured TOS area.`
        : 'A question has no section title or section number mapped to a TOS area.')
    }
  }

  return errors
}

export function computeTosScore(
  questions: TosQuestionScoreInput[],
  areas: TosAreaConfig[] | undefined,
  totalPoints: number,
  passingScore: number,
): TosScoreResult {
  const score = sumPoints(questions.map((question) => question.points_earned))

  if (!areas || areas.length === 0) {
    const legacy = computeScore(score, totalPoints, passingScore)
    return {
      score,
      per_area: [],
      weighted_percentage: legacy.percentage,
      passed: legacy.passed,
      validation_errors: [],
    }
  }

  const validationErrors = validateTosConfig(areas, questions)
  if (validationErrors.length > 0) {
    return {
      score,
      per_area: [],
      weighted_percentage: null,
      passed: null,
      validation_errors: validationErrors,
    }
  }

  const questionGroups = groupQuestionsByArea(questions)
  const perArea: TosAreaScore[] = areas.map((area) => {
    const key = normalizeAreaTitle(area.area_title)
    const members = questionGroups.get(key) ?? []
    const pointsPossible = members.reduce((sum, question) => sum + question.points, 0)
    const pointsEarned = members.reduce((sum, question) => sum + (question.points_earned ?? 0), 0)
    const rawPercentage = (pointsEarned / pointsPossible) * 100
    const percentage = parseFloat(rawPercentage.toFixed(2))
    const weightedPercentage = rawPercentage * area.weight_percent / 100
    return {
      area_title: area.area_title,
      weight_percent: area.weight_percent,
      min_percent: area.min_percent,
      points_earned: pointsEarned,
      points_possible: pointsPossible,
      percentage,
      weighted_percentage: weightedPercentage,
      passed: percentage >= area.min_percent,
    }
  })
  const weightedPercentage = parseFloat(
    perArea.reduce((sum, area) => sum + area.weighted_percentage, 0).toFixed(2),
  )

  return {
    score,
    per_area: perArea,
    weighted_percentage: weightedPercentage,
    passed: weightedPercentage >= passingScore && perArea.every((area) => area.passed),
    validation_errors: [],
  }
}
