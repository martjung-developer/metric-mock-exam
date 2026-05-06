// lib/utils/admin/questionnaires/docx.parser.ts
//
// BACKWARD COMPATIBILITY:
//   The original regex-based path (parseDocxToRows → segmentIntoBlocks) is
//   preserved intact for plain-text DOCX files with "1. Question" formatting.
//   The new OOXML path is attempted first via parseDocxWithMammothTransform();
//   if the caller cannot supply paragraph metadata (e.g. legacy callers that
//   only have html + plainText), it falls back to the original regex path.
// ─────────────────────────────────────────────────────────────────────────────

import type { DocxExtractResult } from './docx.extractor'
import type { ImportRow }          from '@/lib/types/admin/questionnaires/questionnaires-types'
import type { QuestionType }       from '@/lib/types/database'

// ─────────────────────────────────────────────────────────────────────────────
// Public paragraph metadata shape
// (populated by the extractor using mammoth's transformDocument)
// ─────────────────────────────────────────────────────────────────────────────

export interface DocxParagraph {
  /** OOXML list level: 0 = outer list, 1 = inner list, null = plain paragraph */
  level:    number | null
  /** Concatenated text of all bold runs in this paragraph (empty string if none) */
  boldText: string
  /** Full plain text of the paragraph */
  text:     string
}

// ─────────────────────────────────────────────────────────────────────────────
// Extended extractor result — adds structured paragraph data
// ─────────────────────────────────────────────────────────────────────────────

export interface DocxExtractResultWithParagraphs extends DocxExtractResult {
  /** Structured paragraph list from mammoth's transformDocument */
  paragraphs: DocxParagraph[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers for mammoth's document model traversal
// ─────────────────────────────────────────────────────────────────────────────

type MammothElement = {
  type?:      string
  value?:     string
  isBold?:    boolean
  numbering?: { isOrdered: boolean; level: string } | null
  children?:  MammothElement[]
}

/** Recursively concatenate all text values in a mammoth element tree */
export function mammothGetText(el: MammothElement): string {
  if (!el) {return ''}
  if (el.value !== undefined) {return el.value}
  if (el.children) {return el.children.map(mammothGetText).join('')}
  return ''
}

/**
 * Recursively concatenate text from runs where isBold === true.
 * Note: mammoth uses `isBold` (not `bold`) on run elements.
 */
export function mammothGetBoldText(el: MammothElement): string {
  if (!el) {return ''}
  if (el.type === 'run' && el.isBold) {
    return el.children ? el.children.map(mammothGetText).join('') : ''
  }
  if (el.children) {return el.children.map(mammothGetBoldText).join('')}
  return ''
}

/**
 * Walk a mammoth document tree and collect one DocxParagraph per paragraph.
 * Call this inside mammoth's transformDocument callback:
 *
 *   transformDocument: (doc) => {
 *     paragraphs = collectParagraphs(doc)
 *     return doc
 *   }
 */
export function collectParagraphs(doc: MammothElement): DocxParagraph[] {
  const result: DocxParagraph[] = []

  function walk(el: MammothElement): void {
    if (el.type === 'paragraph') {
      result.push({
        level:    el.numbering != null ? parseInt(el.numbering.level, 10) : null,
        boldText: mammothGetBoldText(el).trim(),
        text:     mammothGetText(el).trim(),
      })
    }
    if (el.children) {el.children.forEach(walk)}
  }

  walk(doc)
  return result
}

// ─────────────────────────────────────────────────────────────────────────────
// Type utilities
// ─────────────────────────────────────────────────────────────────────────────

type ValidQuestionType =
  | 'multiple_choice'
  | 'true_false'
  | 'short_answer'
  | 'fill_blank'
  | 'essay'
  | 'matching'

const VALID_QUESTION_TYPES: readonly ValidQuestionType[] = [
  'multiple_choice',
  'true_false',
  'short_answer',
  'fill_blank',
  'essay',
  'matching',
]

function isQuestionType(s: string): s is ValidQuestionType {
  return VALID_QUESTION_TYPES.some((item) => item === s)
}

function toQuestionType(s: string): QuestionType {
  return isQuestionType(s) ? s : 'multiple_choice'
}

// ─────────────────────────────────────────────────────────────────────────────
// OOXML list-based parser (new primary path)
// ─────────────────────────────────────────────────────────────────────────────

interface ChoiceEntry {
  text: string
  isBold: boolean
}

interface OoxmlBlock {
  scenario:  string
  stem:      string
  choices:   ChoiceEntry[]
}

const RE_LEADING_QUESTION_NUMBER = /^(?:Q(?:uestion)?\s*)?\d{1,3}[.)]\s*/i
const RE_LEADING_CHOICE_LABEL = /^[(\[]?([A-Ea-e])[.)}\]]\s+/
const RE_SCENARIO_HINT = /^(?:refer\s+to|read\s+the\s+following|passage|case\s+study|scenario)[:\s]/i
const RE_TRUE_FALSE_ONLY = /^(?:true|false)$/i
const RE_QUESTION_HINT = /^(?:who|what|when|where|which|why|how)\b/i

