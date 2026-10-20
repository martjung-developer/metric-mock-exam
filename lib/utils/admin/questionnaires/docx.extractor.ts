// lib/utils/admin/questionnaires/docx.extractor.ts
// ─────────────────────────────────────────────────────────────────────────────
// Responsibility: DOCX → HTML + plain text only.
// No parsing logic here — that lives in questionnaires.parsers.ts.
// No business logic — no validation, no DB interaction.
//
// This separation ensures:
//   1. parsers.ts can be tested without file I/O
//   2. extractor.ts can be swapped (e.g. to Pandoc) without touching parsers
// ─────────────────────────────────────────────────────────────────────────────

export interface DocxExtractResult {
  html:      string
  plainText: string
  boldSet:   ReadonlySet<string>
  paragraphs?: Array<{
    level: number | null
    text: string
    boldText: string
  }>
  embeddedImages?: Array<{ fileName: string; dataUrl: string }>
}

export function extractEmbeddedImagesFromHtml(html: string): Array<{ fileName: string; dataUrl: string }> {
  const images: Array<{ fileName: string; dataUrl: string }> = []
  const pattern = /<img\b[^>]*\bsrc=["'](data:image\/[^"']+)["'][^>]*>/gi
  let match = pattern.exec(html)

  while (match !== null) {
    const dataUrl = match[1]
    if (dataUrl) {
      const mimeType = /^data:(image\/[a-z0-9.+-]+);base64,/i.exec(dataUrl)?.[1] ?? 'image/png'
      const extension = mimeType.split('/')[1]?.replace('jpeg', 'jpg').split('+')[0] ?? 'png'
      images.push({ fileName: `embedded-image-${images.length + 1}.${extension}`, dataUrl })
    }
    match = pattern.exec(html)
  }

  return images
}

/**
 * Converts a DOCX File to HTML + plain text via mammoth.
 * Throws on parse failure — caller should catch and surface to user.
 */
export async function extractDocx(file: File): Promise<DocxExtractResult> {
  const mammoth = await import('mammoth')
  const buffer  = await file.arrayBuffer()
  let paragraphs: DocxExtractResult['paragraphs'] = []

  const [htmlResult, textResult] = await Promise.all([
    mammoth.convertToHtml(
      { arrayBuffer: buffer },
      {
        transformDocument: (doc: MammothElement) => {
          paragraphs = collectParagraphs(doc)
          return doc
        },
      },
    ),
    mammoth.extractRawText({ arrayBuffer: buffer }),
  ])

  const boldSet = extractBoldTexts(htmlResult.value)
  const embeddedImages = extractEmbeddedImagesFromHtml(htmlResult.value)

 return {
    html:      htmlResult.value,
    plainText: textResult.value,
    boldSet,
    paragraphs,
    embeddedImages,
  }
}

type MammothElement = {
  type?:      string
  value?:     string
  isBold?:    boolean
  numbering?: { isOrdered: boolean; level: string } | null
  children?:  MammothElement[]
}

function mammothGetText(el: MammothElement): string {
  if (!el) {return ''}
  if (el.value !== undefined) {return el.value}
  if (el.children) {return el.children.map(mammothGetText).join('')}
  return ''
}

function mammothGetBoldText(el: MammothElement): string {
  if (!el) {return ''}
  if (el.type === 'run' && el.isBold) {
    return el.children ? el.children.map(mammothGetText).join('') : ''
  }
  if (el.children) {return el.children.map(mammothGetBoldText).join('')}
  return ''
}

function collectParagraphs(doc: MammothElement): NonNullable<DocxExtractResult['paragraphs']> {
  const result: NonNullable<DocxExtractResult['paragraphs']> = []
  const parseLevel = (level: string): number | null => {
    const parsed = Number.parseInt(level, 10)
    return Number.isNaN(parsed) ? null : parsed
  }

  function walk(el: MammothElement): void {
    if (el.type === 'paragraph') {
      result.push({
        level:    el.numbering?.level ? parseLevel(el.numbering.level) : null,
        boldText: mammothGetBoldText(el).trim(),
        text:     mammothGetText(el).trim(),
      })
    }
    if (el.children) {el.children.forEach(walk)}
  }

  walk(doc)
  return result
}

// ── Bold text extraction ──────────────────────────────────────────────────────
//
// FIX: normalise whitespace and strip nested tags before adding to the set,
// eliminating false-positive partial matches that plagued the old includes()-based
// approach. The parser uses exact Set.has() lookups — no substring matching.

function extractBoldTexts(html: string): ReadonlySet<string> {
  const set = new Set<string>()

  // Match <strong>...</strong> including any nested elements (e.g. <em>)
  const re = /<strong>([\s\S]*?)<\/strong>/g
  let match: RegExpExecArray | null

  while ((match = re.exec(html)) !== null) {
    // Strip any inner HTML tags, then normalise whitespace
    const text = (match[1] ?? '')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim()

    if (text.length > 0) {
      set.add(text)
    }
  }

  return set
}
