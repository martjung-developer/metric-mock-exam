// lib/utils/admin/results/exportResultsPDF.ts

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { StudentAttemptHistory, StudentSummary, Attempt } from '@/lib/types/admin/exams/results/results.types'
import { fmtDateTime } from './results.utils'

function fmtSeconds(secs: number): string {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}m ${s}s`
}

// Load logo safely
async function loadLogo(doc: jsPDF): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image()
    img.src = '/images/veripraxis-logo.png'
    img.onload = () => {
      doc.addImage(img, 'PNG', 14, 10, 18, 18)
      resolve()
    }
    img.onerror = () => resolve()
  })
}

// Header
function drawHeader(doc: jsPDF) {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text('VERIPRAXIS Assessment System', 36, 16)

  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text('Exam Attempt Report', 36, 22)

  doc.setFontSize(9)

  doc.setDrawColor(200)
  doc.line(14, 30, 196, 30)
}

// Footer
function drawFooter(doc: jsPDF, pageNumber: number) {
  doc.setDrawColor(200)
  doc.line(14, 285, 196, 285)

  doc.setFontSize(9)
  doc.text(`Page ${pageNumber}`, 14, 290)

  doc.text(
    'VERIPRAXIS Assessment System',
    196,
    290,
    { align: 'right' }
  )
}

export async function exportAttemptHistoryPDF(
  histories: StudentAttemptHistory[]
): Promise<void> {
  const doc = new jsPDF()
  const datePart = new Date().toISOString().slice(0, 10)

  await loadLogo(doc)
  drawHeader(doc)

  let yOffset = 36
  let pageNumber = 1

  histories.forEach((h, index) => {
    const student = h.student

    // ── Student Card Header ─────────────────────
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text(
      `${student.full_name} (${student.student_id ?? 'N/A'})`,
      14,
      yOffset
    )

    yOffset += 5

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text(`Email: ${student.email}`, 14, yOffset)

    yOffset += 6

    // ── Table ───────────────────────────────────
    const tableBody = h.attempts.map((attempt) => [
      attempt.attempt_no,
      attempt.score,
      `${attempt.percentage.toFixed(2)}%`,
      attempt.passed ? 'Yes' : 'No',
      attempt.status,
      fmtSeconds(attempt.time_spent_seconds),
      fmtDateTime(attempt.submitted_at),
      attempt.submission_id === h.bestAttempt.submission_id ? 'Best' : '',
    ])

    autoTable(doc, {
      startY: yOffset,
      head: [[
        'Attempt',
        'Score',
        'Percentage',
        'Passed',
        'Status',
        'Time',
        'Submitted',
        'Best',
      ]],
      body: tableBody,
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [52, 73, 94], 
        textColor: 255,
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250],
      },
      margin: { left: 14, right: 14 },
    })

    yOffset = (doc as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? yOffset
    yOffset += 10

    // ── Page Break ──────────────────────────────
    if (yOffset > 260 && index < histories.length - 1) {
      drawFooter(doc, pageNumber)
      doc.addPage()
      pageNumber++

      drawHeader(doc)
      yOffset = 36
    }
  })

  // Final footer
  drawFooter(doc, pageNumber)

  doc.save(`exam-attempt-history-${datePart}.pdf`)
}

export async function exportSingleAttemptPDF(
  student: StudentSummary,
  attempt: Attempt,
): Promise<void> {
  const doc      = new jsPDF()
  const datePart = new Date().toISOString().slice(0, 10)

  await loadLogo(doc)
  drawHeader(doc)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text(`${student.full_name} (${student.student_id ?? 'N/A'})`, 14, 36)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(`Email: ${student.email}`, 14, 41)

  autoTable(doc, {
    startY: 47,
    head:   [['Attempt', 'Score', 'Percentage', 'Passed', 'Status', 'Time', 'Submitted']],
    body:   [[
      attempt.attempt_no,
      attempt.score,
      `${attempt.percentage.toFixed(2)}%`,
      attempt.passed ? 'Yes' : 'No',
      attempt.status,
      fmtSeconds(attempt.time_spent_seconds),
      fmtDateTime(attempt.submitted_at),
    ]],
    styles:            { fontSize: 9, cellPadding: 3 },
    headStyles:        { fillColor: [52, 73, 94], textColor: 255 },
    alternateRowStyles:{ fillColor: [245, 247, 250] },
    margin:            { left: 14, right: 14 },
  })

  drawFooter(doc, 1)
  doc.save(`attempt-${attempt.attempt_no}-${student.full_name.replace(/\s+/g, '-')}-${datePart}.pdf`)
}