function stripQuestionPrefix(text: string): string {
  return text.replace(RE_LEADING_QUESTION_NUMBER, '').trim()
}

function looksLikeChoiceText(text: string): boolean {
  const trimmed = text.trim()
  if (trimmed.length === 0) {return false}
  if (RE_LEADING_CHOICE_LABEL.test(trimmed)) {return true}
  if (RE_TRUE_FALSE_ONLY.test(trimmed)) {return true}
  return trimmed.length <= 160 && !trimmed.endsWith('?')
}

function looksLikeChoice(p: DocxParagraph): boolean {
  if (p.level === null) {return false}
  return looksLikeChoiceText(p.text)
}

/** Plain paragraph that looks like a question stem (ends with '?') */
function looksLikeStem(p: DocxParagraph): boolean {
  const text = p.text.trim()
  return (
    text.endsWith('?') ||
    RE_LEADING_QUESTION_NUMBER.test(text) ||
    RE_QUESTION_HINT.test(text)
  )
}

/** Long scenario or passage paragraph */
function looksLikeScenario(p: DocxParagraph): boolean {
  return (
    RE_SCENARIO_HINT.test(p.text) ||
    (p.text.length > 80 && !p.text.trimEnd().endsWith('?'))
  )
}

function isSectionHeading(p: DocxParagraph): boolean {
  const text = p.text.trim()
  if (!text || text.length > 120) {return false}
  if (looksLikeStem(p) || looksLikeChoiceText(text)) {return false}
  return (
    /(?:exam|section|part|instructions?|practice|mock)\b/i.test(text) &&
    !text.endsWith('.')
  )
}

function hasChoiceRun(paras: DocxParagraph[], start: number): boolean {
  let count = 0
  for (let i = start + 1; i < paras.length; i++) {
    const p = paras[i]
    if (!p.text) {continue}
    if (looksLikeChoice(p)) {
      count++
      if (count >= 2) {return true}
      continue
    }
    if (count > 0) {break}
    if (looksLikeStem(p) || isSectionHeading(p)) {return false}
  }
  return false
}

function hasParagraphs(
  extracted: DocxExtractResult,
): extracted is DocxExtractResultWithParagraphs {
  return Array.isArray(extracted.paragraphs) && extracted.paragraphs.length > 0
}

/**
 * Parse OOXML-structured paragraphs into question blocks.
 *
 * This is the primary parser path for DOCX files exported from Word that use
 * OOXML list numbering instead of plain-text "1." prefixes.
 */
function parseOoxmlParagraphs(paras: DocxParagraph[]): OoxmlBlock[] {
  const blocks: OoxmlBlock[] = []
  let pendingScenario = ''
  let i = 0

  while (i < paras.length) {
    const p = paras[i]

    if (!p.text) { i++; continue }
    if (isSectionHeading(p)) { i++; continue }
    if (looksLikeScenario(p) && !hasChoiceRun(paras, i)) {
      pendingScenario += `${pendingScenario ? ' ' : ''}${p.text.trim()}`
      i++
      continue
    }
    if (!looksLikeStem(p) && !hasChoiceRun(paras, i)) {
      i++
      continue
    }

    let scenario = pendingScenario
    let stem     = stripQuestionPrefix(p.text)
    const choices: ChoiceEntry[] = []
    pendingScenario = ''
    i++

    while (i < paras.length && paras[i].text) {
      const next = paras[i]
      if (looksLikeChoice(next)) {
        choices.push({ text: next.text.trim(), isBold: next.boldText.length > 0 })
        i++
        continue
      }
      if (choices.length === 0 && next.level === null && !looksLikeStem(next)) {
        stem += `${stem ? ' ' : ''}${next.text.trim()}`
        i++
        continue
      }
      if (looksLikeStem(next) && hasChoiceRun(paras, i)) {break}
      if (isSectionHeading(next)) {break}
      if (looksLikeScenario(next) && choices.length === 0) {
        scenario += `${scenario ? ' ' : ''}${next.text.trim()}`
        i++
        continue
      }
      break
    }

    if (stem && choices.length >= 2) {
      blocks.push({ scenario, stem, choices })
    } else if (stem && !scenario) {
      pendingScenario = stem
    }
  }

  return blocks
}

