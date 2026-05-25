import { useEffect, useMemo, useState } from 'react'
import {
  X,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Submission } from '@/lib/types/admin/exams/submissions/submission.types'
import type { ExamInfo, PreviewScore } from '@/lib/types/admin/exams/submissions/exam.types'
import type { GradingMode } from '@/lib/types/admin/exams/submissions/submission.types'
import { fmtDate, initials } from '@/lib/utils/admin/submissions/format'
import { SubmissionQuestionCard } from './SubmissionQuestionCard'
import css from './GradingModal.module.css'

interface QuestionModalRow {
  id: string
  question_text: string
  scenario: string | null
  options: Array<{ label: string; text: string }> | null
  rawOptions: unknown
  correct_answer: string | null
  points: number
  order_number: number | null
}

interface AnswerModalRow {
  question_id: string
  answer_text: string | null
  is_correct: boolean | null
  points_earned: number | null
}

interface RenderQuestionRow {
  question: QuestionModalRow
  studentAnswer: AnswerModalRow | null
}

interface ViewSubmissionModalProps {
  examId: string
  mode: 'grade' | 'view'
  target: Submission
  previewScore: PreviewScore | null
  examInfo: ExamInfo | null
  gradingMode: GradingMode
  gradingSubmission: boolean
  onClose: () => void
  onGrade: () => void
}

function parseOptions(raw: unknown): Array<{ label: string; text: string }> | null {
  // Accept serialized JSON as well.
  if (typeof raw === 'string') {
    try {
      return parseOptions(JSON.parse(raw))
    } catch {
      return null
    }
  }

  // Canonical shape: [{ label, text }, ...]
  if (Array.isArray(raw)) {
    const parsed = raw
      .map((row) => {
        if (typeof row !== 'object' || row === null) {return null}
        const obj = row as Record<string, unknown>
        const label = typeof obj.label === 'string' ? obj.label : null
        const text =
          typeof obj.text === 'string' ? obj.text :
            typeof obj.option_text === 'string' ? obj.option_text :
              typeof obj.value === 'string' ? obj.value :
                typeof obj.content === 'string' ? obj.content :
                  null
        if (!label || !text) {return null}
        return { label, text }
      })
      .filter((row): row is { label: string; text: string } => row !== null)
    if (parsed.length > 0) {return parsed}
  }

  // Alternate shape: { A: "option", B: "option", ... }
  if (typeof raw === 'object' && raw !== null) {
    const obj = raw as Record<string, unknown>
    const labels = ['A', 'B', 'C', 'D', 'E', 'F']
    const mapped = labels
      .map((label) => {
        const value = obj[label]
        return typeof value === 'string' ? { label, text: value } : null
      })
      .filter((row): row is { label: string; text: string } => row !== null)
    if (mapped.length > 0) {return mapped}
  }

  return null
}

function resolveCorrectLabel(
  correctAnswer: string | null,
  options: Array<{ label: string; text: string }> | null,
): string | null {
  if (!correctAnswer) {return null}
  if (!options) {return correctAnswer}
  const byLabel = options.find((o) => o.label.toLowerCase() === correctAnswer.toLowerCase())
  if (byLabel) {return byLabel.label}
  const byText = options.find((o) => o.text.toLowerCase() === correctAnswer.toLowerCase())
  return byText?.label ?? correctAnswer
}

function getStatusBadgeClass(status: Submission['status']): string {
  if (status === 'released') {return css.statusReleased}
  if (status === 'reviewed') {return css.statusReviewed}
  if (status === 'graded') {return css.statusGraded}
  if (status === 'submitted') {return css.statusSubmitted}
  return css.statusInProgress
}

