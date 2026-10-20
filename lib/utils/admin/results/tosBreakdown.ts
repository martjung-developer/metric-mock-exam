import { groupQuestionsByArea, normalizeAreaTitle } from '@/lib/utils/admin/submissions/grading'

export interface TosBreakdownQuestion {
  id: string
  question_text: string
  section_title: string | null
  points: number
  correct_answer: string | null
  options: unknown
}

export interface TosBreakdownAnswer {
  question_id: string
  answer_text: string | null
}

export interface TosBreakdownWeight {
  area_title: string
  weight_percent: number
  expected_items: number
  min_percent: number
}

export interface TosAreaBreakdown {
  area_title: string
  total_questions: number
  answered: number
  correct: number
  wrong: number
  unanswered: number
  points_earned: number
  points_possible: number
  percent: number
  weight_percent?: number
  expected_items?: number
  min_percent?: number
  minimum_met?: boolean
  weighted_score?: number
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function normalizedCorrectAnswer(correctAnswer: string | null, rawOptions: unknown): string | null {
  if (!correctAnswer) {return null}
  let options: Array<{ label: string; text: string }> = []
  let parsed = rawOptions
  if (typeof parsed === 'string') {
    try {
      const decoded: unknown = JSON.parse(parsed)
      parsed = decoded
    } catch { parsed = null }
  }
  if (Array.isArray(parsed)) {
    options = parsed.flatMap((option) => {
      if (!isRecord(option)) {return []}
      const item = option
      const label = typeof item.label === 'string' ? item.label : null
      const text = typeof item.text === 'string' ? item.text :
        typeof item.option_text === 'string' ? item.option_text :
          typeof item.value === 'string' ? item.value :
            typeof item.content === 'string' ? item.content : null
      return label && text ? [{ label, text }] : []
    })
  } else if (isRecord(parsed)) {
    const record = parsed
    options = ['A', 'B', 'C', 'D', 'E', 'F'].flatMap((label) => {
      const value = record[label]
      return typeof value === 'string' ? [{ label, text: value }] : []
    })
  }
  const byLabel = options.find((option) => option.label.toLowerCase() === correctAnswer.toLowerCase())
  if (byLabel) {return byLabel.label}
  return options.find((option) => option.text.toLowerCase() === correctAnswer.toLowerCase())?.label ?? correctAnswer
}

export function computeTosBreakdown(
  questions: TosBreakdownQuestion[],
  answers: TosBreakdownAnswer[],
  weights: TosBreakdownWeight[] = [],
): TosAreaBreakdown[] {
  const answerMap = new Map(answers.map((answer) => [answer.question_id, answer.answer_text]))
  const scoreQuestions = questions.map((question) => {
    const answerText = answerMap.get(question.id)
    const correctAnswer = normalizedCorrectAnswer(question.correct_answer, question.options)
    const answered = Boolean(answerText)
    const isCorrect = typeof answerText === 'string' && answered && correctAnswer !== null &&
      answerText.toLowerCase() === correctAnswer.toLowerCase()
    return {
      id: question.id,
    question_text: question.question_text,
    section_title: question.section_title,
    points: question.points,
      points_earned: isCorrect ? question.points : 0,
      answered,
      isCorrect,
    }
  })
  const grouped = groupQuestionsByArea(scoreQuestions)
  const weightMap = new Map(weights.map((weight) => [normalizeAreaTitle(weight.area_title), weight]))
  const titleMap = new Map<string, string>()
  for (const question of questions) {
    const title = question.section_title?.trim().replace(/\s+/g, ' ') || 'Unclassified'
    const key = normalizeAreaTitle(title === 'Unclassified' ? '' : title) || 'unclassified'
    if (!titleMap.has(key)) {titleMap.set(key, title)}
  }
  for (const weight of weights) {
    const key = normalizeAreaTitle(weight.area_title)
    if (key && !titleMap.has(key)) {titleMap.set(key, weight.area_title)}
  }
  const keys = [...new Set([
    ...[...grouped.keys()].map((key) => key || 'unclassified'),
    ...weights.map((weight) => normalizeAreaTitle(weight.area_title)).filter(Boolean),
  ])]
  return keys.map((key) => {
    const members = grouped.get(key === 'unclassified' ? '' : key) ?? []
    let answered = 0
    let correct = 0
    let wrong = 0
    let pointsEarned = 0
    for (const member of members) {
      if (member.answered) {answered += 1}
      if (member.isCorrect) {
        correct += 1
        pointsEarned += member.points
      } else if (member.answered) {
        wrong += 1
      }
    }
    const pointsPossible = members.reduce((sum, question) => sum + question.points, 0)
    const percent = pointsPossible > 0 ? (pointsEarned / pointsPossible) * 100 : 0
    const weight = weightMap.get(key)
    return {
      area_title: titleMap.get(key) ?? 'Unclassified',
      total_questions: members.length,
      answered,
      correct,
      wrong,
      unanswered: members.length - answered,
      points_earned: pointsEarned,
      points_possible: pointsPossible,
      percent,
      ...(weight ? {
        weight_percent: weight.weight_percent,
        expected_items: weight.expected_items,
        min_percent: weight.min_percent,
        minimum_met: percent >= weight.min_percent,
        weighted_score: percent * weight.weight_percent / 100,
      } : {}),
    }
  })
}
