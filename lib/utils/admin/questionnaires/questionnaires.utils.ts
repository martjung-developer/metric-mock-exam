// lib/utils/admin/questionnaires/questionnaires.utils.ts
// ─────────────────────────────────────────────────────────────────────────────
// CHANGES FROM PREVIOUS VERSION:
//   + validateImportRow reads and passes through `image` field (blank = none)
//   + downloadTemplate includes 'image' column in header + example rows
//   + encodeDifficulty, parseDifficulty, stripDifficultyTag unchanged
// ─────────────────────────────────────────────────────────────────────────────

import type {
  DifficultyLevel,
  DisplayQuestion,
  RawRow,
  ImportRow,
  EmbeddedImageData,
} from '@/lib/types/admin/questionnaires/questionnaires'
import {
  VALID_TYPES,
  VALID_DIFF,
  TEMPLATE_HEADERS,
} from '@/lib/constants/admin/questionnaires/questionnaires.constants'

export function normalizeQuestionText(text: string): string {
  return text.trim().replace(/\s+/g, ' ').toLowerCase()
}

export function normalizeImageFilename(filename: string): string {
  const leafName = filename.trim().replace(/\\/g, '/').split('/').pop() ?? ''
  return leafName.trim().toLowerCase()
}

export function attachEmbeddedImagesToRows(
  rows: ImportRow[],
  images: EmbeddedImageData[],
): ImportRow[] {
  return rows.map((row, index) => {
    const embeddedImage = images[index]
    return embeddedImage ? { ...row, embeddedImage } : row
  })
}

export function embeddedImageToFile(image: EmbeddedImageData): File {
  const [header, encoded] = image.dataUrl.split(',', 2)
  if (!header || !encoded) {
    throw new Error(`Embedded image data is invalid: ${image.fileName}`)
  }

  const mimeType = /^data:(image\/[a-z0-9.+-]+);base64$/i.exec(header.slice(5))?.[1] ?? 'image/png'
  const bytes = Uint8Array.from(atob(encoded), (character) => character.charCodeAt(0))
  return new File([bytes], image.fileName, { type: mimeType })
}

export function filterQuestionnaireQuestions(
  questions: DisplayQuestion[],
  search: string,
  examId?: string,
): DisplayQuestion[] {
  const query = search.trim().toLowerCase()
  return questions.filter((question) => {
    const matchesExam = !examId || question.exam_id === examId
    const matchesSearch = !query ||
      question.question_text.toLowerCase().includes(query) ||
      (question.options?.some((option) => option.text.toLowerCase().includes(query)) ?? false)
    return matchesExam && matchesSearch
  })
}

// ── Difficulty encoding / decoding ────────────────────────────────────────────

export function parseDifficulty(raw: string | null): DifficultyLevel {
  if (!raw) { return 'medium' }
  const lower = raw.toLowerCase()
  if (lower.includes('[easy]')) { return 'easy' }
  if (lower.includes('[hard]')) { return 'hard' }
  return 'medium'
}

export function stripDifficultyTag(raw: string | null): string {
  if (!raw) { return '' }
  return raw.replace(/^\[(easy|medium|hard)\]\s*/i, '').trim()
}

export function encodeDifficulty(
  diff:        DifficultyLevel,
  explanation: string,
): string {
  const body = explanation.trim()
  return body
    ? `[${diff.toUpperCase()}] ${body}`
    : `[${diff.toUpperCase()}]`
}

// ── Row validation ────────────────────────────────────────────────────────────

export function validateImportRow(raw: RawRow, idx: number): ImportRow {
  const errors: string[] = []

  const question_text  = (raw['question_text']  ?? '').trim()
  const question_type  = (raw['question_type']  ?? '').trim().toLowerCase()
  const points         = Number(raw['points']   ?? 1) || 1
  const difficulty     = (raw['difficulty']     ?? 'medium').trim().toLowerCase()
  const correct_answer = (raw['correct_answer'] ?? '').trim()
  const explanation    = (raw['explanation']    ?? '').trim()
  const option_a       = (raw['option_a']       ?? '').trim()
  const option_b       = (raw['option_b']       ?? '').trim()
  const option_c       = (raw['option_c']       ?? '').trim()
  const option_d       = (raw['option_d']       ?? '').trim()
  const scenario       = (raw['scenario']       ?? '').trim()
  const image          = (raw['image']          ?? '').trim()   // ── ADDED — blank = no image

  if (!question_text) {
    errors.push('question_text is required')
  }

  if (!(VALID_TYPES as readonly string[]).includes(question_type)) {
    errors.push(`invalid question_type "${question_type}"`)
  }

  if (!(VALID_DIFF as readonly string[]).includes(difficulty)) {
    errors.push(`invalid difficulty "${difficulty}"`)
  }

  if (question_type === 'multiple_choice') {
    if (!option_a || !option_b) {
      errors.push('needs at least option_a and option_b')
    }
    if (!correct_answer) {
      errors.push('correct_answer required (A/B/C/D)')
    }
  }

  if (question_type === 'true_false') {
    const ca = correct_answer.toLowerCase()
    if (ca !== 'true' && ca !== 'false') {
      errors.push('correct_answer must be "true" or "false"')
    }
  }

  return {
    question_text,
    question_type,
    points,
    difficulty,
    correct_answer,
    explanation,
    option_a,
    option_b,
    option_c,
    option_d,
    scenario,
    image,                          // ── ADDED
    _rowIndex: idx + 2,
    _errors:   errors,
    _valid:    errors.length === 0,
  }
}

// ── Template download ─────────────────────────────────────────────────────────
// UPDATED: image column added as the 12th field, demonstrated on row 3 only.

export function downloadTemplate(): void {
  const header = TEMPLATE_HEADERS.join(',')

  // Row 1: MCQ with no scenario, no image
  const row1 = [
    '"What is 2 + 2?"',
    'multiple_choice',
    '1',
    'easy',
    '3',
    '4',
    '5',
    '6',
    'B',
    '"Adding two and two gives four"',
    '',                 // scenario — empty = none
    '',                 // image — empty = none
  ].join(',')

  // Row 2: T/F with no scenario, no image
  const row2 = [
    '"The Earth is flat."',
    'true_false',
    '1',
    'easy',
    '',
    '',
    '',
    '',
    'false',
    '"The Earth is an oblate spheroid"',
    '',
    '',
  ].join(',')

  // Row 3: MCQ WITH a scenario AND an image (demonstrates both columns)
  const row3 = [
    '"Based on the figure, what geometric property is illustrated?"',
    'multiple_choice',
    '2',
    'medium',
    'Congruence',
    'Similarity',
    'Symmetry',
    'Reflection',
    'C',
    '"The figure shows a shape that is identical on both sides of the axis"',
    '',
    '"BSEd-MATH/geometry_01.png"',   
  ].join(',')

  const csv  = [header, row1, row2, row3].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = 'questions_template.csv'
  a.click()
  URL.revokeObjectURL(url)
}
