// lib/utils/admin/questionnaires/docx.parser.ts

import mammoth                       from 'mammoth'
import type { DocxExtractResult } from './docx.extractor'
import type { ImportRow }         from '@/lib/types/admin/questionnaires/questionnaires-types'
import type { QuestionType }      from '@/lib/types/database'

// ─────────────────────────────────────────────────────────────────────────────
// Public paragraph metadata shape
// ─────────────────────────────────────────────────────────────────────────────

export interface DocxParagraph {
  level:    number | null
  boldText: string
  text:     string
}

export interface DocxExtractResultWithParagraphs extends DocxExtractResult {
  paragraphs: DocxParagraph[]
}

export async function extractHtml(buffer: Buffer): Promise<string> {
  const result = await mammoth.convertToHtml({ buffer })
  return result.value
}

export async function extractRawText(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer })
  return result.value
}

export function parseQuestionsFromHtml(html: string): string {
  return stripHtmlTags(html)
}

// ─────────────────────────────────────────────────────────────────────────────
// Mammoth tree traversal helpers (unchanged)
// ─────────────────────────────────────────────────────────────────────────────

type MammothElement = {
  type?:      string
  value?:     string
  isBold?:    boolean
  numbering?: { isOrdered: boolean; level: string } | null
  children?:  MammothElement[]
}

export function mammothGetText(el: MammothElement): string {
  if (!el) { return '' }
  if (el.value !== undefined) { return el.value }
  if (el.children) { return el.children.map(mammothGetText).join('') }
  return ''
}

export function mammothGetBoldText(el: MammothElement): string {
  if (!el) { return '' }
  if (el.type === 'run' && el.isBold) {
    return el.children ? el.children.map(mammothGetText).join('') : ''
  }
  if (el.children) { return el.children.map(mammothGetBoldText).join('') }
  return ''
}

export function collectParagraphs(doc: MammothElement): DocxParagraph[] {
  const result: DocxParagraph[] = []

  function walk(el: MammothElement): void {
    if (el.type === 'paragraph') {
      result.push({
        level:    el.numbering !== null && el.numbering !== undefined ? parseInt(el.numbering.level, 10) : null,
        boldText: mammothGetBoldText(el).trim(),
        text:     mammothGetText(el).trim(),
      })
    }
    if (el.children) { el.children.forEach(walk) }
  }

  walk(doc)
  return result
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared regular expressions (module-scope — compiled once)
// ─────────────────────────────────────────────────────────────────────────────

const RE_LEADING_QUESTION_NUMBER = /^(?:Q(?:uestion)?\s*)?\d{1,3}[.)]\s*/i
const RE_LEADING_CHOICE_LABEL    = /^[(\[]?([A-Ea-e])[.)}\]]\s+/
const RE_SCENARIO_HINT           = /^(?:refer\s+to|read\s+the\s+following|passage|case\s+study|scenario)[:\s]/i
const RE_TRUE_FALSE_ONLY         = /^(?:true|false)$/i
const RE_QUESTION_HINT           = /^(?:who|what|when|where|which|why|how)\b/i
const RE_SCENARIO_QUESTION       = /^(?:from\s+the\s+(?:scenario|passage|above|text)|based\s+on|according\s+to)/i

// ─────────────────────────────────────────────────────────────────────────────
// FIX 3 — Per-paragraph flag cache
// Classifiers are called O(n²) times in nested loops; pre-compute them once.
// ─────────────────────────────────────────────────────────────────────────────

interface ParaFlags {
  isStem:     boolean
  isScenario: boolean
  isHeading:  boolean
  isChoice:   boolean
}

