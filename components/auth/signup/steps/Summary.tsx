// components/auth/signup/steps/Step4Summary.tsx
import { motion }           from 'framer-motion'
import { ArrowRight }       from 'lucide-react'
import type { SignupState } from '@/lib/types/auth/'
import type { ProgramCode } from '@/lib/types/auth/'
import {
  isProgramCode,
  getProgramLabel,
  getYearLabel,
} from '@/lib/utils/auth/'
import { SignupBackButton } from '../SignupBackButton'
import styles from '@/app/(auth)/auth.module.css'

interface Step4SummaryProps {
  state:    SignupState
  loading:  boolean
  onBack:   () => void
  onSubmit: () => void
}

interface SummaryRow {
  label: string
  value: string
}

export function Step4Summary({ state, loading, onBack, onSubmit }: Step4SummaryProps) {
  const rows: SummaryRow[] = [
    { label: 'Student ID',  value: state.studentId },
    { label: 'Full Name',   value: state.fullName  },
    { label: 'Email',       value: state.email     },
    {
      label: 'Program',
      value: isProgramCode(state.programCode)
        ? getProgramLabel(state.programCode as ProgramCode)
        : '—',
    },
    {
      label: 'Year Level',
      value: getYearLabel(state.yearLevel),
    },
  ]

  return (
    <div className={styles.form}>
      {/* Summary card */}
      <div style={{
        background:    '#f8fafc',
        border:        '1px solid #e2e8f0',
        borderRadius:  10,
        padding:       '0.85rem 1rem',
        display:       'flex',
        flexDirection: 'column' as const,
        gap:           '0.4rem',
      }}>
        {rows.map(({ label, value }) => (
          <div
            key={label}
            style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.79rem' }}
          >
            <span style={{ color: '#64748b', fontWeight: 500 }}>{label}</span>
            <span style={{
              color:      '#0f172a',
              fontWeight: 600,
              maxWidth:   '60%',
              textAlign:  'right' as const,
              wordBreak:  'break-word',
            }}>
              {value}
            </span>
          </div>
        ))}
      </div>

      <p style={{ fontSize: '0.78rem', color: '#64748b', textAlign: 'center', margin: 0 }}>
        A verification code will be sent to your email after account creation.
      </p>

      {/* Nav */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <SignupBackButton onClick={onBack} />
        <motion.button
          type="button"
          className={styles.submitBtn}
          style={{ flex: 1, marginTop: 0 }}
          disabled={loading}
          onClick={onSubmit}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.985 }}
        >
          {loading
            ? 'Creating account…'
            : <> Create Account <ArrowRight size={15} strokeWidth={2.5} /></>
          }
        </motion.button>
      </div>
    </div>
  )
}