/** Convert one OoxmlBlock → ImportRow */
function ooxmlBlockToRow(
  block:         OoxmlBlock,
  rowIndex:      number,
  defaultPoints: number,
): ImportRow {
  const labels  = ['A', 'B', 'C', 'D', 'E']
  const choiceMap: Record<string, string> = {}

  for (let j = 0; j < Math.min(block.choices.length, 5); j++) {
    const label = labels[j]
    const choice = block.choices[j]
    if (label && choice) {
      choiceMap[label] = choice.text
    }
  }

  const boldChoice  = block.choices.find((c) => c.isBold)
  const boldLabel   = boldChoice
    ? (labels[block.choices.indexOf(boldChoice)] ?? '')
    : ''
  const correctText = boldChoice?.text ?? ''

  // Detect question type
  let questionType: QuestionType = 'multiple_choice'
  const stemLower = block.stem.toLowerCase()

  if (
    block.choices.length === 2 &&
    block.choices.every((c) => /^(true|false)$/i.test(c.text.trim()))
  ) {
    questionType = toQuestionType('true_false')
  } else if (/_{2,}/.test(block.stem)) {
    questionType = toQuestionType('fill_blank')
  } else if (/\btrue\s+or\s+false\b|\bt\s*\/\s*f\b/i.test(stemLower)) {
    questionType = toQuestionType('true_false')
  }

  const errors = validateOoxmlBlock(block, boldLabel)

  return {
    _rowIndex:      rowIndex,
    _valid:         errors.length === 0,
    _errors:        errors,
    question_text:  block.stem,
    question_type:  questionType,
    correct_answer: boldLabel || correctText,
    option_a:       choiceMap['A'] ?? '',
    option_b:       choiceMap['B'] ?? '',
    option_c:       choiceMap['C'] ?? '',
    option_d:       choiceMap['D'] ?? '',
    explanation:    '',
    scenario:       block.scenario,
    difficulty:     'medium',
    points:         defaultPoints,
    exam_id:        '',
    program_id:     '',
  } satisfies ImportRow
}

function validateOoxmlBlock(block: OoxmlBlock, correctLabel: string): string[] {
  const errors: string[] = []

  if (!block.stem || block.stem.length < 3) {
    errors.push('Question text is too short or missing.')
  }
  if (block.choices.length < 2) {
    errors.push('Multiple choice requires at least 2 choices.')
  }
  if (!correctLabel) {
    errors.push('Could not detect the correct answer — bold it in the DOCX.')
  }

  return errors
}

// ─────────────────────────────────────────────────────────────────────────────
// Primary export — OOXML paragraph path
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parse a DOCX exported from Microsoft Word (OOXML list numbering).
 *
 * Requires the extractor to supply `paragraphs` (from collectParagraphs()).
 * Returns [] only if no valid blocks are found — the caller should then
 * fall back to parseDocxToRows() for plain-text "1." formatted files.
 */
export function parseDocxWithParagraphs(
  extracted:     DocxExtractResultWithParagraphs,
  defaultPoints = 1,
): ImportRow[] {
  const blocks = parseOoxmlParagraphs(extracted.paragraphs)
  if (blocks.length === 0) {return []}
  return blocks.map((b, i) => ooxmlBlockToRow(b, i + 1, defaultPoints))
}

// ─────────────────────────────────────────────────────────────────────────────
// Legacy regex-based parser (original path — preserved unchanged)
// ─────────────────────────────────────────────────────────────────────────────
// Used as a fallback for plain-text DOCX files where questions are written as
// "1. Which…" or "1) Which…" with no OOXML list numbering.
// ─────────────────────────────────────────────────────────────────────────────

