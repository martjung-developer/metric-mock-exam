// lib/utils/admin/questionnaires/questionnaires.parsers.ts

import type {
  ImportRow,
  LinkSource,
  LinkDetectResult,
  DifficultyLevel,
} from '@/lib/types/admin/questionnaires/questionnaires-types'
import type { QuestionType } from '@/lib/types/database'

import { extractDocx }     from './docx.extractor'
import { parseDocxToRows } from './docx.parser'

// ─────────────────────────────────────────────────────────────────────────────
// Link source detection
// ─────────────────────────────────────────────────────────────────────────────
export function detectLinkSource(url: string): LinkDetectResult {
  if (!url.trim()) {
    return { source: 'custom_url', valid: false, hint: '' }
  }

  if (url.includes('docs.google.com/spreadsheets')) {
    return { source: 'google_drive', valid: true, hint: 'Google Sheets — will export as CSV' }
  }

  if (url.includes('docs.google.com/forms')) {
    return {
      source: 'google_forms',
      valid:  false,
      hint:   'Google Forms is not supported. Download responses as CSV first.',
    }
  }

  if (/\.csv(\?|$)/i.test(url)) {
    return { source: 'custom_url', valid: true, hint: 'CSV URL' }
  }

  if (/\.xlsx?(\?|$)/i.test(url)) {
    return { source: 'custom_url', valid: true, hint: 'Spreadsheet URL' }
  }

  return { source: 'custom_url', valid: false, hint: 'Unsupported link type' }
}

// ─────────────────────────────────────────────────────────────────────────────
// Link fetcher
// ─────────────────────────────────────────────────────────────────────────────