/** Run every classifier exactly once per paragraph — O(n) total. */
function buildParaFlags(paras: DocxParagraph[]): ParaFlags[] {
  return paras.map((p) => {
    const text    = p.text.trim()
    const isEmpty = text.length === 0

    // ── looksLikeStem ────────────────────────────────────────────────────────
    const isStem = !isEmpty && (
      text.endsWith('?')                    ||
      text.includes('_____')                ||
      RE_LEADING_QUESTION_NUMBER.test(text) ||
      RE_QUESTION_HINT.test(text)           ||
      RE_SCENARIO_QUESTION.test(text)
    )

    // ── isSectionHeading ─────────────────────────────────────────────────────
    const looksLikeChoiceText = text.length > 0 && (
      RE_LEADING_CHOICE_LABEL.test(text) ||
      RE_TRUE_FALSE_ONLY.test(text)      ||
      (text.length <= 160 && !text.endsWith('?'))
    )

    const isHeading = (
      !isEmpty                     &&
      text.length <= 120           &&
      !isStem                      &&
      !looksLikeChoiceText         &&
      /(?:exam|section|part|instructions?|practice|mock)\b/i.test(text) &&
      !text.endsWith('.')
    )

    // ── looksLikeScenario ────────────────────────────────────────────────────
    const isScenario = (
      !isEmpty     &&
      !isStem      &&
      (RE_SCENARIO_HINT.test(text) || text.length > 40)
    )

    // ── looksLikeChoice ──────────────────────────────────────────────────────
    const isChoice = (
      p.level !== null &&
      text.length > 0  &&
      looksLikeChoiceText
    )

    return { isStem, isScenario, isHeading, isChoice }
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// FIX 1 — O(n) choice-run cache via single backwards pass
//
// Original: buildChoiceRunCache called hasChoiceRun(paras, i) for every i.
// hasChoiceRun walks forward up to n steps → total O(n²).
//
// NEW algorithm: scan right-to-left, maintaining a sliding window of how many
// consecutive choice paragraphs have been seen starting from position i+1.
// If that count reaches 2, choiceRunCache[i] = true.
// This is O(n) total with no inner loop.
// ─────────────────────────────────────────────────────────────────────────────

function buildChoiceRunCache(flags: ParaFlags[]): boolean[] {
  const n     = flags.length
  const cache = new Array<boolean>(n).fill(false)

  // choicesAhead[i] = number of consecutive choice paragraphs starting at i
  // (capped at 2 because we only care whether >= 2 exist)
  const choicesAhead = new Array<number>(n).fill(0)

  for (let i = n - 1; i >= 0; i--) {
    const f = flags[i]
    if (!f) { continue }

    if (f.isChoice) {
      // Extend the run from i+1 (or start a new run of 1)
      const next = i + 1 < n ? (choicesAhead[i + 1] ?? 0) : 0
      choicesAhead[i] = Math.min(next + 1, 2)
    } else if (f.isHeading || (f.isStem && i > 0)) {
      // Choice run resets after a heading or a second stem
      choicesAhead[i] = 0
    } else {
      // Non-choice, non-heading, non-stem (prose/scenario/blank) — pass through
      choicesAhead[i] = i + 1 < n ? (choicesAhead[i + 1] ?? 0) : 0
    }

    // A position has a choice run when 2+ choices follow it
    cache[i] = (i + 1 < n) && ((choicesAhead[i + 1] ?? 0) >= 2)
  }

  return cache
}

// ─────────────────────────────────────────────────────────────────────────────
// Type utilities (unchanged)
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
// OOXML block types
// ─────────────────────────────────────────────────────────────────────────────

interface ChoiceEntry {
  text:   string
  isBold: boolean
}

interface OoxmlBlock {
  scenario: string
  stem:     string
  choices:  ChoiceEntry[]
}

// ─────────────────────────────────────────────────────────────────────────────
// FIX 1 + 2 + 3 — Core OOXML parser using pre-computed flags and O(n) cache
// ─────────────────────────────────────────────────────────────────────────────

function parseOoxmlParagraphs(paras: DocxParagraph[]): OoxmlBlock[] {
  const blocks  = [] as OoxmlBlock[]
  const flags   = buildParaFlags(paras)          // FIX 3 — O(n) single pass
  const crCache = buildChoiceRunCache(flags)      // FIX 1 — O(n) backwards pass

  let pendingScenario = ''
  let i               = 0

  while (i < paras.length) {
    // FIX 2 — always guard array access before use
    const p = paras[i]
    const f = flags[i]
    if (p === undefined || f === undefined) { i++; continue }
    if (!p.text) { i++; continue }
    if (f.isHeading) { i++; continue }

    // ── Scenario / passage accumulation ──────────────────────────────────────
    const isDefinitelyScenario =
      f.isScenario && (!crCache[i] || p.text.length > 80)

    if (isDefinitelyScenario) {
      // FIX 2 — safe greedy loop: check bounds BEFORE accessing paras[i]
      while (i < paras.length) {
        const cur  = paras[i]
        const curF = flags[i]
        if (cur === undefined || curF === undefined) { i++; break }

        if (!cur.text) { i++; continue }

        if (curF.isStem || curF.isHeading || curF.isChoice) {
          // Step back so the outer loop re-processes this paragraph
          break
        }

        pendingScenario += `${pendingScenario ? ' ' : ''}${cur.text.trim()}`
        i++
      }
      continue
    }

    // ── Skip paragraphs that are neither stems nor lead to choices ───────────
    if (!f.isStem && !crCache[i]) { i++; continue }

    // ── Question block ────────────────────────────────────────────────────────
    const scenario   = pendingScenario
    let stem         = p.text.replace(RE_LEADING_QUESTION_NUMBER, '').trim()
    const choices    = [] as ChoiceEntry[]
    pendingScenario  = ''
    i++

    while (i < paras.length) {
      const next  = paras[i]
      const nextF = flags[i]
      if (next === undefined || nextF === undefined) { break }
      if (!next.text) { break }

      if (nextF.isChoice) {
        choices.push({ text: next.text.trim(), isBold: next.boldText.length > 0 })
        i++
        continue
      }

      // Stem continuation before any choice has been collected
      if (choices.length === 0 && next.level === null && !nextF.isStem) {
        stem += `${stem ? ' ' : ''}${next.text.trim()}`
        i++
        continue
      }

      // Next question begins
      if (nextF.isStem && crCache[i]) { break }

      // Section boundary
      if (nextF.isHeading) { break }

      // Late scenario paragraph before any choice
      if (nextF.isScenario && choices.length === 0) {
        pendingScenario += `${pendingScenario ? ' ' : ''}${next.text.trim()}`
        i++
        continue
      }

      break
    }

    if (stem && choices.length >= 2) {
      blocks.push({ scenario, stem, choices })
    } else if (stem && !scenario) {
      // Orphaned stem — carry forward as scenario
      pendingScenario = stem
    }
  }

  return blocks
}

// ─────────────────────────────────────────────────────────────────────────────
// OoxmlBlock → ImportRow (unchanged logic)
// ─────────────────────────────────────────────────────────────────────────────

function ooxmlBlockToRow(
  block:         OoxmlBlock,
  rowIndex:      number,
  defaultPoints: number,
): ImportRow {
  const labels    = ['A', 'B', 'C', 'D', 'E']
  const choiceMap: Record<string, string> = {}

  for (let j = 0; j < Math.min(block.choices.length, 5); j++) {
    const label  = labels[j]
    const choice = block.choices[j]
    if (label && choice) { choiceMap[label] = choice.text }
  }

  const boldChoice  = block.choices.find((c) => c.isBold)
  const boldLabel   = boldChoice ? (labels[block.choices.indexOf(boldChoice)] ?? '') : ''
  const correctText = boldChoice?.text ?? ''

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
// FIX 4 — Async wrapper for browser callers
// Breaks the synchronous parse into yielded micro-tasks so the browser
// can paint between stages, preventing "page not responding".
// ─────────────────────────────────────────────────────────────────────────────

function yieldToMain(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

/**
 * Async version of parseDocxToRows — safe to call in the browser.
 * Yields to the main thread between the OOXML stage and the legacy stage
 * so the browser never blocks long enough to show "page not responding".
 *
 * Usage (in your import modal component):
 *   const rows = await parseDocxToRowsAsync(extracted)
 */
export async function parseDocxToRowsAsync(
  extracted:     DocxExtractResult,
  defaultPoints = 1,
): Promise<ImportRow[]> {
  // Stage 1 — OOXML path
  await yieldToMain()

  if (hasParagraphs(extracted)) {
    const ooxmlRows = parseDocxWithParagraphs(extracted, defaultPoints)
    if (ooxmlRows.length > 0) { return ooxmlRows }
  }

  // Stage 2 — Legacy regex path
  await yieldToMain()

  return parseLegacy(extracted, defaultPoints)
}

// ─────────────────────────────────────────────────────────────────────────────
// OOXML path public export (unchanged signature)
// ─────────────────────────────────────────────────────────────────────────────

function hasParagraphs(
  extracted: DocxExtractResult,
): extracted is DocxExtractResultWithParagraphs {
  return (
    'paragraphs' in extracted &&
    Array.isArray(extracted.paragraphs) &&
    extracted.paragraphs.length > 0
  )
}

export function parseDocxWithParagraphs(
  extracted:     DocxExtractResultWithParagraphs,
  defaultPoints = 1,
): ImportRow[] {
  const blocks = parseOoxmlParagraphs(extracted.paragraphs)
  if (blocks.length === 0) { return [] }
  return blocks.map((b, i) => ooxmlBlockToRow(b, i + 1, defaultPoints))
}

// ─────────────────────────────────────────────────────────────────────────────
// Legacy regex-based parser (unchanged — preserved exactly)
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
const RE_INLINE_CHOICES = /(?:^|\s)([A-Ea-e])[.)]\s*([^]+?)(?=(?:\s+[A-Ea-e][.)]\s*)|$)/g
const RE_QUESTION_NUMBER_ONLY = /^\d{1,3}[.)]\s*/

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
      if (current !== null) { blocks.push(current) }
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

  if (current !== null) { blocks.push(current) }
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
    if (im) { correctAnswer = im[1]?.trim() ?? '' }
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
  if (block.correctAnswer !== '') { return block.correctAnswer }
  if (boldSet.size === 0)         { return '' }

  const boldNorm = new Set<string>()
  for (const b of boldSet) { boldNorm.add(normalise(b)) }

  for (const { label, text } of block.choices) {
    if (boldSet.has(text)) { return label }
    const norm = normalise(text)
    if (boldNorm.has(norm)) { return label }
    for (const bold of boldSet) {
      const bn = normalise(bold)
      if (bn.length >= 3 && norm.includes(bn)) { return label }
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
  for (const { label, text } of parsed.choices) { choiceMap[label] = text }

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

// ─────────────────────────────────────────────────────────────────────────────
// Internal legacy path (extracted for reuse by both sync and async variants)
// ─────────────────────────────────────────────────────────────────────────────

function parseLegacy(extracted: DocxExtractResult, defaultPoints: number): ImportRow[] {
  const lines  = splitLines(extracted.plainText)
  const blocks = segmentIntoBlocks(lines)

  if (blocks.length === 0) {
    const htmlLines  = splitLines(stripHtmlTags(extracted.html))
    const htmlBlocks = segmentIntoBlocks(htmlLines)
    if (htmlBlocks.length > 0) {
      return htmlBlocks.map((b, i) => blockToRow(b, extracted.boldSet, i + 1, defaultPoints))
    }

    // Fallback for scenario-style MCQ docs that omit explicit numbering.
    const scenarioRows = parseScenarioMcqLines(htmlLines.length > 0 ? htmlLines : lines, extracted.boldSet, defaultPoints)
    if (scenarioRows.length > 0) {
      return scenarioRows
    }
    return []
  }

  return blocks.map((b, i) => blockToRow(b, extracted.boldSet, i + 1, defaultPoints))
}

// ─────────────────────────────────────────────────────────────────────────────
// Primary synchronous export (server-side / route handlers)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Synchronous parser — safe for server-side use (API routes, Node.js).
 * DO NOT call this directly in browser event handlers or React components
 * on large documents — use parseDocxToRowsAsync instead.
 */
export function parseDocxToRows(
  extracted:     DocxExtractResult,
  defaultPoints = 1,
): ImportRow[] {
  if (hasParagraphs(extracted)) {
    const ooxmlRows = parseDocxWithParagraphs(extracted, defaultPoints)
    if (ooxmlRows.length > 0) { return ooxmlRows }
  }

  return parseLegacy(extracted, defaultPoints)
}

function parseScenarioMcqLines(
  lines: readonly string[],
  boldSet: ReadonlySet<string>,
  defaultPoints: number,
): ImportRow[] {
  const rows: ImportRow[] = []
  const normalizedBold = new Set<string>(Array.from(boldSet, normalise))
  let i = 0
  let pendingScenario = ''

  const isLikelyQuestion = (line: string): boolean => {
    if (line.length < 10) { return false }
    if (/\?\s*$/.test(line)) { return true }
    return RE_QUESTION_NUMBER_ONLY.test(line) && line.length > 20
  }

  const isLikelyChoice = (line: string): boolean => {
    if (line.length === 0) { return false }
    if (isLikelyQuestion(line)) { return false }
    if (RE_ANSWER_LINE.test(line) || RE_EXPLANATION.test(line)) { return false }
    return RE_LEADING_CHOICE_LABEL.test(line) || /^[A-Ea-e][.)]\s*/.test(line) || line.length <= 220
  }

  const splitInlineChoices = (line: string): Array<{ label: string; text: string }> => {
    const out: Array<{ label: string; text: string }> = []
    const matches = Array.from(line.matchAll(RE_INLINE_CHOICES))
    for (const m of matches) {
      const label = (m[1] ?? '').toUpperCase()
      const text = (m[2] ?? '').trim()
      if (label && text) {
        out.push({ label, text })
      }
    }
    return out
  }

  while (i < lines.length) {
    const current = lines[i]?.trim() ?? ''
    if (!current) { i++; continue }

    if (!isLikelyQuestion(current)) {
      if (!isLikelyChoice(current)) {
        pendingScenario += `${pendingScenario ? ' ' : ''}${current}`
      }
      i++
      continue
    }

    const stem = current.replace(RE_QUESTION_NUMBER_ONLY, '').trim()
    const scenario = pendingScenario
    pendingScenario = ''
    i++

    const collected: string[] = []
    while (i < lines.length) {
      const next = lines[i]?.trim() ?? ''
      if (!next) { i++; continue }
      if (isLikelyQuestion(next)) { break }
      if (!isLikelyChoice(next)) {
        pendingScenario += `${pendingScenario ? ' ' : ''}${next}`
        i++
        continue
      }
      collected.push(next)
      i++
      if (collected.length >= 8) { break }
    }

    if (collected.length < 2) { continue }

    const choices: Array<{ label: string; text: string; isBold: boolean }> = []
    const labels = ['A', 'B', 'C', 'D', 'E']

    for (const line of collected) {
      const inline = splitInlineChoices(line)
      if (inline.length > 0) {
        for (const c of inline) {
          const n = normalise(c.text)
          choices.push({ label: c.label, text: c.text, isBold: normalizedBold.has(n) })
        }
        continue
      }

      const m = RE_LEADING_CHOICE_LABEL.exec(line)
      if (m !== null) {
        const label = (m[1] ?? '').toUpperCase()
        const text = line.replace(RE_LEADING_CHOICE_LABEL, '').trim()
        const n = normalise(text)
        choices.push({ label, text, isBold: normalizedBold.has(n) })
        continue
      }

      const text = line.trim()
      const idx = choices.length
      const label = labels[idx] ?? 'E'
      const n = normalise(text)
      choices.push({ label, text, isBold: normalizedBold.has(n) })
    }

    if (choices.length < 2) { continue }

    let correct = ''
    const boldChoice = choices.find((c) => c.isBold)
    if (boldChoice) {
      correct = boldChoice.label
    }

    const choiceMap: Record<string, string> = {}
    for (const c of choices.slice(0, 5)) {
      choiceMap[c.label] = c.text
    }

    const parsedForValidation: ParsedBlock = {
      questionText: stem,
      questionType: 'multiple_choice',
      choices: choices.map((c) => ({ label: c.label, text: c.text })),
      correctAnswer: correct,
      explanation: '',
      scenario,
      choiceTexts: new Map<string, string>(),
    }

    const errors = validateLegacyRow(parsedForValidation, correct)
    rows.push({
      _rowIndex: rows.length + 1,
      _valid: errors.length === 0,
      _errors: errors,
      question_text: stem,
      question_type: 'multiple_choice',
      correct_answer: correct,
      option_a: choiceMap['A'] ?? '',
      option_b: choiceMap['B'] ?? '',
      option_c: choiceMap['C'] ?? '',
      option_d: choiceMap['D'] ?? '',
      explanation: '',
      scenario,
      difficulty: 'medium',
      points: defaultPoints,
      exam_id: '',
      program_id: '',
    } satisfies ImportRow)
  }

  return rows
}
