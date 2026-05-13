// lib/hooks/student/practice-exams/usePracticeExam.ts

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useUser } from '@/lib/context/AuthContext'
import {
  fetchPracticeExamMeta,
  fetchPracticeQuestions,
  fetchPastAttempts,
  createAttempt,
  saveAnswer,
  completeAttempt,
  fetchSavedAnswers,
} from '@/lib/services/student/practice-exams/practiceExam.service'
import { fetchStudentProgramId } from '@/lib/services/student/practice-exams/practiceExamList.service'
import {
  gradeAnswer,
  computeScore,
  computeWeakTopics,
} from '@/lib/utils/student/practice-exams/practiceExam.utils'
import { PRACTICE_AUTO_SAVE_DEBOUNCE_MS } from '@/lib/constants/student/practice-exams/practice-exams'
import type {
  PracticeQuestion,
  PracticeExamMeta,
  PracticeAttemptSummary,
  FeedbackEntry,
  WeakTopic,
} from '@/lib/types/student/practice-exams/practice-exam.types'

// ── Types ─────────────────────────────────────────────────────────────────────

type SaveStatus = 'idle' | 'saving' | 'saved'
type Phase      = 'loading' | 'resume_prompt' | 'history' | 'exam' | 'completed' | 'error'

export interface UsePracticeExamReturn {
  // Meta
  phase:         Phase
  exam:          PracticeExamMeta | null
  error:         string | null
  attemptNum:    number
  pastAttempts:  PracticeAttemptSummary[]

  // Exam state
  questions:     PracticeQuestion[]
  current:       number
  answers:       Record<string, string>
  feedbacks:     Record<string, FeedbackEntry>
  saveStatus:    SaveStatus
  startedAt:     Date | null

  // Completion
  weakTopics:    WeakTopic[]
  correctCount:  number
  score:         number

  // Actions
  startNewAttempt:   () => Promise<void>
  resumeAttempt:     () => void
  handleAnswer:      (qId: string, value: string) => void
  handleCheck:       () => void
  handleRetry:       () => void
  setCurrent:        (idx: number) => void
  finishReview:      () => Promise<void>
  handleRestart:     () => void
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function usePracticeExam(examId: string): UsePracticeExamReturn {
  const { user, loading: authLoading } = useUser()

  const [phase,        setPhase]        = useState<Phase>('loading')
  const [exam,         setExam]         = useState<PracticeExamMeta | null>(null)
  const [questions,    setQuestions]    = useState<PracticeQuestion[]>([])
  const [error,        setError]        = useState<string | null>(null)
  const [pastAttempts, setPastAttempts] = useState<PracticeAttemptSummary[]>([])

  // Active attempt
  const [submissionId, setSubmissionId] = useState<string | null>(null)
  const [current,      setCurrent]      = useState(0)
  const [answers,      setAnswers]      = useState<Record<string, string>>({})
  const [feedbacks,    setFeedbacks]    = useState<Record<string, FeedbackEntry>>({})
  const [saveStatus,   setSaveStatus]   = useState<SaveStatus>('idle')
  const [startedAt,    setStartedAt]    = useState<Date | null>(null)
  const [weakTopics,   setWeakTopics]   = useState<WeakTopic[]>([])

  // Debounce timer ref
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Initial load ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (authLoading) {return}
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!user) { setError('Not authenticated.'); setPhase('error'); return }

    const controller = new AbortController()

    async function load() {
      setPhase('loading')
      const studentProgramId = await fetchStudentProgramId(user.id, controller.signal)
      if (!studentProgramId) {
        setError('No degree program is assigned to your student account.')
        setPhase('error')
        return
      }

      const [metaResult, questionsResult, past] = await Promise.all([
        fetchPracticeExamMeta(examId, user.id, studentProgramId, controller.signal),
        fetchPracticeQuestions(examId, controller.signal),
        fetchPastAttempts(examId, user.id, controller.signal),
      ])

      if (controller.signal.aborted) {return}

      if (metaResult.error || !metaResult.exam) {
        setError(metaResult.error ?? 'Unknown error'); setPhase('error'); return
      }
      if (questionsResult.error || !questionsResult.questions.length) {
        setError(questionsResult.error ?? 'No questions'); setPhase('error'); return
      }

      setExam({
        id:               metaResult.exam.id,
        title:            metaResult.exam.title,
        total_points:     metaResult.exam.total_points,
        duration_minutes: metaResult.exam.duration_minutes,
      })
      setQuestions(questionsResult.questions)
      setPastAttempts(past)

      // Check for in-progress attempt to offer resume
      const inProgress = past.find(a => a.status === 'in_progress')
      if (inProgress) {
        setSubmissionId(inProgress.id)
        setStartedAt(new Date(inProgress.started_at))
        setPhase('resume_prompt')
      } else if (past.length > 0) {
        setPhase('history')
      } else {
        setPhase('history') // first time — history screen shows "no attempts yet"
      }
    }

