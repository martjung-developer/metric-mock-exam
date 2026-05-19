// app/api/admin/questionnaires/parse-docx/route.ts
//
// POST /api/admin/questionnaires/parse-docx
//
// Accepts a multipart/form-data upload with a single field named "file"
// containing a .docx binary.  Returns JSON:
//
//   { rows: ImportRow[] }          — on success
//   { error: string }              — on validation / parse failure
//   { error: string, detail: … }   — on unexpected error
//
// WHY THIS EXISTS
// ───────────────
// mammoth.convertToHtml() and mammoth.extractRawText() are synchronous CPU-heavy
// operations that parse the full OOXML ZIP in one shot.  Running them in the
// browser blocks the main thread for 2–10 seconds on realistic exam files
// (150+ questions), causing "page not responding" freezes.
// Moving them here means the browser sends one fetch() and receives JSON rows —
// zero blocking CPU on the client side.
//
// SECURITY
// ────────
// • Only .docx (application/vnd.openxmlformats-officedocument.wordprocessingml.document
//   or application/octet-stream) is accepted.
// • File size is capped at 10 MB.
// • The buffer never touches the filesystem — processed in memory only.
// • Add your own auth guard (session check / middleware) as needed.

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import {
  extractHtml,
  extractRawText,
  parseDocxToRows,
  parseQuestionsFromHtml,
}                                    from '@/lib/utils/admin/questionnaires/docx.parser'
import type { DocxParagraph }        from '@/lib/utils/admin/questionnaires/docx.parser'
import type { DocxExtractResult }    from '@/lib/utils/admin/questionnaires/docx.extractor'
import type { ImportRow }            from '@/lib/types/admin/questionnaires/questionnaires-types'

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const MAX_BYTES        = 10 * 1024 * 1024   // 10 MB
const ALLOWED_TYPES    = new Set([
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/octet-stream',   // some browsers send this for .docx
  'application/zip',            // rare but valid
])

// ─────────────────────────────────────────────────────────────────────────────
// Mammoth extraction — mirrors docx.extractor.ts but runs on the server
// ─────────────────────────────────────────────────────────────────────────────

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
}

function collectBoldStringsFromHtml(html: string): Set<string> {
  const boldSet = new Set<string>()
  const re = /<(?:b|strong)[^>]*>([\s\S]*?)<\/(?:b|strong)>/gi
  let match: RegExpExecArray | null = re.exec(html)
  while (match !== null) {
    const content = decodeHtmlEntities(match[1]?.replace(/<[^>]+>/g, '').trim() ?? '')
    if (content.length > 0) {
      boldSet.add(content)
    }
    match = re.exec(html)
  }
  return boldSet
}

function collectParagraphsFromHtml(html: string): DocxParagraph[] {
  const paragraphs: DocxParagraph[] = []
  const re = /<p[^>]*>([\s\S]*?)<\/p>/gi
  let match: RegExpExecArray | null = re.exec(html)
  while (match !== null) {
    const raw = match[1] ?? ''
    const text = decodeHtmlEntities(raw.replace(/<[^>]+>/g, '').trim())
    const boldText = decodeHtmlEntities(
      raw
        .replace(/<(?!\/?(?:b|strong)\b)[^>]+>/gi, '')
        .replace(/<\/?(?:b|strong)\b[^>]*>/gi, ' ')
        .trim(),
    )

    if (text.length > 0) {
      paragraphs.push({
        level: null,
        boldText,
        text,
      })
    }

    match = re.exec(html)
  }
  return paragraphs
}

async function extractDocx(buffer: Buffer): Promise<DocxExtractResult & { paragraphs: DocxParagraph[] }> {
  let html = ''
  let plainText = ''
  let extractionFailed = false

  try {
    const [htmlValue, rawTextValue] = await Promise.all([
      extractHtml(buffer),
      extractRawText(buffer),
    ])
    html = htmlValue
    plainText = rawTextValue.trim().length > 0 ? rawTextValue : parseQuestionsFromHtml(htmlValue)
  } catch {
    extractionFailed = true
    try {
      html = await extractHtml(buffer)
      plainText = parseQuestionsFromHtml(html)
      extractionFailed = false
    } catch {
      html = ''
    }
    if (extractionFailed) {
      try {
        plainText = await extractRawText(buffer)
        html = `<p>${plainText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`
        extractionFailed = false
      } catch {
        extractionFailed = true
      }
    }
  }

  if (extractionFailed) {
    throw new Error('mammoth extraction failed')
  }

  const boldSet = collectBoldStringsFromHtml(html)
  const paragraphs = collectParagraphsFromHtml(html)

  return { html, plainText, boldSet, paragraphs }
}

// ─────────────────────────────────────────────────────────────────────────────
// Route handler
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  // ── 1. Parse multipart form ───────────────────────────────────────────────
  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Request must be multipart/form-data.' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file uploaded. Send the .docx as a field named "file".' }, { status: 400 })
  }

  // ── 2. Validate type & size ───────────────────────────────────────────────
  const ext = file.name.split('.').pop()?.toLowerCase()
  if (ext !== 'docx') {
    return NextResponse.json({ error: 'Only .docx files are supported.' }, { status: 415 })
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is 10 MB.` },
      { status: 413 },
    )
  }

  if (file.size === 0) {
    return NextResponse.json({ error: 'The uploaded file is empty.' }, { status: 400 })
  }

  // Browsers sometimes lie about MIME type for .docx, so only log — don't reject.
  if (file.type && !ALLOWED_TYPES.has(file.type)) {
    console.warn('[parse-docx] Unexpected MIME type:', file.type, '— continuing anyway.')
  }

  // ── 3. Extract ────────────────────────────────────────────────────────────
  let buffer: Buffer
  try {
    buffer = Buffer.from(await file.arrayBuffer())
  } catch (err) {
    console.error('[parse-docx] Failed to read file buffer:', err)
    return NextResponse.json({ error: 'Could not read the uploaded file.' }, { status: 500 })
  }

  let extracted: Awaited<ReturnType<typeof extractDocx>>
  try {
    extracted = await extractDocx(buffer)
  } catch (err) {
    console.error('[parse-docx] mammoth extraction failed:', err)
    return NextResponse.json(
      { error: 'Failed to parse the DOCX file. Make sure it is a valid .docx (not .doc).' },
      { status: 422 },
    )
  }

  // ── 4. Parse into rows ────────────────────────────────────────────────────
  let rows: ImportRow[]
  try {
    // defaultPoints comes from an optional form field so callers can pass it
    const defaultPointsRaw = formData.get('defaultPoints')
    const defaultPoints    = defaultPointsRaw !== null && defaultPointsRaw !== undefined ? Number(defaultPointsRaw) : 1

    rows = parseDocxToRows(extracted, isFinite(defaultPoints) ? defaultPoints : 1)
  } catch (err) {
    console.error('[parse-docx] parseDocxToRows threw:', err)
    return NextResponse.json(
      { error: 'Parsing failed unexpectedly. Please check your file format.' },
      { status: 500 },
    )
  }

  if (rows.length === 0) {
    return NextResponse.json(
      { error: 'No questions were found in this file. Check the formatting guide.' },
      { status: 422 },
    )
  }

  // ── 5. Return rows ────────────────────────────────────────────────────────
  return NextResponse.json({ rows })
}
