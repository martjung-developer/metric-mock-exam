// app/api/parse-pdf/route.ts
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { extractDocx } from "@/lib/utils/admin/questionnaires/docx.extractor"
import { parseDocxToRows } from "@/lib/utils/admin/questionnaires/docx.parser"

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const uploadedFile = formData.get("file") as File

  if (!uploadedFile) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
  }

  const fileName = uploadedFile.name.toLowerCase()

  if (fileName.endsWith(".docx")) {
    const extracted = await extractDocx(uploadedFile)
    const rows = parseDocxToRows(extracted)
    return NextResponse.json({ rows })
  }

  // PDF temporarily disabled
  return NextResponse.json(
    { error: "PDF parsing not supported. Please upload a DOCX file." },
    { status: 400 }
  )
}