    void load()
    return () => controller.abort()
  }, [authLoading, user?.id, examId]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Resume ─────────────────────────────────────────────────────────────────

  const resumeAttempt = useCallback(() => {
    if (!submissionId) {return}
    const controller = new AbortController()
    fetchSavedAnswers(submissionId, controller.signal).then(saved => {
      setAnswers(saved)
      // Reconstruct feedbacks from saved answers so checked questions stay checked
      const restoredFeedbacks: Record<string, FeedbackEntry> = {}
      for (const q of questions) {
        const saved_ans = saved[q.id]
        if (saved_ans !== undefined) {
          restoredFeedbacks[q.id] = {
            submitted:     true,
            isCorrect:     gradeAnswer(q, saved_ans),
            correctAnswer: q.correct_answer,
            explanation:   q.explanation,
          }
        }
      }
      setFeedbacks(restoredFeedbacks)
      setPhase('exam')
    })
  }, [submissionId, questions])

  // ── Start new attempt ──────────────────────────────────────────────────────

  const startNewAttempt = useCallback(async () => {
    if (!user) {return}
    const { submissionId: newId, error: err } = await createAttempt(examId, user.id)
    if (err || !newId) { setError(err); setPhase('error'); return }

    setSubmissionId(newId)
    setStartedAt(new Date())
    setAnswers({})
    setFeedbacks({})
    setCurrent(0)
    setPhase('exam')
  }, [user, examId])

  // ── Auto-save (debounced) ──────────────────────────────────────────────────

  const flushSave = useCallback((
    sid:       string,
    qId:       string,
    answerVal: string,
    fb:        FeedbackEntry | undefined,
    q:         PracticeQuestion,
  ) => {
    setSaveStatus('saving')
    const isCorrect    = fb?.isCorrect ?? null
    const pointsEarned = isCorrect ? q.points : 0
    saveAnswer(sid, qId, answerVal, isCorrect, pointsEarned).then(() => {
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 1_500)
    })
  }, [])

  // ── Answer handler ─────────────────────────────────────────────────────────

  const handleAnswer = useCallback((qId: string, value: string) => {
    if (feedbacks[qId]?.submitted) {return}
    setAnswers(prev => ({ ...prev, [qId]: value }))

    // Debounced auto-save
    if (!submissionId) {return}
    if (saveTimerRef.current) {clearTimeout(saveTimerRef.current)}
    const q = questions.find(q => q.id === qId)
    if (!q) {return}
    saveTimerRef.current = setTimeout(() => {
      flushSave(submissionId, qId, value, feedbacks[qId], q)
    }, PRACTICE_AUTO_SAVE_DEBOUNCE_MS)
  }, [feedbacks, submissionId, questions, flushSave])

  // ── Check answer ───────────────────────────────────────────────────────────

  const handleCheck = useCallback(() => {
    const q = questions[current]
    if (!q) {return}
    const studentAnswer = answers[q.id] ?? ''
    const isCorrect     = gradeAnswer(q, studentAnswer)
    const fb: FeedbackEntry = {
      submitted:     true,
      isCorrect,
      correctAnswer: q.correct_answer,
      explanation:   q.explanation,
    }
    setFeedbacks(prev => ({ ...prev, [q.id]: fb }))

    // Immediate save on check
    if (submissionId) {
      flushSave(submissionId, q.id, studentAnswer, fb, q)
    }
  }, [current, questions, answers, submissionId, flushSave])

  // ── Retry ──────────────────────────────────────────────────────────────────

  const handleRetry = useCallback(() => {
    const q = questions[current]
    if (!q) {return}
    setAnswers(prev   => { const n = { ...prev }; delete n[q.id]; return n })
    setFeedbacks(prev => { const n = { ...prev }; delete n[q.id]; return n })
  }, [current, questions])

  // ── Finish ─────────────────────────────────────────────────────────────────

  const finishReview = useCallback(async () => {
    if (!submissionId || !exam) {return}

    const { score } = computeScore(questions, answers, feedbacks)
    const percentage  = exam.total_points > 0
      ? Math.round((score / exam.total_points) * 100)
      : 0
    const passed      = percentage >= 50 // default passing threshold
    const weak        = computeWeakTopics(questions, feedbacks)

    setWeakTopics(weak)

    const studentName = user?.user_metadata?.full_name
  ?? user?.email
  ?? 'A student'

await completeAttempt(
  submissionId,
  score,
  percentage,
  passed,
  exam.title,
  studentName,
)

    // Refresh past attempts list so the new completed one appears
    if (user) {
      const controller = new AbortController()
      const updated    = await fetchPastAttempts(examId, user.id, controller.signal)
      setPastAttempts(updated)
    }

    setPhase('completed')
  }, [submissionId, exam, questions, answers, feedbacks, user, examId])

  // ── Restart (new attempt from completion screen) ──────────────────────────

  const handleRestart = useCallback(() => {
    setPhase('history')
  }, [])

  // ── Derived ───────────────────────────────────────────────────────────────

  const { score, correctCount } = useMemo(
    () => computeScore(questions, answers, feedbacks),
    [questions, answers, feedbacks],
  )

  const attemptNum = pastAttempts.length + (phase === 'exam' ? 1 : 0)

  return {
    phase,
    exam,
    error,
    attemptNum,
    pastAttempts,
    questions,
    current,
    answers,
    feedbacks,
    saveStatus,
    startedAt,
    weakTopics,
    correctCount,
    score,
    startNewAttempt,
    resumeAttempt,
    handleAnswer,
    handleCheck,
    handleRetry,
    setCurrent,
    finishReview,
    handleRestart,
  }
}
