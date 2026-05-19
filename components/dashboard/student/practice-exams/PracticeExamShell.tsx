// components/exam/student/practice-exams/PracticeExamShell.tsx
'use client'

import {
  ChevronLeft, ChevronRight,
  CheckCircle2, XCircle, BookOpen, RotateCcw, ArrowLeft,
  Save, Clock, Target, TrendingDown,
} from 'lucide-react'
import { useEffect, useCallback, useMemo, useState } from 'react'
import type { UsePracticeExamReturn } from '@/lib/hooks/student/practice-exams/usePracticeExam'
import { stripDiffTag } from '@/lib/utils/student/practice-exams/practiceExam.utils'
import { formatSeconds } from '@/lib/utils/student/practice-exams/practiceExam.utils'
import type { QuestionOption } from '@/lib/types/database'
import styles from '@/app/(dashboard)/student/practice-exams/[examId]/practice.module.css'

interface Props {
  hook:     UsePracticeExamReturn
  onBack:   () => void
}

const TRUE_FALSE_CHOICES: readonly ('true' | 'false')[] = ['true', 'false']

function parseMatchingAnswer(raw: string | undefined): Record<string, string> {
  if (!raw) {return {}}
  try {
    const parsed = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {return {}}
    const result: Record<string, string> = {}
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === 'string') {result[key] = value}
    }
    return result
  } catch {
    return {}
  }
}

// ── History / Lobby screen ────────────────────────────────────────────────────

