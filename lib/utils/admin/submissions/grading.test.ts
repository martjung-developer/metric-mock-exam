import {
  computeScore,
  computeTosScore,
  validateTosConfig,
} from './grading'
import type { TosAreaConfig, TosQuestionScoreInput } from '@/lib/types/admin/exams/exam.types'

type TestCallback = () => void

function describe(_name: string, run: TestCallback): void {
  run()
}

function it(name: string, run: TestCallback): void {
  try {
    run()
  } catch (error) {
    throw new Error(`${name}: ${error instanceof Error ? error.message : String(error)}`)
  }
}

function assert(condition: boolean, message: string): void {
  if (!condition) {throw new Error(message)}
}

function equal(actual: unknown, expected: unknown, message: string): void {
  assert(Object.is(actual, expected), `${message}; expected ${String(expected)}, got ${String(actual)}`)
}

const validAreas: TosAreaConfig[] = [
  { area_title: 'Foundations', weight_percent: 60, expected_items: 2, min_percent: 50 },
  { area_title: 'Methods', weight_percent: 40, expected_items: 1, min_percent: 60 },
]

const validQuestions: TosQuestionScoreInput[] = [
  { question_text: 'Q1', section_title: 'Foundations', points: 1, points_earned: 1 },
  { question_text: 'Q2', section_title: ' Foundations ', points: 1, points_earned: 0 },
  { question_text: 'Q3', section_title: 'Methods', points: 2, points_earned: 2 },
]

describe('TOS grading helpers', () => {
  it('keeps the no-TOS result equal to the legacy score calculation', () => {
    const actual = computeTosScore(validQuestions, undefined, 4, 70)
    const legacy = computeScore(3, 4, 70)
    equal(actual.score, 3, 'raw score')
    equal(actual.weighted_percentage, legacy.percentage, 'percentage')
    equal(actual.passed, legacy.passed, 'pass state')
    equal(actual.validation_errors.length, 0, 'validation errors')
  })

  it('computes a valid weighted result and per-area percentages', () => {
    const result = computeTosScore(validQuestions, validAreas, 4, 70)
    equal(result.weighted_percentage, 70, 'weighted percentage')
    equal(result.passed, true, 'overall pass state')
    equal(result.per_area[0]?.percentage, 50, 'foundations percentage')
    equal(result.per_area[1]?.percentage, 100, 'methods percentage')
  })

  it('rejects an unmapped question', () => {
    const errors = validateTosConfig(validAreas, [
      ...validQuestions,
      { question_text: 'Unmapped', section_title: 'Other', points: 1, points_earned: 0 },
    ])
    assert(errors.some((error) => error.includes('does not match')), 'expected an unmapped area error')
  })

  it('rejects weights that do not sum to 100', () => {
    const areas = validAreas.map((area) => ({ ...area, weight_percent: 20 }))
    const errors = validateTosConfig(areas, validQuestions)
    assert(errors.some((error) => error.includes('sum to 100')), 'expected a weight total error')
  })

  it('rejects a configured area without questions', () => {
    const areas = [...validAreas, {
      area_title: 'Unused', weight_percent: 0, expected_items: 0, min_percent: 0,
    }]
    const errors = validateTosConfig(areas, validQuestions)
    assert(errors.some((error) => error.includes('Unused') && error.includes('no questions')),
      'expected an empty area error')
  })

  it('fails when an area minimum is not met', () => {
    const areas = validAreas.map((area) => area.area_title === 'Foundations'
      ? { ...area, min_percent: 75 }
      : area)
    const result = computeTosScore(validQuestions, areas, 4, 70)
    equal(result.per_area[0]?.passed, false, 'area pass state')
    equal(result.passed, false, 'overall pass state')
  })
})
