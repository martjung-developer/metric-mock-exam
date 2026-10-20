// components/dashboard/student/mock-exams/AttemptHistoryModal.tsx
//
// FIXED:
//  1. Shows score, percentage, passed status per attempt
//  2. Highlights the latest attempt
//  3. Displays attempt_no explicitly
//  4. Shows "X / 3 attempts used" summary
// ─────────────────────────────────────────────────────────────────────────────

import { X, CheckCircle2, Clock, RotateCcw, Trophy, AlertCircle } from 'lucide-react'
import type { ExamAttempt }  from '@/lib/types/student/mock-exams/mock-exams'
import { MAX_ATTEMPTS }      from '@/lib/types/student/mock-exams/mock-exams'
import styles                from '@/app/(dashboard)/student/mock-exams/[examId]/mock.module.css'

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatAttemptTime(secs: number | null): string {
  if (secs === null) {return '—'}
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  if (h > 0)  {return `${h}h ${m}m`}
  if (m > 0)  {return `${m}m ${s}s`}
  return `${s}s`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-PH', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function StatusChip({ status }: { status: ExamAttempt['status'] }) {
  if (status === 'in_progress') {
    return (
      <span className={`${styles.attemptStatus} ${styles.statusInProgress}`}>
        <RotateCcw size={12} /> In Progress
      </span>
    )
  }
  return (
    <span className={`${styles.attemptStatus} ${styles.statusSubmitted}`}>
      <CheckCircle2 size={12} /> {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  attempts: ExamAttempt[]
  onClose:  () => void
}

export function AttemptHistoryModal({ attempts, onClose }: Props) {
  const completedAttempts = attempts.filter((a) => a.status !== 'in_progress')
  const attemptsLeft      = Math.max(0, MAX_ATTEMPTS - completedAttempts.length)

  // Sort by attempt_no ascending so latest is last (we'll highlight it)
  const sorted = [...attempts].sort((a, b) => a.attempt_no - b.attempt_no)
  const latest = sorted[sorted.length - 1]

  return (
    <div
      className={styles.overlay}
      onClick={(e) => { if (e.target === e.currentTarget) {onClose()} }}
    >
      <div className={`${styles.modal} ${styles.modalWide}`}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle} style={{ margin: 0 }}>Attempt History</h2>
          <button className={styles.btnIconClose} onClick={onClose} aria-label="Close">
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* Attempt quota summary */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.6rem 0.9rem', borderRadius: 8, marginBottom: '0.75rem',
          background: attemptsLeft === 0 ? '#fef2f2' : '#eff6ff',
          border: `1.5px solid ${attemptsLeft === 0 ? '#fecaca' : '#bfdbfe'}`,
          fontSize: '0.82rem',
          color: attemptsLeft === 0 ? '#dc2626' : '#1e40af',
        }}>
          {attemptsLeft === 0
            ? <AlertCircle size={14} />
            : <Trophy size={14} />
          }
          <strong>{completedAttempts.length} of {MAX_ATTEMPTS}</strong> attempts used
          {attemptsLeft > 0 && (
            <span style={{ marginLeft: 'auto', opacity: 0.75 }}>
              {attemptsLeft} remaining
            </span>
          )}
          {attemptsLeft === 0 && (
            <span style={{ marginLeft: 'auto', fontWeight: 600 }}>
              No attempts left
            </span>
          )}
        </div>

        {/* Attempt rows */}
        {sorted.length === 0 ? (
          <p className={styles.modalBody} style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            No previous attempts found.
          </p>
        ) : (
          <div className={styles.attemptList}>
            {sorted.map((a) => {
              const isLatest  = a.id === latest?.id
              const hasPassed = a.passed === true

              return (
                <div
                  key={a.id}
                  className={styles.attemptRow}
                  style={isLatest ? {
                    borderLeft: '3px solid #0d2540',
                    background: '#f8fafc',
                  } : undefined}
                >
                  <div className={styles.attemptMeta}>
                    <span className={styles.attemptNum}>
                      Attempt {a.attempt_no}
                      {isLatest && (
                        <span style={{
                          marginLeft: 6, fontSize: '0.7rem', fontWeight: 700,
                          padding: '0.1rem 0.4rem', borderRadius: 99,
                          background: '#0d2540', color: '#fff',
                        }}>
                          Latest
                        </span>
                      )}
                    </span>
                    <span className={styles.attemptDate}>{formatDate(a.started_at)}</span>
                  </div>

                  <div className={styles.attemptStats}>
                    <StatusChip status={a.status} />

                    <span className={styles.attemptStat}>
                      <Clock size={12} /> {formatAttemptTime(a.time_spent_seconds)}
                    </span>

                    {a.percentage !== null && (
                      <span
                        className={styles.attemptStat}
                        style={{ fontWeight: 700, color: hasPassed ? '#059669' : '#dc2626' }}
                      >
                        {a.percentage.toFixed(1)}%
                        {hasPassed
                          ? <CheckCircle2 size={12} style={{ marginLeft: 3, color: '#059669' }} />
                          : <AlertCircle  size={12} style={{ marginLeft: 3, color: '#dc2626' }} />
                        }
                      </span>
                    )}

                    {a.score !== null && (
                      <span className={styles.attemptStat} style={{ color: '#475569' }}>
                        Score: {a.score}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className={styles.modalActions} style={{ marginTop: '1rem' }}>
          <button
            className={styles.btnModalConfirm}
            onClick={onClose}
            style={{ flex: 'none', minWidth: 100 }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}