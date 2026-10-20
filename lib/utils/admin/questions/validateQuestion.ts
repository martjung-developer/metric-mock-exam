// lib/utils/admin/questions/validateQuestion.ts
//
// Type-safe, exhaustive validation for all question types.
// Returns a discriminated union — callers check `.valid` before reading errors.

import type {
  QuestionForm,
  QuestionType,
  ValidationResult,
} from '@/lib/types/admin/exams/questions/questions.types'

function err(field: string, message: string): ValidationResult {
  return { valid: false, errors: [{ field, message }] }
}

export function validateQuestion(form: QuestionForm): ValidationResult {
  // ── Shared rules ───────────────────────────────────────────────────────
  if (!form.question_text.trim()) {
    return err('question_text', 'Question text is required.')
  }

  if (!Number.isInteger(form.points) || form.points < 1) {
    return err('points', 'Points must be a whole number of at least 1.')
  }

  // ── Type-specific rules ────────────────────────────────────────────────
  const type: QuestionType = form.question_type

  switch (type) {
    case 'multiple_choice': {
      if (form.options.length < 2) {
        return err('options', 'Multiple choice questions need at least 2 options.')
      }
      if (form.options.some((o) => !o.text.trim())) {
        return err('options', 'All option texts are required.')
      }
      if (!form.correct_answer) {
        return err('correct_answer', 'Please select the correct answer.')
      }
      const validLabels = form.options.map((o) => o.label)
      if (!validLabels.includes(form.correct_answer)) {
        return err('correct_answer', 'The selected answer does not match any option.')
      }
      break
    }

    case 'true_false': {
      if (form.correct_answer !== 'true' && form.correct_answer !== 'false') {
        return err('correct_answer', 'Please select True or False as the correct answer.')
      }
      break
    }

    case 'fill_blank': {
      if (!form.correct_answer.trim()) {
        return err('correct_answer', 'Please enter the expected answer.')
      }
      break
    }

    // Manual-graded types — no answer required at creation time.
    case 'short_answer':
    case 'matching':
    case 'essay':
      break

    default: {
      // TypeScript exhaustiveness check — unreachable at runtime.
      const _exhaustive: never = type
      return err('question_type', `Unknown question type: ${String(_exhaustive)}`)
    }
  }

  return { valid: true }
}