export function ViewSubmissionModal({
  examId,
  mode,
  target,
  previewScore,
  examInfo,
  gradingMode,
  gradingSubmission,
  onClose,
  onGrade,
}: ViewSubmissionModalProps) {
  const supabase = useMemo(() => createClient(), [])
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<RenderQuestionRow[]>([])

  useEffect(() => {
    let cancelled = false

    async function loadModalData() {
      setLoading(true)

      const { data: questions } = await supabase
        .from('questions')
        .select('id, question_text, scenario, options, correct_answer, points, order_number')
        .eq('exam_id', examId)
        .order('order_number', { ascending: true })

      const { data: answers } = await supabase
        .from('answers')
        .select('question_id, answer_text, is_correct, points_earned')
        .eq('submission_id', target.id)

      if (cancelled) {return}

      const questionRows: QuestionModalRow[] = (questions ?? []).map((q) => ({
        id: q.id,
        question_text: (
          (typeof q.question_text === 'string' ? q.question_text : '') ||
          (typeof (q as Record<string, unknown>).stem === 'string' ? String((q as Record<string, unknown>).stem) : '') ||
          (typeof (q as Record<string, unknown>).text === 'string' ? String((q as Record<string, unknown>).text) : '')
        ).trim() || 'Question text unavailable',
        scenario: q.scenario,
        options: parseOptions(q.options),
        rawOptions: q.options,
        correct_answer: q.correct_answer,
        points: q.points ?? 1,
        order_number: q.order_number,
      }))

      const answerMap = new Map<string, AnswerModalRow>(
        (answers ?? []).map((a) => [
          a.question_id,
          {
            question_id: a.question_id,
            answer_text: a.answer_text,
            is_correct: a.is_correct,
            points_earned: a.points_earned,
          },
        ]),
      )

      const merged: RenderQuestionRow[] = questionRows.map((question) => ({
        question,
        studentAnswer: answerMap.get(question.id) ?? null,
      }))

      setRows(merged)
      setLoading(false)
    }

    void loadModalData()
    return () => { cancelled = true }
  }, [examId, supabase, target.id])

  const modalStats = useMemo(() => {
    let correct = 0
    let wrong = 0
    let pending = 0
    let earned = 0
    let total = 0

    rows.forEach(({ question, studentAnswer }) => {
      total += question.points
      if (!studentAnswer || !studentAnswer.answer_text) {
        pending += 1
        return
      }

      const correctLabel = resolveCorrectLabel(question.correct_answer, question.options)
      const isCorrect = correctLabel !== null &&
        studentAnswer.answer_text.toLowerCase() === correctLabel.toLowerCase()

      if (isCorrect) {
        correct += 1
        earned += question.points
      } else {
        wrong += 1
      }
    })

    const pct = total > 0 ? (earned / total) * 100 : 0
    const passing = Number(examInfo?.passing_score ?? 0)
    const passed = pct >= passing
    return { correct, wrong, pending, totalQuestions: rows.length, earned, total, pct, passed }
  }, [rows, examInfo?.passing_score])

  const displayPct = previewScore?.pct ?? modalStats.pct
  const displayPassed = previewScore?.passed ?? modalStats.passed
  const canGrade = mode === 'grade' && ['submitted', 'graded', 'reviewed'].includes(target.status)
  const statusLabel = target.status.replace('_', ' ').toUpperCase()

  return (
    <div className={css.overlay} onClick={(e) => { if (e.target === e.currentTarget) {onClose()} }}>
      <div className={css.modal}>
        <div className={css.header}>
          <div className={css.avatar}>{initials(target.student.full_name)}</div>
          <div className={css.studentInfo}>
            <p className={css.studentName}>{target.student.full_name}</p>
            <div className={css.studentMeta}>
              <span>{target.student.email}</span>
              <span className={css.studentIdBadge}>{target.student.student_id ?? '—'}</span>
            </div>
          </div>
          <div className={css.badges}>
            <span className={displayPassed ? css.scoreBadgePass : css.scoreBadgeFail}>
              {displayPct.toFixed(1)}% · {displayPassed ? 'PASS' : 'FAIL'}
            </span>
            <span className={`${css.statusBadge} ${getStatusBadgeClass(target.status)}`}>{statusLabel}</span>
          </div>
          <button className={css.closeBtn} onClick={onClose} aria-label="Close modal">
            <X size={16} />
          </button>
        </div>

        <div className={css.summaryBar}>
          <div className={`${css.summaryItem} ${css.summaryCorrect}`}>
            <CheckCircle2 size={16} /> {modalStats.correct} correct
          </div>
          <div className={`${css.summaryItem} ${css.summaryWrong}`}>
            <XCircle size={16} /> {modalStats.wrong} wrong
          </div>
          <div className={`${css.summaryItem} ${css.summaryPending}`}>
            <Clock size={16} /> {modalStats.pending} pending/unanswered
          </div>
          <div className={`${css.summaryItem} ${css.summaryTotal}`}>
            Total: {modalStats.totalQuestions} questions
          </div>
          <div className={css.autoModeToggle}>
            {gradingMode === 'auto' ? 'Auto mode' : 'Manual mode'}
          </div>
        </div>

        <div className={css.questionList}>
          <div style={{ fontSize: 12, color: '#334155', fontWeight: 700 }}>
            Modal Render v2 · Questions Loaded: {rows.length}
          </div>
          {loading ? (
            <div className={css.summaryTotal}><Loader2 size={16} /> Loading questions...</div>
          ) : rows.map(({ question, studentAnswer }, index) => {
            const correctLabel = resolveCorrectLabel(question.correct_answer, question.options)
            const studentRaw = studentAnswer?.answer_text ?? null
            const studentLabel = (() => {
              if (!studentRaw) {return null}
              const trimmed = studentRaw.trim()
              if (!trimmed) {return null}
              const byLabel = (question.options ?? []).find((opt) => opt.label.toLowerCase() === trimmed.toLowerCase())
              if (byLabel) {return byLabel.label}
              const byText = (question.options ?? []).find((opt) => opt.text.toLowerCase() === trimmed.toLowerCase())
              if (byText) {return byText.label}
              return trimmed
            })()
            const unanswered = !studentLabel
            const isCorrect = !unanswered && correctLabel !== null
              && studentLabel.toLowerCase() === correctLabel.toLowerCase()
            const earned = unanswered ? 0 : (isCorrect ? question.points : 0)

            return (
              <div key={question.id}>
                <SubmissionQuestionCard
                  questionId={question.id}
                  index={index}
                  points={question.points}
                  scenario={question.scenario}
                  stem={question.question_text}
                  options={question.options ?? []}
                  correctLabel={correctLabel}
                  studentLabel={studentLabel}
                />
                {(question.options ?? []).length === 0 && (
                  <div className={css.choiceRow} style={{ margin: '8px 16px 0' }}>
                    <span className={css.choiceText}>
                      No parsed choices found. Raw options: {JSON.stringify(question.rawOptions)}
                    </span>
                  </div>
                )}

                <div className={css.pointsRow}>
                  <span>
                    Student answered: {studentLabel ?? 'No answer'} · QID: {question.id}
                  </span>
                  <span className={css.pointsEarned}>
                    {earned} / {question.points} pt earned
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        <div className={css.footer}>
          <div className={css.footerPreview}>
            Preview: <strong>{modalStats.earned}/{modalStats.total} pts ({displayPct.toFixed(1)}%)</strong>
            {' · '}
            <span className={displayPassed ? css.footerPass : css.footerFail}>
              {displayPassed ? 'PASS' : 'FAIL'}
            </span>
            {target.submitted_at && <> · {fmtDate(target.submitted_at)}</>}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className={css.footerCloseBtn} onClick={onClose}>Close</button>
            {canGrade && (
              <button className={css.footerCloseBtn} onClick={onGrade} disabled={gradingSubmission}>
                {gradingSubmission ? 'Saving…' : 'Save & Mark Reviewed'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
