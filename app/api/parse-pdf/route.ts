import type { NextRequest} from "next/server";
import { NextResponse } from "next/server"
import * as pdfjsLib from "pdfjs-dist"

export async function POST(req: NextRequest) {
  const file = await req.formData()
  const pdfFile = file.get("file") as File

  const buffer = await pdfFile.arrayBuffer()
  const typedarray = new Uint8Array(buffer)

  const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise

  let text = ""

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    text += content.items
      .map((item: unknown) => (typeof item === 'object' && item !== null && 'str' in item ? String((item as { str: string }).str) : ''))
      .join(" ")
  }

  return NextResponse.json({ text })
}