const RE_QUESTION_START = /^(?:Q(?:uestion)?\s*)?(\d{1,3})[.)]\s+(.+)/i
const RE_CHOICE         = /^[(\[]?([A-Ea-e])[.)}\]]\s*(.+)/
const RE_ANSWER_LINE    = /^(?:answer|ans(?:wer)?|key|correct)[:\s]+(.+)/i
const RE_TF_BRACKET     = /[(\[–-]\s*(true|false)\s*[)\]]?/i
const RE_TF_QUESTION    = /\b(?:true\s+or\s+false|t\s*\/\s*f|tf)[:\s]/i
const RE_BLANK          = /_{2,}|\[_{2,}\]/
const RE_INLINE_ANS     = /[(\[]([\w\s,'-]{1,80})[)\]]/
const RE_EXPLANATION    = /^(?:explanation|rationale|reason)[:\s]+(.+)/i
const RE_SCENARIO       = /^(?:refer\s+to|read\s+the\s+following|passage|case\s+study|scenario)[:\s]/i

interface ParsedBlock {
  questionText:  string
  questionType:  QuestionType
  choices:       Array<{ label: string; text: string }>
  correctAnswer: string
  explanation:   string
  scenario:      string
  choiceTexts:   Map<string, string>
}

interface RawBlock {
  questionLine: string
  body:         string[]
  scenarioPre:  string
}

function splitLines(text: string): string[] {
  return text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0)
}

function stripHtmlTags(html: string): string {
  return html
    .replace(/<\/p>/gi,      '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<li[^>]*>/gi,  '\n')
    .replace(/<[^>]+>/g,     '')
    .replace(/&nbsp;/g,      ' ')
    .replace(/&amp;/g,       '&')
    .replace(/&lt;/g,        '<')
    .replace(/&gt;/g,        '>')
    .replace(/&quot;/g,      '"')
}

function segmentIntoBlocks(lines: string[]): RawBlock[] {
  const blocks: RawBlock[] = []
  let current: RawBlock | null = null
  let pending                  = ''

  for (const line of lines) {
    const qm = RE_QUESTION_START.exec(line)
    if (qm !== null) {
      if (current !== null) {blocks.push(current)}
      current = { questionLine: line, body: [], scenarioPre: pending }
      pending = ''
      continue
    }

    if (RE_SCENARIO.test(line) && current === null) {
      pending += (pending ? '\n' : '') + line
      continue
    }

    if (current !== null) {
      current.body.push(line)
    } else if (line.length > 10) {
      pending += (pending ? '\n' : '') + line
    }
  }

  if (current !== null) {blocks.push(current)}
  return blocks
}

function parseBlock(raw: RawBlock): ParsedBlock {
  const qm           = RE_QUESTION_START.exec(raw.questionLine)
  const questionText = qm?.[2]?.trim() ?? raw.questionLine

  const choices:    Array<{ label: string; text: string }> = []
  const choiceTexts = new Map<string, string>()
  let correctAnswer = ''
  let explanation   = ''
  const scenario    = raw.scenarioPre

  let questionType: QuestionType = 'multiple_choice'

  if (RE_TF_QUESTION.test(questionText) || /\b(true|false)\b/i.test(questionText)) {
    questionType = 'true_false'
  }

  if (RE_BLANK.test(questionText)) {
    questionType = 'fill_blank'
    const im = RE_INLINE_ANS.exec(questionText)
    if (im) {correctAnswer = im[1]?.trim() ?? ''}
  }

  for (const line of raw.body) {
    const am = RE_ANSWER_LINE.exec(line)
    if (am) { correctAnswer = am[1]?.trim() ?? ''; continue }

    const em = RE_EXPLANATION.exec(line)
    if (em) { explanation = em[1]?.trim() ?? ''; continue }

    if (questionType === 'true_false') {
      const tm = RE_TF_BRACKET.exec(line)
      if (tm) { correctAnswer = (tm[1] ?? '').toLowerCase(); continue }
    }

    const cm = RE_CHOICE.exec(line)
    if (cm) {
      const label = (cm[1] ?? '').toUpperCase()
      const text  = (cm[2] ?? '').trim()
      choices.push({ label, text })
      choiceTexts.set(label, text)
      if (/^\*[^*]+\*$/.test(text) || line.startsWith('*')) {
        correctAnswer = label
      }
    }
  }

  if (choices.length === 0 && questionType === 'multiple_choice') {
    if (RE_BLANK.test(questionText)) {
      questionType = toQuestionType('fill_blank')
    } else if (raw.body.some((l) => RE_TF_BRACKET.test(l))) {
      questionType = toQuestionType('true_false')
    } else if (raw.body.length > 0) {
      questionType = toQuestionType('short_answer')
    }
  }

  return { questionText, questionType, choices, correctAnswer, explanation, scenario, choiceTexts }
}

function resolveCorrectAnswer(block: ParsedBlock, boldSet: ReadonlySet<string>): string {
  if (block.correctAnswer !== '') {return block.correctAnswer}
  if (boldSet.size === 0)         {return ''}

  const boldNorm = new Set<string>()
  for (const b of boldSet) {boldNorm.add(normalise(b))}

  for (const { label, text } of block.choices) {
    if (boldSet.has(text)) {return label}

    const norm = normalise(text)
    if (boldNorm.has(norm)) {return label}

    for (const bold of boldSet) {
      const bn = normalise(bold)
      if (bn.length >= 3 && norm.includes(bn)) {return label}
    }
  }

  return ''
}

function normalise(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim()
}

function blockToRow(
  raw:           RawBlock,
  boldSet:       ReadonlySet<string>,
  rowIndex:      number,
  defaultPoints: number,
): ImportRow {
  const parsed  = parseBlock(raw)
  const correct = resolveCorrectAnswer(parsed, boldSet)

  const choiceMap: Record<string, string> = {}
  for (const { label, text } of parsed.choices) {
    choiceMap[label] = text
  }

  const errors = validateLegacyRow(parsed, correct)

  return {
    _rowIndex:      rowIndex,
    _valid:         errors.length === 0,
    _errors:        errors,
    question_text:  parsed.questionText,
    question_type:  parsed.questionType,
    correct_answer: correct,
    option_a:       choiceMap['A'] ?? '',
    option_b:       choiceMap['B'] ?? '',
    option_c:       choiceMap['C'] ?? '',
    option_d:       choiceMap['D'] ?? '',
    explanation:    parsed.explanation,
    scenario:       parsed.scenario,
    difficulty:     'medium',
    points:         defaultPoints,
    exam_id:        '',
    program_id:     '',
  } satisfies ImportRow
}

function validateLegacyRow(block: ParsedBlock, correctAnswer: string): string[] {
  const errors: string[] = []

  if (!block.questionText || block.questionText.length < 3) {
    errors.push('Question text is too short or missing.')
  }

  if (block.questionType === 'multiple_choice') {
    if (block.choices.length < 2) {
      errors.push('Multiple choice requires at least 2 choices.')
    }
    if (!correctAnswer) {
      errors.push('Could not detect the correct answer — bold it in the DOCX.')
    }
  }

  if (block.questionType === 'true_false' && !correctAnswer) {
    errors.push('True/False answer not detected.')
  }

  return errors
}

/**
 * Legacy regex-based entry point — handles plain-text "1. Question" DOCX files.
 *
 * Still works exactly as before. Callers that already have html + plainText
 * (and no paragraph metadata) continue to use this.
 */
export function parseDocxToRows(
  extracted:     DocxExtractResult,
  defaultPoints = 1,
): ImportRow[] {
  if (hasParagraphs(extracted)) {
    const ooxmlRows = parseDocxWithParagraphs(extracted, defaultPoints)
    if (ooxmlRows.length > 0) {return ooxmlRows}
  }

  const lines  = splitLines(extracted.plainText)
  const blocks = segmentIntoBlocks(lines)

  if (blocks.length === 0) {
    const htmlLines  = splitLines(stripHtmlTags(extracted.html))
    const htmlBlocks = segmentIntoBlocks(htmlLines)
    if (htmlBlocks.length === 0) {return []}
    return htmlBlocks.map((b, i) => blockToRow(b, extracted.boldSet, i + 1, defaultPoints))
  }

  return blocks.map((b, i) => blockToRow(b, extracted.boldSet, i + 1, defaultPoints))
}
