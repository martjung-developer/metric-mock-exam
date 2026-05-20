import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'
import type { ImportRow } from '@/lib/types/admin/questionnaires/questionnaires-types'

const MAX_BYTES = 20 * 1024 * 1024
const ALLOWED_EXT = new Set(['doc', 'docx', 'pdf'])

function runPythonParser(filePath: string): Promise<{ rows?: ImportRow[]; issues?: string[]; error?: string }> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(process.cwd(), 'scripts', 'parse_questionnaire.py')
    const proc = spawn('python', [scriptPath, filePath], { cwd: process.cwd() })
    let out = ''
    let err = ''
    proc.stdout.on('data', (d) => { out += String(d) })
    proc.stderr.on('data', (d) => { err += String(d) })
    proc.on('error', reject)
    proc.on('close', (code) => {
      if (code !== 0 && !out.trim()) {
        reject(new Error(err || `Parser exited with code ${code}`))
        return
      }
      try {
        resolve(JSON.parse(out))
      } catch {
        reject(new Error(err || 'Failed to parse parser JSON output'))
      }
    })
  })
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const form = await req.formData()
  const file = form.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 })
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (!ALLOWED_EXT.has(ext)) {
    return NextResponse.json({ error: 'Only .doc, .docx, and .pdf are supported.' }, { status: 415 })
  }
  if (file.size <= 0) {
    return NextResponse.json({ error: 'The uploaded file is empty.' }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File is too large. Maximum is 20 MB.' }, { status: 413 })
  }

  const tmpName = `qp-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const tmpPath = path.join(os.tmpdir(), tmpName)

  try {
    const buf = Buffer.from(await file.arrayBuffer())
    await fs.writeFile(tmpPath, buf)
    const parsed = await runPythonParser(tmpPath)
    if (parsed.error) {
      return NextResponse.json({ error: parsed.error }, { status: 422 })
    }
    const rows = parsed.rows ?? []
    if (rows.length === 0) {
      return NextResponse.json({ error: 'No questions were detected in this file.' }, { status: 422 })
    }
    return NextResponse.json({ rows, issues: parsed.issues ?? [] })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected parser failure.'
    return NextResponse.json({ error: message }, { status: 500 })
  } finally {
    await fs.unlink(tmpPath).catch(() => {})
  }
}

