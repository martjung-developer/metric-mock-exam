// lib/utils/admin/results/exportResultsCSV.ts
// ─────────────────────────────────────────────────────────────────────────────

import type { Result, StudentAttemptHistory, StudentSummary, Attempt } from '@/lib/types/admin/exams/results/results.types'
import { fmtDateTime } from './results.utils'

// ── Internal helpers ──────────────────────────────────────────────────────────

function escapeCsvCell(value: string | number | boolean | null | undefined): string {
  const str = value === null || value === undefined ? '' : String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function buildCsvString(rows: (string | number | boolean | null | undefined)[][]): string {
  return rows
    .map((row) => row.map(escapeCsvCell).join(','))
    .join('\n')
}

function triggerDownload(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function fmtSeconds(secs: number): string {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}m ${s}s`
}

// ── exportResultsCSV (original — unchanged behaviour) ─────────────────────────

export function exportResultsCSV(results: Result[]): void {
  const header = [
    'Rank',
    'Student Name',
    'Email',
    'Student ID',
    'Score',
    'Percentage',
    'Passed',
    'Status',
    'Time Spent',
    'Submitted At',
  ]

  const dataRows = results.map((r, i) => [
    i + 1,
    r.student.full_name,
    r.student.email,
    r.student.student_id ?? '',
    r.score,
    r.percentage.toFixed(2),
    r.passed ? 'Yes' : 'No',
    r.status,
    fmtSeconds(r.time_spent_seconds),
    fmtDateTime(r.submitted_at),
  ])

  const csv      = buildCsvString([header, ...dataRows])
  const datePart = new Date().toISOString().slice(0, 10)
  triggerDownload(csv, `exam-results-${datePart}.csv`)
}

// ── exportAttemptHistoryCSV (new) ─────────────────────────────────────────────
// Flattens all attempts: each attempt = one CSV row.
// Students are ordered by best score descending (mirrors the results table).
// Within a student, attempts are ordered by attempt_no ascending.

export function exportAttemptHistoryCSV(histories: StudentAttemptHistory[]): void {
  const header = [
    'Student Name',
    'Email',
    'Student ID',
    'Attempt No',
    'Score',
    'Percentage',
    'Passed',
    'Status',
    'Time Spent',
    'Submitted At',
    'Is Best Attempt',
  ]

  const dataRows = histories.flatMap((h) =>
    h.attempts.map((attempt) => [
      h.student.full_name,
      h.student.email,
      h.student.student_id ?? '',
      attempt.attempt_no,
      attempt.score,
      attempt.percentage.toFixed(2),
      attempt.passed  ? 'Yes' : 'No',
      attempt.status,
      fmtSeconds(attempt.time_spent_seconds),
      fmtDateTime(attempt.submitted_at),
      attempt.submission_id === h.bestAttempt.submission_id ? 'Yes' : 'No',
    ]),
  )

  const csv      = buildCsvString([header, ...dataRows])
  const datePart = new Date().toISOString().slice(0, 10)
  triggerDownload(csv, `exam-attempt-history-${datePart}.csv`)
}

export function exportSingleAttemptCSV(
  student: StudentSummary,
  attempt: Attempt,
): void {
  const header = [
    'Student Name', 'Email', 'Student ID',
    'Attempt No', 'Score', 'Percentage',
    'Passed', 'Status', 'Time Spent', 'Submitted At',
  ]
  const row = [
    student.full_name,
    student.email,
    student.student_id ?? '',
    attempt.attempt_no,
    attempt.score,
    attempt.percentage.toFixed(2),
    attempt.passed ? 'Yes' : 'No',
    attempt.status,
    fmtSeconds(attempt.time_spent_seconds),
    fmtDateTime(attempt.submitted_at),
  ]
  const csv      = buildCsvString([header, row])
  const datePart = new Date().toISOString().slice(0, 10)
  triggerDownload(csv, `attempt-${attempt.attempt_no}-${student.full_name.replace(/\s+/g, '-')}-${datePart}.csv`)
}
