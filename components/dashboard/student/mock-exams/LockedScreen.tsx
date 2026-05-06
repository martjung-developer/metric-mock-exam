// components/dashboard/student/mock-exams/LockedScreen.tsx
//
// NEW: Shown in place of the exam when isLocked === true.
// Replaces the generic "Could not start exam session" error.
// ─────────────────────────────────────────────────────────────────────────────

import { Lock, ArrowLeft } from 'lucide-react'
import { MAX_ATTEMPTS }    from '@/lib/types/student/mock-exams/mock-exams'
import styles              from '@/app/(dashboard)/student/mock-exams/[examId]/mock.module.css'

interface Props {
  attemptsUsed: number
  examTitle:    string
  onBack:       () => void
}

export function LockedScreen({ attemptsUsed, examTitle, onBack }: Props) {
  return (
    <div className={styles.results}>
      <div className={styles.resultsCard}>
        <div
          className={styles.resultsIconWrap}
          style={{ background: '#fef2f2', border: '2px solid #fecaca' }}
        >
          <Lock size={28} color="#dc2626" />
        </div>

        <h1 className={styles.resultsTitle}>Exam Locked</h1>

        <p className={styles.resultsSub}>
          You have used all <strong>{MAX_ATTEMPTS} attempts</strong> for{' '}
          <strong>{examTitle}</strong>.
        </p>

        {/* Attempt pips */}
        <div style={{
          display: 'flex', gap: '0.5rem', justifyContent: 'center',
          margin: '0.5rem 0 1rem',
        }}>
          {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => (
            <span
              key={i}
              style={{
                width: 14, height: 14, borderRadius: '50%',
                background: i < attemptsUsed ? '#dc2626' : '#e5e7eb',
                display: 'inline-block',
              }}
            />
          ))}
        </div>

        <div style={{
          background: '#fef2f2', border: '1.5px solid #fecaca',
          borderRadius: 10, padding: '0.9rem 1.1rem', margin: '0.5rem 0 1rem',
          fontSize: '0.84rem', color: '#991b1b', lineHeight: 1.6, textAlign: 'left',
        }}>
          <strong>Maximum attempts reached.</strong><br />
          You have taken this exam {attemptsUsed} time{attemptsUsed !== 1 ? 's' : ''}. No further
          attempts are allowed. Contact your faculty if you believe this is an error.
        </div>

        <button className={styles.btnBack} onClick={onBack}>
          <ArrowLeft size={15} style={{ marginRight: 6 }} />
          Back to Exams
        </button>
      </div>
    </div>
  )
}