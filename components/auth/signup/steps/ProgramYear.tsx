// components/auth/signup/steps/Step3ProgramYear.tsx
import { motion }            from 'framer-motion'
import { ArrowRight }        from 'lucide-react'
import type { SignupState }  from '@/lib/types/auth/'
import type { YearLevel }    from '@/lib/types/auth/'
import { PROGRAMS, YEAR_LEVEL_OPTIONS } from '@/lib/types/auth/'
import { SignupBackButton }  from '../SignupBackButton'
import styles from '@/app/(auth)/auth.module.css'

interface Step3ProgramYearProps {
  programCode: SignupState['programCode']
  yearLevel:   SignupState['yearLevel']
  onChange:    (partial: Partial<Pick<SignupState, 'programCode' | 'yearLevel'>>) => void
  onNext:      () => void
  onBack:      () => void
}

export function Step3ProgramYear({
  programCode, yearLevel, onChange, onNext, onBack,
}: Step3ProgramYearProps) {
  return (
    <div className={styles.form}>

      {/* ── Program ── */}
      <div className={styles.fieldGroup}>
        <label className={styles.label}>Program</label>
        <div className={styles.programGrid}>
          {PROGRAMS.map((p) => (
            <button
              key={p.value}
              type="button"
              className={[
                styles.programBtn,
                programCode === p.value ? styles.programBtnActive : '',
              ].join(' ')}
              onClick={() => onChange({ programCode: p.value })}
            >
              {p.value}
            </button>
          ))}
        </div>

        {programCode && (
          <p style={{
            fontSize:   '0.75rem',
            color:      '#6366f1',
            fontWeight: 500,
            textAlign:  'center',
            margin:     '0.35rem 0 0',
          }}>
            {PROGRAMS.find((program) => program.value === programCode)?.label ?? programCode}
          </p>
        )}
      </div>

      {/* ── Year Level ── */}
      <div className={styles.fieldGroup}>
        <label className={styles.label}>Year Level</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.4rem' }}>
          {YEAR_LEVEL_OPTIONS.map((yr) => {
            const isActive = yearLevel === yr.value
            return (
              <button
                key={yr.value}
                type="button"
                onClick={() => onChange({ yearLevel: yr.value as YearLevel })}
                style={{
                  padding:      '0.5rem 0.25rem',
                  borderRadius: '9px',
                  border:       `1.5px solid ${isActive ? '#6366f1' : '#e2e8f0'}`,
                  background:   isActive ? '#eef2ff' : '#fff',
                  color:        isActive ? '#4338ca' : '#475569',
                  fontFamily:   'inherit',
                  fontSize:     '0.75rem',
                  fontWeight:   isActive ? 700 : 500,
                  cursor:       'pointer',
                  transition:   'all 0.15s ease',
                  textAlign:    'center' as const,
                }}
              >
                {yr.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Nav ── */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <SignupBackButton onClick={onBack} />
        <motion.button
          type="button"
          className={styles.submitBtn}
          style={{ flex: 1, marginTop: 0 }}
          onClick={onNext}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.985 }}
        >
          Continue <ArrowRight size={15} strokeWidth={2.5} />
        </motion.button>
      </div>
    </div>
  )
}