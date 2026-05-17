// app/api/admin/questionnaires/parse-docx/route.ts
//
// POST /api/admin/questionnaires/parse-docx
// Accepts multipart/form-data with a "file" field (.docx).
// Returns { rows: ImportRow[] } on success, { error: string } on failure.
//
// Runs mammoth server-side so the browser main thread is never blocked.

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import mammoth                       from 'mammoth'

import { parseDocxToRows }        from '@/lib/utils/admin/questionnaires/docx.parser'
import type { DocxExtractResult } from '@/lib/utils/admin/questionnaires/docx.extractor'
import type { DocxParagraph }     from '@/lib/utils/admin/questionnaires/docx.parser'

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const MAX_BYTES = 20 * 1024 * 1024  // 20 MB — matches the UI hint

// ─────────────────────────────────────────────────────────────────────────────
// Mammoth element type (internal)
// ─────────────────────────────────────────────────────────────────────────────

type MammothEl = {
  type?:      string
  value?:     string
  isBold?:    boolean
  numbering?: { isOrdered: boolean; level: string } | null
  children?:  MammothEl[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Tree-walk helpers (same logic as docx.extractor.ts / docx.parser.ts)
// ─────────────────────────────────────────────────────────────────────────────

function getText(el: MammothEl): string {
  if (el.value !== undefined) { return el.value }
  return (el.children ?? []).map(getText).join('')
}

function getBoldText(el: MammothEl): string {
  if (el.type === 'run' && el.isBold) {
    return (el.children ?? []).map(getText).join('')
  }
  return (el.children ?? []).map(getBoldText).join('')
}

function collectParagraphs(root: MammothEl): DocxParagraph[] {
  const out: DocxParagraph[] = []
  function walk(el: MammothEl): void {
    if (el.type === 'paragraph') {
      out.push({
        level:    el.numbering !== null
                    ? parseInt(el.numbering.level, 10)
                    : null,
        boldText: getBoldText(el).trim(),
        text:     getText(el).trim(),
      })
    }
    for (const child of el.children ?? []) { walk(child) }
  }
  walk(root)
  return out
}

function collectBoldSet(root: MammothEl): Set<string> {
  const set = new Set<string>()
  function walk(el: MammothEl): void {
    if (el.type === 'run' && el.isBold) {
      const t = (el.children ?? []).map(getText).join('').trim()
      if (t.length > 0) { set.add(t) }
    }
    for (const child of el.children ?? []) { walk(child) }
  }
  walk(root)
  return set
}

// ─────────────────────────────────────────────────────────────────────────────
// Extraction using mammoth 1.12.0 API
//
// mammoth 1.12.0 correct methods:
//   mammoth.convertToHtml({ buffer }, options)  — options.transformDocument
//   mammoth.extractRawText({ buffer })
//
// mammoth.convertToRaw does NOT exist — do not use it.
// ─────────────────────────────────────────────────────────────────────────────

async function extractFromBuffer(
  buffer: Buffer,
): Promise<DocxExtractResult & { paragraphs: DocxParagraph[] }> {
  let paragraphs: DocxParagraph[] = []
  let boldSet    = new Set<string>()

  // convertToHtml + transformDocument gives us the AST in one pass,
  // so we don't need a separate convertToRaw call.
  const [htmlResult, textResult] = await Promise.all([
    mammoth.convertToHtml(
      { buffer },
      {
        transformDocument(doc: MammothEl) {
          paragraphs = collectParagraphs(doc)
          boldSet    = collectBoldSet(doc)
          return doc
        },
      },
    ),
    mammoth.extractRawText({ buffer }),
  ])

  return {
    html:      htmlResult.value,
    plainText: textResult.value,
    boldSet,
    paragraphs,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Route handler
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  // ── 1. Parse multipart ────────────────────────────────────────────────────
  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json(
      { error: 'Request must be multipart/form-data.' },
      { status: 400 },
    )
  }

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: 'No file found. Send the .docx as a field named "file".' },
      { status: 400 },
    )
  }

  // ── 2. Validate ───────────────────────────────────────────────────────────
  const ext = file.name.split('.').pop()?.toLowerCase()
  if (ext !== 'docx' && ext !== 'doc') {
    return NextResponse.json(
      { error: 'Only .docx or .doc files are supported.' },
      { status: 415 },
    )
  }

  if (file.size === 0) {
    return NextResponse.json(
      { error: 'The uploaded file is empty.' },
      { status: 400 },
    )
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max is 20 MB.` },
      { status: 413 },
    )
  }

  // ── 3. Read buffer ────────────────────────────────────────────────────────
  let buffer: Buffer
  try {
    buffer = Buffer.from(await file.arrayBuffer())
  } catch (err) {
    console.error('[parse-docx] buffer read failed:', err)
    return NextResponse.json(
      { error: 'Could not read the uploaded file.' },
      { status: 500 },
    )
  }

  // ── 4. Extract — mammoth runs here in Node, never in the browser ──────────
  let extracted: Awaited<ReturnType<typeof extractFromBuffer>>
  try {
    extracted = await extractFromBuffer(buffer)
  } catch (err) {
    console.error('[parse-docx] mammoth failed:', err)
    return NextResponse.json(
      { error: 'Could not parse this file. Make sure it is a valid .docx file.' },
      { status: 422 },
    )
  }

  // ── 5. Parse into ImportRow[] ─────────────────────────────────────────────
  let rows: ReturnType<typeof parseDocxToRows>
  try {
    const raw           = formData.get('defaultPoints')
    const defaultPoints = Number(raw)
    rows = parseDocxToRows(
      extracted,
      isFinite(defaultPoints) && defaultPoints > 0 ? defaultPoints : 1,
    )
  } catch (err) {
    console.error('[parse-docx] parseDocxToRows failed:', err)
    return NextResponse.json(
      { error: 'Parsing failed unexpectedly. Please check your file format.' },
      { status: 500 },
    )
  }

  if (rows.length === 0) {
    return NextResponse.json(
      { error: 'No questions were detected. Make sure questions are numbered and answer choices are listed below each one.' },
      { status: 422 },
    )
  }

  // ── 6. Return ─────────────────────────────────────────────────────────────
  return NextResponse.json({ rows })
}