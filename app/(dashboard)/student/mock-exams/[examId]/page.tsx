'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Bookmark,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronsDown,
  Clock,
  FileText,
  Flag,
  LayoutGrid,
  RotateCcw,
  Send,
  SkipForward,
  X,
  XCircle,
} from 'lucide-react'
import { useMockExamSession } from '@/lib/hooks/student/mock-exams/useMockExamSession'
import { resolveQState } from '@/lib/utils/student/mock-exams/mock-exams'
import { LockedScreen } from '@/components/dashboard/student/mock-exams/LockedScreen'
import { bubbleVariants, questionVariants, timerVariants } from '@/animations/student/exam-portal'
import styles from './mock.module.css'

function formatHms(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return `${String(h).padStart(2, '0')} : ${String(m).padStart(2, '0')} : ${String(s).padStart(2, '0')}`
}

export default function MockExamPage() {
  const router = useRouter()
  const params = useParams()
  const examParam = params.examId
  const examId = Array.isArray(examParam) ? (examParam[0] ?? '') : (examParam ?? '')

  const [showOverview, setShowOverview] = useState(true)
  const [showLeaveModal, setShowLeaveModal] = useState(false)
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [showSkipConfirm, setShowSkipConfirm] = useState(false)
  const [bookmarks, setBookmarks] = useState<Record<string, boolean>>({})
  const [timeUpToast, setTimeUpToast] = useState(false)
  const [navDirection, setNavDirection] = useState<-1 | 0 | 1>(0)
  const [poppingBubbles, setPoppingBubbles] = useState<Record<string, boolean>>({})
  const prefersReducedMotion = useReducedMotion()
  const prevStatesRef = useRef<Record<string, string>>({})

  const {
    loading,
    error,
    isLocked,
    attemptsUsed,
    exam,
    questions,
    current,
    setCurrent,
    answers,
    qStates,
    handleAnswer,
    handleFlag,
    handleSkip,
    jumpToUnanswered,
    clearResponse,
    skipAndNext,
    timeLeft,
    timerWarning,
    timerCritical,
    showResume,
    confirmResume,
    confirmRestart,
    submitted,
    submitting,
    doSubmit,
    answeredCount,
    skippedCount,
    unansweredCount,
  } = useMockExamSession(examId)

  useEffect(() => {
    if (submitted && timeLeft === 0) {
      setTimeUpToast(true)
      const timer = setTimeout(() => setTimeUpToast(false), 2200)
      return () => clearTimeout(timer)
    }
    return
  }, [submitted, timeLeft])

  useEffect(() => {
    if (typeof window === 'undefined') {return}
    try {
      const saved = window.localStorage.getItem(`mock-bookmarks-${examId}`)
      if (saved !== null) {
        setBookmarks(JSON.parse(saved) as Record<string, boolean>)
      }
    } catch {
      setBookmarks({})
    }
  }, [examId])

  const toggleBookmark = (questionId: string) => {
    setBookmarks((prev) => {
      const next = { ...prev, [questionId]: !prev[questionId] }
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(`mock-bookmarks-${examId}`, JSON.stringify(next))
      }
      return next
    })
  }

  const flaggedList = useMemo(
    () => questions.map((q, idx) => ({ q, idx })).filter(({ q }) => {
      const state = qStates[q.id]
      return state === 'flagged' || state === 'flagged-answered'
    }).map(({ idx }) => idx + 1),
    [questions, qStates],
  )

  const unansweredList = useMemo(
    () => questions.map((q, idx) => ({ q, idx })).filter(({ q }) => !String(answers[q.id] ?? '').trim()).map(({ idx }) => idx + 1),
    [questions, answers],
  )

  const notVisitedCount = useMemo(
    () => questions.filter((q) => qStates[q.id] === undefined).length,
    [questions, qStates],
  )

  useEffect(() => {
    const previous = prevStatesRef.current
    const changed: Record<string, boolean> = {}

    for (const question of questions) {
      const nextState = resolveQState(question.id, answers, qStates)
      if (previous[question.id] !== undefined && previous[question.id] !== nextState) {
        changed[question.id] = true
      }
      previous[question.id] = nextState
    }

    if (Object.keys(changed).length === 0) {return}

    setPoppingBubbles((prev) => ({ ...prev, ...changed }))
    const timer = setTimeout(() => {
      setPoppingBubbles((prev) => {
        const updated = { ...prev }
        for (const id of Object.keys(changed)) {
          delete updated[id]
        }
        return updated
      })
    }, prefersReducedMotion ? 0 : 220)

    return () => clearTimeout(timer)
  }, [questions, answers, qStates, prefersReducedMotion])

  if (loading) {
    return <div className={styles.center}>Loading exam...</div>
  }

  if (error) {
    return (
      <div className={styles.center}>
        <XCircle size={18} />
        <span>{error}</span>
      </div>
    )
  }

  if (isLocked) {
    return (
      <LockedScreen
        attemptsUsed={attemptsUsed}
        examTitle={exam?.title ?? 'this exam'}
        onBack={() => router.push('/student/mock-exams')}
      />
    )
  }

  if (exam === null || questions.length === 0) {
    return null
  }

  const q = questions[current]
  const state = resolveQState(q.id, answers, qStates)
  const isFlagged = state === 'flagged' || state === 'flagged-answered'
  const hasAnswer = String(answers[q.id] ?? '').trim().length > 0

  const onNext = () => {
    if (current === questions.length - 1) {
      setShowSubmitModal(true)
      return
    }
    if (!hasAnswer) {
      setNavDirection(1)
      handleSkip()
      return
    }
    setNavDirection(1)
    setCurrent(Math.min(questions.length - 1, current + 1))
  }

  const content = submitted ? (
    <div className={styles.submittedPage}>
      <CheckCircle2 size={64} className={styles.submittedIcon} />
      <h1 className={styles.submittedTitle}>Exam Submitted!</h1>
      <p className={styles.submittedSub}>Your answers for {exam.title} have been recorded.</p>
      <div className={styles.infoCard}>
        <h2>What happens next?</h2>
        <p>
          Your submission is now under faculty review. Results will appear once your exam has been graded.
          You will be notified when your score is available.
        </p>
      </div>
      <div className={styles.submittedStats}>
        <div>
          <strong>{answeredCount} / {questions.length}</strong>
          <span>Questions Answered</span>
        </div>
        <div>
          <strong>{formatHms((exam.duration_minutes * 60) - timeLeft)}</strong>
          <span>Time Used</span>
        </div>
      </div>
      <button className={styles.primaryBtn} onClick={() => router.push('/student/mock-exams')}>
        <ArrowLeft size={16} /> Back to Exams
      </button>
    </div>
  ) : (
    <>
      <div className={styles.header}>
        <div className={styles.headerColLeft}>
          <button className={styles.headerGhostBtn} onClick={() => setShowLeaveModal(true)}>
            <ArrowLeft size={16} />
            <span>Back to Exams</span>
          </button>
          <span className={styles.headerDivider} />
          <span className={styles.examTitle} title={exam.title}>{exam.title}</span>
          <span className={styles.examBadge}>MOCK EXAM</span>
        </div>

        <div className={styles.headerColCenter}>Question {current + 1} of {questions.length}</div>

        <div className={styles.headerColRight}>
          <button className={styles.headerGhostIconBtn} title="Question Overview" onClick={() => setShowOverview((v) => !v)}>
            <LayoutGrid size={18} />
          </button>
          <motion.div
            className={`${styles.timerPill} ${timerWarning ? styles.timerWarn : ''} ${timerCritical ? styles.timerCrit : ''}`}
            aria-live="polite"
            variants={timerVariants}
            animate={timerCritical ? 'danger' : timerWarning ? 'warning' : 'normal'}
            transition={prefersReducedMotion ? { duration: 0 } : undefined}
          >
            <Clock size={16} />
            <span>{formatHms(timeLeft)}</span>
          </motion.div>
          <span className={styles.headerDivider} />
          <button className={styles.submitHeaderBtn} onClick={() => setShowSubmitModal(true)} disabled={submitting}>
            <Send size={16} />
            <span>Submit</span>
          </button>
        </div>
      </div>

      <div className={styles.pageBody}>
        {showOverview ? (
          <aside className={styles.leftPanel}>
            <section className={styles.legendSection}>
              <p className={styles.sectionLabel}>QUESTIONS</p>
              <div className={styles.legendGrid}>
                <span><i className={`${styles.dot} ${styles.dotAnswered}`} />Answered</span>
                <span><i className={`${styles.dot} ${styles.dotSkipped}`} />Skipped</span>
                <span><i className={`${styles.dot} ${styles.dotFlagged}`} />Flagged</span>
                <span><i className={`${styles.dot} ${styles.dotCurrent}`} />Current</span>
                <span><i className={`${styles.dot} ${styles.dotNotVisited}`} />Not Visited</span>
              </div>
            </section>

            <section className={styles.questionGridSection}>
              <div className={styles.numberGrid}>
                {questions.map((item, idx) => {
                  const itemState = resolveQState(item.id, answers, qStates)
                  const isCurrent = idx === current
                  const stateClass = isCurrent
                    ? styles.numCurrent
                    : itemState === 'answered' || itemState === 'flagged-answered'
                      ? styles.numAnswered
                      : itemState === 'skipped'
                        ? styles.numSkipped
                        : itemState === 'flagged'
                          ? styles.numFlagged
                          : styles.numNotVisited

                  return (
                    <motion.button
                      key={item.id}
                      aria-label={`Go to question ${idx + 1}`}
                      className={`${styles.numBtn} ${stateClass}`}
                      onClick={() => {
                        setNavDirection(0)
                        setCurrent(idx)
                      }}
                      variants={bubbleVariants}
                      animate={poppingBubbles[item.id] ? 'pop' : 'idle'}
                      transition={prefersReducedMotion ? { duration: 0 } : undefined}
                    >
                      {idx + 1}
                    </motion.button>
                  )
                })}
              </div>
            </section>

            <button className={styles.jumpBtn} onClick={() => {
              setNavDirection(0)
              jumpToUnanswered()
            }}>
              <ChevronsDown size={14} /> Jump to Unanswered
            </button>

            <section className={styles.summarySection}>
              <div><span>Total Questions</span><strong>{questions.length}</strong></div>
              <div><span>Answered</span><strong className={styles.textGreen}>{answeredCount}</strong></div>
              <div><span>Skipped</span><strong className={styles.textRed}>{skippedCount}</strong></div>
              <div><span>Flagged</span><strong className={styles.textAmber}>{flaggedList.length}</strong></div>
              <div><span>Not Visited</span><strong className={styles.textSlate}>{notVisitedCount}</strong></div>
            </section>
          </aside>
        ) : null}

        <main className={styles.mainArea}>
          <article className={styles.questionCard}>
            <div className={styles.questionHead}>
              <span className={styles.questionMetaLabel}>QUESTION {current + 1} OF {questions.length}</span>
              <div className={styles.questionHeadRight}>
                <span className={styles.metaBadge}>{q.points} pt</span>
                <span className={styles.metaBadge}>{q.question_type.replace(/_/g, ' ')}</span>
                <button
                  className={`${styles.flagIconBtn} ${isFlagged ? styles.flagged : ''}`}
                  onClick={handleFlag}
                  title={isFlagged ? 'Unflag' : 'Flag for review'}
                >
                  <Flag size={16} fill={isFlagged ? 'currentColor' : 'none'} />
                </button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={q.id}
                initial={navDirection === 1 ? 'enterFromRight' : navDirection === -1 ? 'enterFromLeft' : 'exit'}
                animate={navDirection === 0 ? 'fadeIn' : 'center'}
                exit="exit"
                variants={questionVariants}
                transition={prefersReducedMotion ? { duration: 0 } : undefined}
              >
                {q.scenario?.trim() ? (
                  <div className={styles.scenarioBlock}>
                    <div className={styles.scenarioHeader}>
                      <FileText size={14} />
                      <span>SCENARIO</span>
                    </div>
                    <p>{q.scenario}</p>
                  </div>
                ) : null}

                <h2 className={styles.questionStem}>{q.question_text}</h2>

                {q.question_type === 'multiple_choice' && q.options ? (
                  <div className={styles.choiceList}>
                    {q.options.map((opt) => {
                      const selected = answers[q.id] === opt.label
                      return (
                        <button
                          key={opt.label}
                          className={`${styles.choiceCard} ${selected ? styles.choiceSelected : ''}`}
                          onClick={() => handleAnswer(q.id, opt.label)}
                        >
                          <span className={styles.choiceLetter}>{opt.label}</span>
                          <span className={styles.choiceText}>{opt.text}</span>
                          {selected ? <CheckCircle2 size={16} className={styles.choiceCheck} /> : null}
                        </button>
                      )
                    })}
                  </div>
                ) : null}

                {q.question_type === 'true_false' ? (
                  <div className={styles.choiceList}>
                    {(['true', 'false'] as const).map((value) => {
                      const selected = answers[q.id] === value
                      return (
                        <button
                          key={value}
                          className={`${styles.choiceCard} ${selected ? styles.choiceSelected : ''}`}
                          onClick={() => handleAnswer(q.id, value)}
                        >
                          <span className={styles.choiceLetter}>{value === 'true' ? 'T' : 'F'}</span>
                          <span className={styles.choiceText}>{value === 'true' ? 'True' : 'False'}</span>
                          {selected ? <CheckCircle2 size={16} className={styles.choiceCheck} /> : null}
                        </button>
                      )
                    })}
                  </div>
                ) : null}

                {(q.question_type === 'essay' || q.question_type === 'short_answer') ? (
                  <textarea
                    className={styles.textInput}
                    placeholder={q.question_type === 'essay' ? 'Write your answer here...' : 'Short answer...'}
                    value={answers[q.id] ?? ''}
                    onChange={(event) => handleAnswer(q.id, event.target.value)}
                  />
                ) : null}

                {q.question_type === 'fill_blank' ? (
                  <input
                    type="text"
                    className={styles.textInput}
                    placeholder="Your answer..."
                    value={answers[q.id] ?? ''}
                    onChange={(event) => handleAnswer(q.id, event.target.value)}
                  />
                ) : null}

                {q.question_type === 'matching' && q.options ? (
                  <div className={styles.matchList}>
                    {q.options.map((opt) => {
                      const parsed = (() => {
                        try { return JSON.parse(answers[q.id] ?? '{}') as Record<string, string> }
                        catch { return {} }
                      })()
                      return (
                        <div key={opt.label} className={styles.matchRow}>
                          <div className={styles.matchLeft}>{opt.label}. {opt.text}</div>
                          <input
                            type="text"
                            className={styles.matchInput}
                            placeholder="Match..."
                            value={parsed[opt.label] ?? ''}
                            onChange={(event) => {
                              const next = { ...parsed, [opt.label]: event.target.value }
                              handleAnswer(q.id, JSON.stringify(next))
                            }}
                          />
                        </div>
                      )
                    })}
                  </div>
                ) : null}
              </motion.div>
            </AnimatePresence>

            <div className={styles.questionFooter}>
              <div className={styles.footerLeft}>
                <button className={styles.footerGhost} onClick={() => toggleBookmark(q.id)}>
                  <Bookmark size={16} fill={bookmarks[q.id] ? 'currentColor' : 'none'} />
                  <span>Bookmark</span>
                </button>
              </div>

              <div className={styles.footerCenter}>
                <button className={styles.footerGhost} onClick={clearResponse} disabled={!hasAnswer}>
                  <X size={14} />
                  <span>Clear Response</span>
                </button>
              </div>

              <div className={styles.footerRight}>
                <button
                  className={styles.footerOutlineBtn}
                  onClick={() => {
                    setNavDirection(-1)
                    setCurrent(Math.max(0, current - 1))
                  }}
                  disabled={current === 0}
                >
                  <ChevronLeft size={16} />
                  <span>Previous</span>
                </button>
                {current < questions.length - 1 ? (
                  <button className={styles.footerOutlineBtn} onClick={() => {
                    setNavDirection(1)
                    const result = skipAndNext(false)
                    if (result === 'confirm') {setShowSkipConfirm(true)}
                  }}>
                    <SkipForward size={16} />
                    <span>Skip</span>
                  </button>
                ) : null}
                <button className={styles.footerPrimaryBtn} onClick={onNext}>
                  {current === questions.length - 1 ? <CheckCircle2 size={16} /> : null}
                  <span>{current === questions.length - 1 ? 'Finish' : 'Next'}</span>
                  {current < questions.length - 1 ? <ChevronRight size={16} /> : null}
                </button>
              </div>
            </div>
          </article>
        </main>
      </div>
    </>
  )

  return (
    <div className={styles.shell}>
      {timeUpToast ? <div className={styles.toast}>Time&apos;s up! Your exam has been submitted.</div> : null}
      {content}

      {showResume ? (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <div className={`${styles.modalIconWrap} ${styles.modalIconBlue}`}><RotateCcw size={20} /></div>
            <h3>Resume Your Exam?</h3>
            <p>
              You have an existing in-progress session. Would you like to continue where you left off,
              or start fresh?
            </p>
            <div className={styles.modalActions}>
              <button className={styles.primaryBtn} onClick={confirmResume}>Resume Exam</button>
              <button className={styles.outlineDangerBtn} onClick={() => { void confirmRestart() }}>Start Fresh</button>
            </div>
          </div>
        </div>
      ) : null}

      {showLeaveModal ? (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <div className={`${styles.modalIconWrap} ${styles.modalIconAmber}`}><AlertTriangle size={20} /></div>
            <h3>Leave Exam?</h3>
            <p>
              Your progress will be saved. You can resume this exam later from the Mock Exams page.
            </p>
            <div className={styles.modalActions}>
              <button className={styles.primaryBtn} onClick={() => setShowLeaveModal(false)}>Stay in Exam</button>
              <button className={styles.outlineBtn} onClick={() => router.push('/student/mock-exams')}>Leave and Save Progress</button>
            </div>
          </div>
        </div>
      ) : null}

      {showSkipConfirm ? (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <div className={`${styles.modalIconWrap} ${styles.modalIconAmber}`}><AlertTriangle size={20} /></div>
            <h3>Clear your answer and skip?</h3>
            <p>This question currently has an answer selected. Skipping will clear that answer.</p>
            <div className={styles.modalActions}>
              <button className={styles.outlineBtn} onClick={() => setShowSkipConfirm(false)}>Cancel</button>
              <button
                className={styles.primaryBtn}
                onClick={() => {
                  setNavDirection(1)
                  skipAndNext(true)
                  setShowSkipConfirm(false)
                }}
              >
                Skip
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showSubmitModal ? (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <div className={`${styles.modalIconWrap} ${styles.modalIconAmber}`}><AlertCircle size={20} /></div>
            <h3>Review Before Submitting</h3>
            <div className={styles.statsCard}>
              <p>Answered: <strong className={styles.textGreen}>{answeredCount}</strong></p>
              <p>Skipped/Unanswered: <strong className={styles.textRed}>{unansweredCount}</strong></p>
              {unansweredList.length > 0 ? (
                <div className={styles.pillRow}>
                  {unansweredList.map((n) => <span key={n} className={styles.redPill}>Q{n}</span>)}
                </div>
              ) : null}
              <p>Flagged for Review: <strong className={styles.textAmber}>{flaggedList.length}</strong></p>
            </div>
            {unansweredCount > 0 ? (
              <p className={styles.warningText}>
                Warning: You have {unansweredCount} unanswered questions. Submitting now means those
                questions will be marked incorrect.
              </p>
            ) : null}
            <div className={styles.modalActions}>
              <button
                className={styles.primaryBtn}
                onClick={() => {
                  setShowSubmitModal(false)
                  void doSubmit()
                }}
                disabled={submitting}
              >
                <Send size={16} /> Submit Final Answers
              </button>
              <button className={styles.outlineBtn} onClick={() => setShowSubmitModal(false)}>
                <RotateCcw size={16} /> Go Back and Review
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
