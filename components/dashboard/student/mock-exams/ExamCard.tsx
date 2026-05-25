// components/dashboard/student/mock-exams/ExamCard.tsx
//
// FIXED:
//  1. Shows attempt count badge (e.g. "2 / 3 attempts")
//  2. Handles 'locked' status with a proper locked UI
//  3. Button states map correctly to all 5 statuses
// ─────────────────────────────────────────────────────────────────────────────

'use client'

import {
  BookOpen, Clock, GraduationCap, Lock,
  PlayCircle, RotateCcw, Eye,
} from 'lucide-react'
import { EXAM_TYPE_META }  from '@/lib/types/database'
import type { MockExam }   from '@/lib/types/student/mock-exams/mock-exams'
import { MAX_ATTEMPTS }    from '@/lib/types/student/mock-exams/mock-exams'
import styles              from '@/app/(dashboard)/student/mock-exams/mock-exams.module.css'

// ── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: MockExam['status'] }) {
  const map: Record<MockExam['status'], { label: string; cls: string }> = {
    available:   { label: 'Available',   cls: styles.badgeAvailable  },
    coming_soon: { label: 'Coming Soon', cls: styles.badgeComingSoon },
    in_progress: { label: 'In Progress', cls: styles.badgeInProgress },
    completed:   { label: 'Completed',   cls: styles.badgeCompleted  },
    locked:      { label: 'Locked',      cls: styles.badgeLocked     },
  }
  const { label, cls } = map[status]
  return <span className={`${styles.badge} ${cls}`}>{label}</span>
}

// ── Attempt pip ───────────────────────────────────────────────────────────────

function AttemptPips({ used }: { used: number }) {
  return (
    <div className={styles.attemptPips} title={`${used} of ${MAX_ATTEMPTS} attempts used`}>
      {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => (
        <span
          key={i}
          className={`${styles.pip} ${i < used ? styles.pipUsed : styles.pipEmpty}`}
        />
      ))}
      <span className={styles.pipLabel}>{used}/{MAX_ATTEMPTS}</span>
    </div>
  )
}

// ── Card ──────────────────────────────────────────────────────────────────────

interface Props {
  exam:          MockExam
  onStart:       (id: string) => void
  onContinue:    (id: string) => void
  onViewAttempt: (id: string) => void
}

export function ExamCard({ exam, onStart, onContinue, onViewAttempt }: Props) {
  const isAvailable  = exam.status === 'available'
  const isInProgress = exam.status === 'in_progress'
  const isCompleted  = exam.status === 'completed'
  const isLocked     = exam.status === 'locked'
  const isActive     = isAvailable || isInProgress || isCompleted

  return (
    <div
      className={`${styles.examCard} ${isActive ? styles.examCardAvailable : ''} ${isLocked ? styles.examCardLocked : ''}`}
    >
      <div
        className={`${styles.cardAccent} ${
          isActive  ? styles.cardAccentAvailable :
          isLocked  ? styles.cardAccentLocked    :
          styles.cardAccentSoon
        }`}
      />

      <div className={styles.cardTop}>
        <div
          className={`${styles.cardIconWrap} ${
            isActive  ? styles.cardIconAvailable :
            isLocked  ? styles.cardIconLocked    :
            styles.cardIconSoon
          }`}
        >
          {isLocked
            ? <Lock size={20} strokeWidth={1.75} />
            : <GraduationCap size={20} strokeWidth={1.75} />
          }
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.3rem' }}>
          <span style={{
            display: 'inline-block', padding: '0.18rem 0.55rem', borderRadius: '20px',
            fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.03em',
            background: 'rgba(13,37,64,0.08)', color: '#0d2540', whiteSpace: 'nowrap',
          }}>
            {EXAM_TYPE_META['mock'].label}
          </span>
          <StatusBadge status={exam.status} />
        </div>
      </div>

      <div className={styles.cardBody}>
        <p className={styles.shortCode}>{exam.shortCode}</p>
        <h3 className={styles.programName}>{exam.title}</h3>
        <span className={styles.categoryTag}>{exam.category}</span>
      </div>

      {/* Attempt pips — always visible when assigned */}
      {exam.status !== 'coming_soon' && (
        <AttemptPips used={exam.attemptCount} />
      )}

      {isActive && (
        <div className={styles.cardMeta}>
          <span className={styles.metaItem}>
            <BookOpen size={13} strokeWidth={2} />
            {exam.questions ?? '—'} items
          </span>
          <span className={styles.metaItem}>
            <Clock size={13} strokeWidth={2} />
            {exam.duration ?? '—'}
          </span>
        </div>
      )}

      <div className={styles.cardFooter}>
        {isAvailable && (
          <button className={styles.startBtn} onClick={() => onStart(exam.id)}>
            <PlayCircle size={15} strokeWidth={2} />
            Start Attempt {exam.attemptCount + 1}
          </button>
        )}

        {isInProgress && (
          <button className={styles.continueBtn} onClick={() => onContinue(exam.id)}>
            <RotateCcw size={15} strokeWidth={2} /> Resume Attempt {exam.inProgressAttemptNo ?? (exam.attemptCount + 1)}
          </button>
        )}

        {isCompleted && (
          <button className={styles.disabledBtn} disabled>
            <Eye size={15} strokeWidth={2} /> Results Available
          </button>
        )}

        {isLocked && (
          <button className={styles.disabledBtn} disabled>
            <Lock size={13} strokeWidth={2} />
            Max {MAX_ATTEMPTS} attempts reached
          </button>
        )}

        {exam.status === 'coming_soon' && (
          <button className={styles.disabledBtn} disabled>
            <Lock size={13} strokeWidth={2} /> Waiting for Assignment
          </button>
        )}
      </div>
    </div>
  )
}