export async function fetchAndParseLink(
  url:    string,
  source: LinkSource,
): Promise<ImportRow[]> {
  const fetchUrl = source === 'google_drive' ? toGoogleSheetsCsvUrl(url) : url

  const response = await fetch(fetchUrl)
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} — could not fetch ${fetchUrl}`)
  }

  const contentType = response.headers.get('content-type') ?? ''

  if (
    contentType.includes('spreadsheetml') ||
    contentType.includes('octet-stream') ||
    /\.xlsx?$/i.test(url)
  ) {
    const buffer = await response.arrayBuffer()
    return parseXlsxBuffer(buffer)
  }

  return parseCsvText(await response.text())
}

function toGoogleSheetsCsvUrl(url: string): string {
  if (url.includes('export?format=csv') || url.includes('tqx=out:csv')) {return url}
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/)
  if (!match?.[1]) {throw new Error('Could not extract Google Sheets ID from URL.')}
  return `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv`
}

// ─────────────────────────────────────────────────────────────────────────────
// Primary entry point
// ─────────────────────────────────────────────────────────────────────────────

export async function parseFile(file: File): Promise<ImportRow[]> {
  const ext = getExtension(file.name)

  switch (ext) {
    case 'csv':               return parseCsvFile(file)
    case 'xlsx': case 'xls':  return parseXlsxFile(file)
    case 'docx': case 'doc':  return parseDocxFile(file)
    case 'pdf':               return parsePdfFile(file)
    default:
      throw new Error(
        `Unsupported file type ".${ext}". ` +
        'Please upload a CSV, XLSX, DOCX, or PDF file.',
      )
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DOCX
// ─────────────────────────────────────────────────────────────────────────────

async function parseDocxFile(file: File): Promise<ImportRow[]> {
  const extracted = await extractDocx(file)

  if (!extracted.plainText.trim() && !extracted.html.trim()) {
    throw new Error(
      'The DOCX file appears to be empty or could not be read. ' +
      'Make sure it is not password-protected.',
    )
  }

  const rows = parseDocxToRows(extracted)
  if (rows.length === 0) {
    throw new Error(
      'No question blocks were detected in the DOCX file. ' +
      'Ensure each question has clear answer choices (list or numbered format) ' +
      'and bold the correct answer choice.',
    )
  }
  return rows
}

// ─────────────────────────────────────────────────────────────────────────────
// CSV
// ─────────────────────────────────────────────────────────────────────────────

async function parseCsvFile(file: File): Promise<ImportRow[]> {
  return parseCsvText(await file.text())
}

export function parseCsvText(text: string): ImportRow[] {
  const rows = parseCsvRows(text)
  if (rows.length === 0) {return []}
  return csvRowsToImportRows(rows)
}

// ─────────────────────────────────────────────────────────────────────────────
// Inline RFC-4180 CSV parser — no papaparse dependency
// ─────────────────────────────────────────────────────────────────────────────

function parseCsvRows(csv: string): Record<string, string>[] {
  // Normalise line endings, split into lines for header extraction
  const normalised = csv.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  // Tokenise the entire CSV as a flat list of fields, tracking row boundaries
  const allRows: string[][] = []
  let currentRow: string[]  = []
  let pos = 0
  const len = normalised.length

  while (pos < len) {
    if (currentRow.length === 0 && normalised[pos] === '\n') {
      pos++
      continue
    }

    if (normalised[pos] === '"') {
      pos++ 
      let field = ''
      while (pos < len) {
        if (normalised[pos] === '"') {
          if (pos + 1 < len && normalised[pos + 1] === '"') {
            field += '"'
            pos += 2
          } else {
            pos++ 
            break
          }
        } else {
          field += normalised[pos]
          pos++
        }
      }
      currentRow.push(field)
      if (pos < len && normalised[pos] === ',') {pos++}
      else if (pos < len && normalised[pos] === '\n') {
        allRows.push(currentRow)
        currentRow = []
        pos++
      }
    } else {
      let field = ''
      while (pos < len && normalised[pos] !== ',' && normalised[pos] !== '\n') {
        field += normalised[pos]
        pos++
      }
      currentRow.push(field.trim())
      if (pos < len && normalised[pos] === ',') {pos++}
      else if (pos < len && normalised[pos] === '\n') {
        allRows.push(currentRow)
        currentRow = []
        pos++
      }
    }
  }

  if (currentRow.length > 0) {allRows.push(currentRow)}

  if (allRows.length < 2) {return []}   // no data rows

  const headers = (allRows[0] ?? []).map((h) => h.trim().toLowerCase().replace(/\s+/g, '_'))

  return allRows.slice(1).map((fields) => {
    const record: Record<string, string> = {}
    headers.forEach((h, i) => {
      record[h] = fields[i]?.trim() ?? ''
    })
    return record
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// XLSX
// ─────────────────────────────────────────────────────────────────────────────

async function parseXlsxFile(file: File): Promise<ImportRow[]> {
  return parseXlsxBuffer(await file.arrayBuffer())
}

async function parseXlsxBuffer(buffer: ArrayBuffer): Promise<ImportRow[]> {
  const XLSX = await import('xlsx')
  const wb   = XLSX.read(buffer, { type: 'array' })

  const sheetName = wb.SheetNames[0]
  if (!sheetName) {throw new Error('The spreadsheet has no sheets.')}
  const ws = wb.Sheets[sheetName]
  if (!ws)  {throw new Error('Could not read the first sheet.')}

  const raw = XLSX.utils.sheet_to_json<Record<string, string | number | boolean | null>>(ws, {
    defval: '',
    raw: false,
  })

  const normalised = raw.map((row) => {
    const out: Record<string, string> = {}
    for (const [k, v] of Object.entries(row)) {
      out[k.trim().toLowerCase().replace(/\s+/g, '_')] = String(v)
    }
    return out
  })

  return csvRowsToImportRows(normalised)
}

// ─────────────────────────────────────────────────────────────────────────────
// PDF
// ─────────────────────────────────────────────────────────────────────────────

async function parsePdfFile(file: File): Promise<ImportRow[]> {
  const pdfjsLib = await import('pdfjs-dist')
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'

  const buffer = await file.arrayBuffer()
  const pdf    = await pdfjsLib.getDocument({ data: buffer }).promise

  const pages: string[] = []
  for (let p = 1; p <= pdf.numPages; p++) {
    const page    = await pdf.getPage(p)
    const content = await page.getTextContent()
    pages.push(content.items.map((item) => ('str' in item ? item.str : '')).join(' '))
  }

  const rows = parseDocxToRows({
    html:      '',
    plainText: pages.join('\n'),
    boldSet:   new Set<string>(),
  })

  if (rows.length === 0) {
    throw new Error(
      'No question blocks were detected in the PDF. ' +
      'Ensure questions use numbered format (e.g. "1. Which…").',
    )
  }
  return rows
}

// ─────────────────────────────────────────────────────────────────────────────
// Row normaliser
// ─────────────────────────────────────────────────────────────────────────────

function csvRowsToImportRows(raw: Record<string, string>[]): ImportRow[] {
  return raw.map((row, i) => {
    const errors: string[] = []
    const rowIdx = i + 2

    const questionText  = col(row, 'question_text')
    const questionType  = coerceQuestionType(col(row, 'question_type', 'type'))
    const correctAnswer = col(row, 'correct_answer', 'answer')
    const optionA       = col(row, 'option_a', 'a')
    const optionB       = col(row, 'option_b', 'b')
    const optionC       = col(row, 'option_c', 'c')
    const optionD       = col(row, 'option_d', 'd')
    const explanation   = col(row, 'explanation', 'rationale')
    const scenario      = col(row, 'scenario')
    const image         = col(row, 'image', 'image_filename', 'image_url').trim()
    const sectionTitle  = col(row, 'section_title', 'section')              
    const sectionNumberRaw = col(row, 'section_number')                     
    const difficulty    = coerceDifficulty(col(row, 'difficulty') || 'medium')
    const points        = coercePoints(row['points'])

    if (!questionText) {errors.push('question_text is empty')}
    if (questionType === 'multiple_choice' && !optionA && !optionB) {
      errors.push('Multiple choice requires at least option_a and option_b')
    }
    if (questionType === 'multiple_choice' && !correctAnswer) {
      errors.push('correct_answer is missing')
    }

    const parsedSectionNumber = Number(sectionNumberRaw)
    const sectionNumber = sectionNumberRaw && Number.isFinite(parsedSectionNumber)
      ? Math.round(parsedSectionNumber)
      : undefined

    return {
      _rowIndex:      rowIdx,
      _valid:         errors.length === 0,
      _errors:        errors,
      question_text:  questionText,
      question_type:  questionType,
      correct_answer: correctAnswer,
      option_a:       optionA,
      option_b:       optionB,
      option_c:       optionC,
      option_d:       optionD,
      explanation,
      scenario,
      image,                                    
      section_title:  sectionTitle || undefined,   
      section_number: sectionNumber,                
      difficulty,
      points,
      exam_id:        '',
      program_id:     '',
    } satisfies ImportRow
  })
}

function col(row: Record<string, string>, ...keys: string[]): string {
  for (const k of keys) {
    const v = row[k]
    if (v !== undefined && String(v).trim() !== '') {return String(v).trim()}
  }
  return ''
}

// ── QuestionType ──────────────────────────────────────────────────────────────

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

function coerceQuestionType(raw: string): QuestionType {
  const n = raw.toLowerCase().replace(/[^a-z_]/g, '')
  if (isQuestionType(n)) {return n}
  if (['mcq', 'mc', 'multiplechoice'].includes(n)) {return 'multiple_choice'}
  if (['tf', 'truefalse', 'boolean'].includes(n))  {return 'true_false'}
  if (['short', 'sa'].includes(n))                 {return 'short_answer'}
  if (['fill', 'blank', 'fillblank'].includes(n))  {return 'fill_blank'}
  return 'multiple_choice'
}

// ── DifficultyLevel ───────────────────────────────────────────────────────────

const VALID_DIFFICULTIES: readonly DifficultyLevel[] = ['easy', 'medium', 'hard']

function isDifficulty(s: string): s is DifficultyLevel {
  return VALID_DIFFICULTIES.some((item) => item === s)
}

function coerceDifficulty(raw: string): DifficultyLevel {
  const normalised = raw.toLowerCase()
  if (isDifficulty(normalised)) {return normalised}
  return 'medium'
}

// ── Points ────────────────────────────────────────────────────────────────────

function coercePoints(raw: string | undefined): number {
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? Math.round(n) : 1
}

// ── Extension ─────────────────────────────────────────────────────────────────

function getExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() ?? ''
}
