'use client'

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import Link from 'next/link'
import { ArrowUp } from 'lucide-react'
import { slideUpFade } from '@/animations/slideUpFade'
import { popIn } from '@/animations/popIn'
import { highlightPulse } from '@/animations/highlightPulse'
import type { StudentReviewPayload } from '@/lib/services/student/results/resultReview.service'
import { formatDuration, getValidDurationSeconds } from '@/lib/utils/formatDuration'
import s from './results-review.module.css'

interface Props {
  review: StudentReviewPayload
}

function normalize(value: string | null): string {
  return (value ?? '').trim().toLowerCase()
}

export function ResultsReviewClient({ review }: Props) {
  const [openExplanations, setOpenExplanations] = useState<Record<string, boolean>>({})
  const [activeFilter, setActiveFilter] = useState<'all' | 'correct' | 'wrong' | 'unanswered'>('all')
  const [activeQuestion, setActiveQuestion] = useState(0)
  const [mobileNavigatorOpen, setMobileNavigatorOpen] = useState(false)
  const [durationTooltipOpen, setDurationTooltipOpen] = useState(false)
  const cardRefs = useRef<Record<string, HTMLElement | null>>({})
  const explanationRefs = useRef<Record<string, HTMLElement | null>>({})
  const widgetRef = useRef<HTMLButtonElement | null>(null)
  const pulsedChoiceKeys = useRef<Set<string>>(new Set())
  const statusAnimated = useRef<Set<string>>(new Set())
  const observerRef = useRef<IntersectionObserver | null>(null)

  const summary = useMemo(() => {
    let correct = 0
    let wrong = 0
    let skipped = 0

    for (const q of review.questions) {
      const student = normalize(q.studentAnswer)
      const correctAns = normalize(q.correctAnswer)
      if (!student) { skipped += 1; continue }
      if (student === correctAns) { correct += 1 } else { wrong += 1 }
    }

    const total = review.questions.length
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0
    return { correct, wrong, skipped, total, percentage }
  }, [review.questions])

  const questionStatuses = useMemo(() => review.questions.map((question) => {
    const student = normalize(question.studentAnswer)
    const correct = normalize(question.correctAnswer)
    if (!student) {return 'unanswered' as const}
    return student === correct ? 'correct' as const : 'wrong' as const
  }), [review.questions])

  const statusCounts = useMemo(() => ({
    all: questionStatuses.length,
    correct: questionStatuses.filter((status) => status === 'correct').length,
    wrong: questionStatuses.filter((status) => status === 'wrong').length,
    unanswered: questionStatuses.filter((status) => status === 'unanswered').length,
  }), [questionStatuses])

  const validDuration = getValidDurationSeconds(review.startedAt, review.submittedAt, review.durationMinutes)
  const durationUnavailable = validDuration === null

  useEffect(() => {
    if (widgetRef.current) { popIn(widgetRef.current) }
  }, [])

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {return}
          const el = entry.target as HTMLDivElement
          const idx = Number(el.dataset.index ?? '0')
          setActiveQuestion(idx)
          slideUpFade(el, idx)
          observerRef.current?.unobserve(el)
        })
      },
      { threshold: 0.15 },
    )

    Object.values(cardRefs.current).forEach((node) => {
      if (node) { observerRef.current?.observe(node) }
    })

    return () => {
      observerRef.current?.disconnect()
      observerRef.current = null
    }
  }, [review.questions.length])

  useEffect(() => {
    const activeObserver = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
      if (visible) {
        setActiveQuestion(Number((visible.target as HTMLElement).dataset.index ?? '0'))
      }
    }, { threshold: [0.25, 0.5, 0.75] })
    Object.values(cardRefs.current).forEach((node) => { if (node) {activeObserver.observe(node)} })
    return () => activeObserver.disconnect()
  }, [review.questions.length])

  function setCardRef(id: string, node: HTMLElement | null, index: number) {
    cardRefs.current[id] = node
    if (node) {
      node.dataset.index = String(index)
      node.style.opacity = '0'
      node.style.transform = 'translateY(20px)'
    }
  }

  function setStatusRef(id: string, node: HTMLSpanElement | null) {
    if (node && !statusAnimated.current.has(id)) {
      statusAnimated.current.add(id)
      popIn(node)
    }
  }

  function setChoiceRef(
    questionId: string,
    choiceLabel: string,
    type: 'correct' | 'wrong' | 'neutral',
    node: HTMLElement | null,
  ) {
    if (!node || type === 'neutral') {return}
    const key = `${questionId}-${choiceLabel}-${type}`
    if (pulsedChoiceKeys.current.has(key)) {return}
    pulsedChoiceKeys.current.add(key)
    highlightPulse(node, type === 'correct' ? '#16a34a' : '#dc2626')
  }

  function toggleExplanation(questionId: string) {
    setOpenExplanations((prev) => ({ ...prev, [questionId]: !prev[questionId] }))
    const el = explanationRefs.current[questionId]
    if (el) { slideUpFade(el, 0) }
  }

  function scrollTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handlePrint() {
    window.print()
  }

  function handleDownloadPDF() {
    const originalTitle = document.title
    document.title = review.examTitle
    window.print()
    document.title = originalTitle
  }

  const pass = summary.wrong === 0 && summary.correct > 0
  const bannerPass = review.passingScore !== null && review.passingScore !== undefined
    ? summary.percentage >= review.passingScore
    : null

  function isFilteredOut(index: number): boolean {
    return activeFilter !== 'all' && questionStatuses[index] !== activeFilter
  }

  function formatSubmittedDate(value: string | null | undefined): string {
    if (!value) {return '—'}
    const date = new Date(value)
    if (!Number.isFinite(date.getTime())) {return '—'}
    return new Intl.DateTimeFormat('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
    }).format(date)
  }

  function renderNavigator() {
    return (
      <div>
        <div className={s.navigatorGrid}>
          {review.questions.map((question, idx) => {
            const status = questionStatuses[idx]
            return (
              <button
                key={question.id}
                type="button"
                className={`${s.navigatorChip} ${s[`navigator_${status}`]} ${activeQuestion === idx ? s.navigatorActive : ''} ${isFilteredOut(idx) ? s.navigatorDimmed : ''}`}
                aria-label={`Question ${idx + 1}, ${status}`}
                aria-current={activeQuestion === idx ? 'location' : undefined}
                onClick={() => {
                  const node = cardRefs.current[question.id]
                  if (!node) {return}
                  node.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  setMobileNavigatorOpen(false)
                }}
              >{idx + 1}</button>
            )
          })}
        </div>
        <div className={s.navigatorLegend}><span className={s.legendCorrect}>Correct</span><span className={s.legendWrong}>Wrong</span><span className={s.legendUnanswered}>Unanswered</span></div>
      </div>
    )
  }

  return (
    <div className={s.page}>
      <div className={s.stickyHeader}>
        <div className={s.stickyTop}>
          <Link href="/student/results" className={s.backBtn}>
            ← Back to Results
          </Link>
          <h1 className={s.examTitle}>{review.examTitle}</h1>
          <div className={s.headerRight}>
            <span className={`${s.scorePill} ${pass ? s.scorePass : s.scoreFail}`}>
              {summary.correct}/{summary.total} · {summary.percentage}% · {pass ? 'PASSED' : 'FAILED'}
            </span>
            <button className={s.headerGhostBtn} onClick={handlePrint}>🖨 Print</button>
            <button className={s.headerGhostBtn} onClick={handleDownloadPDF}>⬇ Download PDF</button>
          </div>
        </div>

      </div>

      <section className={s.summaryBanner} aria-label="Exam result summary">
        <div className={s.summaryHeading}>
          <div>
            <h2 className={s.summaryExamTitle}>{review.examTitle}</h2>
            <div className={s.summaryTags}>
              {review.category && <span className={s.categoryBadge}>{review.category}</span>}
              {review.examType && <span className={`${s.examTypeBadge} ${review.examType === 'mock' ? s.mockBadge : s.practiceBadge}`}>{review.examType === 'mock' ? 'MOCK' : 'PRACTICE'}</span>}
            </div>
          </div>
          {bannerPass !== null && <span className={`${s.bannerPassBadge} ${bannerPass ? s.bannerPassed : s.bannerFailed}`}>{bannerPass ? 'Passed' : 'Failed'}</span>}
        </div>

        <div className={s.summaryMain}>
          <div className={s.scoreSummary}>
            <div className={s.scoreRing} style={{ '--score-percent': `${summary.percentage}%` } as CSSProperties}>
              <div className={s.scoreRingInner}><strong>{summary.percentage}%</strong></div>
            </div>
            <div><span className={s.summaryLabel}>Score</span><strong className={s.summaryScore}>{summary.correct} / {summary.total}</strong></div>
          </div>
          <div className={s.statChips}>
            <span className={`${s.statChip} ${s.statCorrect}`}>Correct <strong>{summary.correct}</strong></span>
            <span className={`${s.statChip} ${s.statWrong}`}>Wrong <strong>{summary.wrong}</strong></span>
            <span className={`${s.statChip} ${s.statUnanswered}`}>Unanswered <strong>{summary.skipped}</strong></span>
          </div>
          <div className={s.submissionMeta}>
            <span><strong>Submitted</strong>{formatSubmittedDate(review.submittedAt)}</span>
            <span><strong>Time taken</strong>
              {durationUnavailable ? (
                <span className={s.durationTooltipWrap}>
                  <button type="button" className={s.durationTooltipTrigger} aria-label="Duration unavailable" aria-describedby="review-duration-tooltip" aria-expanded={durationTooltipOpen} onClick={() => setDurationTooltipOpen((open) => !open)} onBlur={() => setDurationTooltipOpen(false)}>—</button>
                  <span id="review-duration-tooltip" role="tooltip" className={`${s.durationTooltip} ${durationTooltipOpen ? s.durationTooltipOpen : ''}`}>Exam was left open past its time limit, so active time can&apos;t be determined.</span>
                </span>
              ) : formatDuration(validDuration)}
            </span>
          </div>
        </div>

        <div className={s.segmentedSummary} aria-label={`${summary.correct} correct, ${summary.wrong} wrong, ${summary.skipped} unanswered`}>
          <div className={s.segmentTrack}>
            <span className={s.segmentCorrect} style={{ width: `${(summary.correct / Math.max(summary.total, 1)) * 100}%` }} />
            <span className={s.segmentWrong} style={{ width: `${(summary.wrong / Math.max(summary.total, 1)) * 100}%` }} />
            <span className={s.segmentUnanswered} style={{ width: `${(summary.skipped / Math.max(summary.total, 1)) * 100}%` }} />
          </div>
          <div className={s.segmentLegend}><span>Correct {summary.correct}</span><span>Wrong {summary.wrong}</span><span>Unanswered {summary.skipped}</span></div>
        </div>
      </section>

      <div className={s.reviewLayout}>
        <aside className={`${s.navigator} ${s.printHide}`} aria-label="Question navigator">
          <h2>Questions <span>{summary.total}</span></h2>
          {renderNavigator()}
        </aside>

        <div className={s.questionContent}>
          <section className={`${s.mobileNavigator} ${s.printHide}`}>
            <button type="button" className={s.mobileNavigatorToggle} aria-expanded={mobileNavigatorOpen} onClick={() => setMobileNavigatorOpen((open) => !open)}>
              Questions <span>{summary.total}</span><span aria-hidden="true">{mobileNavigatorOpen ? '▴' : '▾'}</span>
            </button>
            {mobileNavigatorOpen && renderNavigator()}
          </section>

          <div className={`${s.filterTabs} ${s.printHide}`} role="tablist" aria-label="Filter questions">
            {(['all', 'correct', 'wrong', 'unanswered'] as const).map((filter) => (
              <button key={filter} type="button" role="tab" aria-selected={activeFilter === filter} className={`${s.filterTab} ${activeFilter === filter ? s.filterTabActive : ''}`} onClick={() => setActiveFilter(filter)}>
                {filter === 'all' ? 'All' : filter[0].toUpperCase() + filter.slice(1)} <span>{statusCounts[filter]}</span>
              </button>
            ))}
          </div>

      <div className={s.list}>
        {review.questions.map((q, idx) => {
          const status = questionStatuses[idx]
          const open = !!openExplanations[q.id]
          const student = normalize(q.studentAnswer)
          const correct = normalize(q.correctAnswer)
          return (
            <article
              key={q.id}
              ref={(node) => setCardRef(q.id, node, idx)}
              className={`${s.card} ${status === 'correct' ? s.cardCorrect : status === 'wrong' ? s.cardWrong : s.cardNeutral} ${isFilteredOut(idx) ? s.filteredOut : ''}`}
            >
              <header className={s.cardHead}>
                <span className={s.questionPill}>Question {idx + 1}</span>
                <span className={s.pointsPill}>{q.points} pt</span>
                <span
                  ref={(node) => setStatusRef(q.id, node)}
                  className={`${s.statusPill} ${status === 'correct' ? s.statusCorrect : status === 'wrong' ? s.statusWrong : s.statusNeutral}`}
                >
                  {status === 'correct' ? 'Correct' : status === 'wrong' ? 'Wrong' : 'Unanswered'}
                </span>
              </header>

              {q.scenario && (
                <div className={s.scenario}>
                  <div className={s.scenarioLabel}>SCENARIO</div>
                  <p>{q.scenario}</p>
                </div>
              )}

              <h2 className={s.stem}>{q.stem}</h2>

              <div className={s.choices}>
                {q.options.map((opt) => {
                  const label = normalize(opt.label)
                  const isCorrect = label === correct
                  const isWrongStudent = label === student && label !== correct && student.length > 0
                  const type: 'correct' | 'wrong' | 'neutral' = isCorrect ? 'correct' : isWrongStudent ? 'wrong' : 'neutral'
                  return (
                    <div
                      key={`${q.id}-${opt.label}`}
                      ref={(node) => setChoiceRef(q.id, opt.label, type, node)}
                      className={`${s.choice} ${isCorrect ? s.choiceCorrect : ''} ${isWrongStudent ? s.choiceWrong : ''}`}
                    >
                      <span className={s.choiceLabel}>{opt.label}</span>
                      <span className={s.choiceText}>{opt.text}</span>
                      {isCorrect && <span className={s.choiceAnnotation}><span className={s.choiceTextLabel}>{student === correct ? 'Your answer · Correct answer' : 'Correct answer'}</span><span className={s.choiceIcon}>✓</span></span>}
                      {isWrongStudent && <span className={s.choiceAnnotation}><span className={s.choiceTextLabel}>Your answer</span><span className={s.choiceIcon}>✕</span></span>}
                    </div>
                  )
                })}
              </div>

              {q.explanation && (
                <div className={s.explainWrap}>
                  <button className={`${s.explainBtn} ${s.printHide}`} onClick={() => toggleExplanation(q.id)}>
                    {open ? 'Hide Explanation ▴' : 'Show Explanation ▾'}
                  </button>
                  <div className={`${s.explainBox} ${open ? s.explainOpen : ''} ${s.printExplainOpen}`}>
                    <div ref={(node) => { explanationRefs.current[q.id] = node }} className={s.explainText}>
                      {q.explanation}
                    </div>
                  </div>
                </div>
              )}
            </article>
          )
        })}
      </div>
        </div>
      </div>

      <button ref={widgetRef} className={`${s.floating} ${s.printHide}`} onClick={scrollTop}>
        <ArrowUp size={18} aria-hidden="true" />
      </button>
    </div>
  )
}