function HistoryScreen({ hook, onBack }: Props) {
  const { exam, pastAttempts, startNewAttempt } = hook

  return (
    <div className={styles.completion}>
      <div className={styles.completionCard}>
        <div className={styles.completionIcon}>
          <BookOpen size={28} color="#0d2540" />
        </div>
        <h1 className={styles.completionTitle}>{exam?.title}</h1>
        <p className={styles.completionSub}>Practice Exam · Review Mode</p>

        {pastAttempts.length > 0 && (
          <div className={styles.attemptsTable}>
            <p className={styles.attemptsHeading}>Previous Attempts</p>
            {pastAttempts.map(a => (
              <div key={a.id} className={styles.attemptRow}>
                <span className={styles.attemptNum}>Attempt #{a.attempt_num}</span>
                <span className={styles.attemptScore}>
                  {a.percentage !== null ? `${a.percentage}%` : '—'}
                </span>
                <span className={styles.attemptDate}>
                  {new Date(a.started_at).toLocaleDateString()}
                </span>
                <span className={`${styles.attemptStatus} ${a.passed ? styles.passed : styles.failed}`}>
                  {a.passed ? 'Passed' : a.status === 'in_progress' ? 'In Progress' : 'Failed'}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className={styles.completionActions}>
          <button className={styles.btnRetryAll} onClick={startNewAttempt}>
            Start Attempt #{pastAttempts.length + 1}
          </button>
          <button className={styles.btnBackList} onClick={onBack}>
            <ArrowLeft size={14} /> Back to Reviewers
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Resume prompt ─────────────────────────────────────────────────────────────

function ResumePrompt({ hook, onBack }: Props) {
  const { startNewAttempt, resumeAttempt, pastAttempts } = hook

  return (
    <div className={styles.completion}>
      <div className={styles.completionCard}>
        <div className={styles.completionIcon}>
          <Clock size={28} color="#d97706" />
        </div>
        <h1 className={styles.completionTitle}>Resume your review?</h1>
        <p className={styles.completionSub}>
          You have an unfinished attempt. Pick up where you left off or start fresh.
        </p>
        <div className={styles.completionActions}>
          <button className={styles.btnRetryAll} onClick={resumeAttempt}>
            Resume
          </button>
          <button className={styles.btnBackList} onClick={startNewAttempt}>
            <RotateCcw size={14} /> Restart (new attempt #{pastAttempts.length + 1})
          </button>
        </div>
        <button className={styles.backLinkButton} onClick={onBack}>
          ← Back to list
        </button>
      </div>
    </div>
  )
}

// ── Completion screen ─────────────────────────────────────────────────────────

function CompletionScreen({ hook, onBack }: Props) {
  const {
    questions, correctCount, score, weakTopics,
    feedbacks, startedAt, attemptNum, handleRestart, exam,
  } = hook

  const gradable  = Object.values(feedbacks).filter(f => f.isCorrect !== null).length
  const accuracy  = gradable > 0 ? Math.round((correctCount / gradable) * 100) : null
  const [nowTs, setNowTs] = useState(0)
  useEffect(() => {
    setNowTs(Date.now())
  }, [startedAt])
  const timeSpent = useMemo(
    () => (startedAt ? Math.floor((nowTs - startedAt.getTime()) / 1000) : 0),
    [startedAt, nowTs],
  )

  return (
    <div className={styles.completion}>
      <div className={styles.completionCard}>
        <div className={styles.completionIcon}>
          <BookOpen size={28} color="#059669" />
        </div>
        <h1 className={styles.completionTitle}>Review Complete!</h1>
        <p className={styles.completionSub}>
          Attempt #{attemptNum} · {exam?.title}
        </p>

        <div className={styles.completionGrid}>
          <div className={styles.completionGridItem}>
            <span className={styles.completionGridVal}>{questions.length}</span>
            <span className={styles.completionGridLbl}>Questions</span>
          </div>
          <div className={styles.completionGridItem}>
            <span className={styles.completionGridVal} style={{ color: '#059669' }}>{correctCount}</span>
            <span className={styles.completionGridLbl}>Correct</span>
          </div>
          <div className={styles.completionGridItem}>
            <span className={styles.completionGridVal} style={{ color: '#dc2626' }}>
              {gradable - correctCount}
            </span>
            <span className={styles.completionGridLbl}>Wrong</span>
          </div>
          <div className={styles.completionGridItem}>
            <span className={styles.completionGridVal}>
              {accuracy !== null ? `${accuracy}%` : '—'}
            </span>
            <span className={styles.completionGridLbl}>Accuracy</span>
          </div>
          <div className={styles.completionGridItem}>
            <span className={styles.completionGridVal}>{score}</span>
            <span className={styles.completionGridLbl}>Score (pts)</span>
          </div>
          <div className={styles.completionGridItem}>
            <span className={styles.completionGridVal}>{formatSeconds(timeSpent)}</span>
            <span className={styles.completionGridLbl}>Time Spent</span>
          </div>
        </div>

        {weakTopics.length > 0 && (
          <div className={styles.weakTopics}>
            <div className={styles.weakTopicsHeading}>
              <TrendingDown size={14} color="#dc2626" /> Weak Areas — review these
            </div>
            {weakTopics.map(t => (
              <div key={t.category} className={styles.weakTopicRow}>
                <span className={styles.weakTopicName}>{t.category.replace(/_/g, ' ')}</span>
                <span className={styles.weakTopicAccuracy} style={{ color: t.accuracy < 50 ? '#dc2626' : '#d97706' }}>
                  {t.accuracy}% ({t.correct}/{t.total})
                </span>
              </div>
            ))}
          </div>
        )}

        <div className={styles.completionActions}>
          <button className={styles.btnRetryAll} onClick={handleRestart}>
            <RotateCcw size={14} /> Try Again
          </button>
          <button className={styles.btnBackList} onClick={onBack}>
            <ArrowLeft size={14} /> Back to Reviewers
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main exam shell ───────────────────────────────────────────────────────────

export default function PracticeExamShell({ hook, onBack }: Props) {
  const {
    phase, exam, error,
    questions, current, setCurrent,
    answers, feedbacks, saveStatus,
    handleAnswer, handleCheck, handleRetry, finishReview,
  } = hook

  // ── Keyboard navigation ────────────────────────────────────────────────────
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (phase !== 'exam') {return}
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {return}
    if (e.key === 'ArrowLeft')  {setCurrent(Math.max(0, current - 1))}
    if (e.key === 'ArrowRight') {setCurrent(Math.min(questions.length - 1, current + 1))}
  }, [phase, current, questions.length, setCurrent])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // ── Phase routing ──────────────────────────────────────────────────────────

  if (phase === 'loading') {return <div className={styles.center}>Loading reviewer…</div>}

  if (phase === 'error') {
    return (
      <div className={styles.center}>
        <XCircle size={28} color="#dc2626" />
        <span>{error}</span>
        <button className={styles.btnCenter} onClick={onBack}>Go back</button>
      </div>
    )
  }

  if (phase === 'resume_prompt') {return <ResumePrompt hook={hook} onBack={onBack} />}
  if (phase === 'history')       {return <HistoryScreen hook={hook} onBack={onBack} />}
  if (phase === 'completed')     {return <CompletionScreen hook={hook} onBack={onBack} />}

  // ── Exam phase ─────────────────────────────────────────────────────────────

  const q   = questions[current]
  const fb  = q ? feedbacks[q.id] : undefined
  const pct = questions.length > 0 ? ((current + 1) / questions.length) * 100 : 0

  const answeredCount = Object.keys(answers).length
  const gradable      = Object.values(feedbacks).filter(f => f.isCorrect !== null).length
  const correctCount  = Object.values(feedbacks).filter(f => f.isCorrect === true).length
  const liveAccuracy  = gradable > 0 ? Math.round((correctCount / gradable) * 100) : null

  const canCheck = !!(answers[q?.id ?? '']?.trim()) && !fb?.submitted

  if (!q || !exam) {return null}

  return (
    <div className={styles.shell}>

      {/* ── Top Bar ── */}
      <div className={styles.topBar}>
        <div className={styles.topLeft}>
          <span className={styles.examTitle}>{exam.title}</span>
          <span className={styles.practiceBadge}>Practice</span>
        </div>
        <div className={styles.topRight}>
          {/* Save indicator */}
          {saveStatus !== 'idle' && (
            <span className={`${styles.saveIndicator} ${saveStatus === 'saving' ? styles.saving : styles.saved}`}>
              <Save size={11} />
              {saveStatus === 'saving' ? 'Saving…' : 'Saved'}
            </span>
          )}
          {/* Live stats */}
          <span className={styles.progressLabel}>
            {answeredCount}/{questions.length} answered
            {liveAccuracy !== null && ` · ${liveAccuracy}% accuracy`}
          </span>
          <div className={styles.progressBarWrap}>
            <div className={styles.progressBarFill} style={{ width: `${pct}%` }} />
          </div>
          <span className={styles.progressLabel}>{current + 1} / {questions.length}</span>
        </div>
      </div>

      {/* ── Main ── */}
      <div className={styles.main}>

        {/* ── Sidebar ── */}
        <div className={styles.sidebar}>
          <div className={styles.sidebarHead}>
            <div className={styles.sidebarHeading}>Questions</div>

            {/* Jump helpers */}
            <div className={styles.jumpRow}>
              <button
                className={styles.jumpBtn}
                onClick={() => {
                  const idx = questions.findIndex(q => !answers[q.id])
                  if (idx !== -1) {setCurrent(idx)}
                }}
              >
                Jump to Unanswered
              </button>
              <button
                className={styles.jumpBtn}
                onClick={() => {
                  const idx = questions.findIndex(q => feedbacks[q.id]?.isCorrect === false)
                  if (idx !== -1) {setCurrent(idx)}
                }}
              >
                Jump to Incorrect
              </button>
            </div>

            <div className={styles.legend}>
              {[
                { label: 'Correct', color: '#10b981' },
                { label: 'Wrong',   color: '#ef4444' },
                { label: 'Checked', color: '#8b5cf6' },
                { label: 'Current', color: '#0d2540' },
              ].map(l => (
                <div key={l.label} className={styles.legendItem}>
                  <span className={styles.legendDot} style={{ background: l.color }} />
                  {l.label}
                </div>
              ))}
            </div>
          </div>

          <div className={styles.palette}>
            {questions.map((pq, idx) => {
              const pfb   = feedbacks[pq.id]
              const isCur = idx === current
              const tooltip =
                isCur                    ? 'Current' :
                pfb?.isCorrect === true  ? 'Correct'  :
                pfb?.isCorrect === false ? 'Incorrect' :
                pfb?.submitted           ? 'Checked'  :
                answers[pq.id]           ? 'Answered' :
                'Not Answered'

              const cls =
                isCur                    ? styles.palCurrent :
                pfb?.isCorrect === true  ? styles.palCorrect :
                pfb?.isCorrect === false ? styles.palWrong   :
                pfb?.submitted           ? styles.palChecked :
                ''

              return (
                <button
                  key={pq.id}
                  className={`${styles.palBtn} ${cls}`}
                  onClick={() => setCurrent(idx)}
                  title={tooltip}
                >
                  {idx + 1}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Question card ── */}
        <div className={styles.content}>
          <div className={styles.questionCard} key={q.id}>
            <div className={styles.questionMeta}>
              <span className={styles.qNumber}>Question {current + 1} of {questions.length}</span>
              <div className={styles.qBadges}>
                <span className={styles.ptsBadge}>{q.points} pt{q.points !== 1 ? 's' : ''}</span>
                <span className={styles.typeBadge}>{q.question_type.replace(/_/g, ' ')}</span>
              </div>
            </div>

            {q.scenario?.trim() ? (
              <div className={styles.scenarioBlock}>
                <div className={styles.scenarioHeader}>
                  <BookOpen size={14} />
                  <span>Scenario</span>
                </div>
                <p className={styles.scenarioText}>{q.scenario}</p>
              </div>
            ) : null}

            <p className={styles.questionText}>{q.question_text}</p>

            {/* MCQ */}
            {q.question_type === 'multiple_choice' && q.options && (
              <div className={styles.optionList}>
                {q.options.map((opt: QuestionOption) => {
                  const isSel      = answers[q.id] === opt.label
                  const isChecked  = fb?.submitted
                  const isCorrectO = fb?.correctAnswer === opt.label
                  const isWrongO   = isSel && fb?.isCorrect === false
                  return (
                    <button
                      key={opt.label}
                      className={`${styles.optionBtn}
                        ${isSel && !isChecked     ? styles.optionSelected : ''}
                        ${isChecked && isCorrectO ? styles.optionCorrect  : ''}
                        ${isChecked && isWrongO   ? styles.optionWrong    : ''}
                        ${isChecked               ? styles.optLocked      : ''}
                      `}
                      onClick={() => !isChecked && handleAnswer(q.id, opt.label)}
                    >
                      <span className={styles.optLabel}>{opt.label}</span>
                      <span className={styles.optText}>{opt.text}</span>
                      {isChecked && isCorrectO && <span className={styles.optIcon}><CheckCircle2 size={16} color="#059669" /></span>}
                      {isChecked && isWrongO   && <span className={styles.optIcon}><XCircle      size={16} color="#dc2626" /></span>}
                    </button>
                  )
                })}
              </div>
            )}

            {/* True / False */}
            {q.question_type === 'true_false' && (
              <div className={styles.tfRow}>
                {TRUE_FALSE_CHOICES.map(v => {
                  const isSel     = answers[q.id] === v
                  const isChecked = fb?.submitted
                  const isCorr    = fb?.correctAnswer === v
                  const isWrong   = isSel && fb?.isCorrect === false
                  return (
                    <button
                      key={v}
                      className={`${styles.tfBtn}
                        ${isSel && !isChecked ? styles.tfSelected : ''}
                        ${isChecked && isCorr  ? styles.tfCorrect  : ''}
                        ${isChecked && isWrong ? styles.tfWrong    : ''}
                        ${isChecked            ? styles.tfLocked   : ''}
                      `}
                      onClick={() => !isChecked && handleAnswer(q.id, v)}
                    >
                      {v === 'true' ? 'True' : 'False'}
                    </button>
                  )
                })}
              </div>
            )}

            {/* Essay / Short Answer */}
            {(q.question_type === 'essay' || q.question_type === 'short_answer') && (
              <textarea
                className={styles.textArea}
                placeholder={q.question_type === 'essay' ? 'Write your answer here…' : 'Short answer…'}
                value={answers[q.id] ?? ''}
                onChange={e => handleAnswer(q.id, e.target.value)}
                disabled={fb?.submitted}
              />
            )}

            {/* Fill in the Blank */}
            {q.question_type === 'fill_blank' && (
              <input
                type="text"
                className={styles.fillInput}
                placeholder="Your answer…"
                value={answers[q.id] ?? ''}
                onChange={e => handleAnswer(q.id, e.target.value)}
                disabled={fb?.submitted}
              />
            )}

            {/* Matching */}
            {q.question_type === 'matching' && q.options && (
              <div className={styles.matchList}>
                {q.options.map((opt: QuestionOption) => {
                  const parsed = parseMatchingAnswer(answers[q.id])
                  return (
                    <div key={opt.label} className={styles.matchRow}>
                      <div className={styles.matchLeft}>{opt.label}. {opt.text}</div>
                      <span className={styles.matchArrow}>→</span>
                      <input
                        type="text"
                        className={styles.matchInput}
                        placeholder="Match…"
                        value={parsed[opt.label] ?? ''}
                        disabled={fb?.submitted}
                        onChange={e => {
                          const updated = { ...parsed, [opt.label]: e.target.value }
                          handleAnswer(q.id, JSON.stringify(updated))
                        }}
                      />
                    </div>
                  )
                })}
              </div>
            )}

            {/* Action bar */}
            <div className={styles.answerBar}>
              {!fb?.submitted ? (
                <button className={styles.btnCheck} onClick={handleCheck} disabled={!canCheck}>
                  <CheckCircle2 size={14} /> Check Answer
                </button>
              ) : (
                <button className={styles.btnRetry} onClick={handleRetry}>
                  <RotateCcw size={14} /> Retry
                </button>
              )}
            </div>

            {/* Feedback */}
            {fb?.submitted && (
              <div className={`${styles.feedback} ${
                fb.isCorrect === true  ? styles.feedbackCorrect  :
                fb.isCorrect === false ? styles.feedbackWrong    :
                styles.feedbackNeutral
              }`}>
                <div className={`${styles.feedbackHeader} ${
                  fb.isCorrect === true  ? styles.feedbackHeaderCorrect  :
                  fb.isCorrect === false ? styles.feedbackHeaderWrong    :
                  styles.feedbackHeaderNeutral
                }`}>
                  {fb.isCorrect === true  && <><CheckCircle2 size={15} /> Correct!</>}
                  {fb.isCorrect === false && <><XCircle      size={15} /> Incorrect</>}
                  {fb.isCorrect === null  && <><BookOpen     size={15} /> Recorded — requires manual review</>}
                </div>
                {fb.isCorrect === false && fb.correctAnswer && (
                  <p className={styles.feedbackAnswer}>
                    Correct answer: <strong>{fb.correctAnswer}</strong>
                  </p>
                )}
                {fb.explanation && (
                  <p className={styles.feedbackExplanation}>{stripDiffTag(fb.explanation)}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Nav Bar ── */}
      <div className={styles.navBar}>
        <div className={styles.navLeft}>
          <button
            className={styles.btnNav}
            onClick={() => setCurrent(Math.max(0, current - 1))}
            disabled={current === 0}
          >
            <ChevronLeft size={15} /> Previous
          </button>
        </div>

        <div className={styles.navCenter}>
          <Target size={12} />
          {answeredCount} answered · {questions.length - answeredCount} remaining
        </div>

        <div className={styles.navRight}>
          {current < questions.length - 1 ? (
            <button className={styles.btnNav} onClick={() => setCurrent(current + 1)}>
              Next <ChevronRight size={15} />
            </button>
          ) : (
            <button className={styles.btnFinish} onClick={finishReview}>
              <CheckCircle2 size={14} /> Finish Review
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
