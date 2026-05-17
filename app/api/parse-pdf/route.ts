// app/api/parse-pdf/route.ts
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import * as pdfjsLib from "pdfjs-dist"
import { extractDocx } from "@/lib/utils/admin/questionnaires/docx.extractor"
import { parseDocxToRows } from "@/lib/utils/admin/questionnaires/docx.parser"

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const uploadedFile = formData.get("file") as File

  if (!uploadedFile) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
  }

  const fileName = uploadedFile.name.toLowerCase()

  // ── DOCX path ──────────────────────────────────────────────────────────────
  if (fileName.endsWith(".docx")) {
    const extracted = await extractDocx(uploadedFile)
    const rows = parseDocxToRows(extracted)
    return NextResponse.json({ rows })
  }

  // ── PDF path (original) ────────────────────────────────────────────────────
  const buffer = await uploadedFile.arrayBuffer()
  const typedarray = new Uint8Array(buffer)
  const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise

  let text = ""
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    text += content.items
      .map((item: unknown) =>
        typeof item === "object" && item !== null && "str" in item
          ? String((item as { str: string }).str)
          : ""
      )
      .join(" ")
  }

  return NextResponse.json({ text })
}