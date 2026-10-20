// components/auth/signup/steps/Step1IdInput.tsx
import Link                  from 'next/link'
import { motion }            from 'framer-motion'
import { ArrowRight, CheckCircle } from 'lucide-react'
import type { SignupState }  from '@/lib/types/auth/'
import { SignupSocialButtons } from '../SignupSocialButtons'
import styles from '@/app/(auth)/auth.module.css'

interface Step1IdInputProps {
  studentId:  SignupState['studentId']
  onChange:   (value: string) => void
  onNext:     () => void
  onGoogle:   () => void
  onFacebook: () => void
}

export function Step1IdInput({
  studentId,
  onChange,
  onNext,
  onGoogle,
  onFacebook,
}: Step1IdInputProps) {
  return (
    <div className={styles.form}>
      {/* Student-only notice */}
      <div style={{
        display:      'flex',
        alignItems:   'flex-start',
        gap:          '0.4rem',
        padding:      '0.55rem 0.8rem',
        background:   '#f0fdf4',
        border:       '1px solid #bbf7d0',
        borderRadius: '9px',
        fontSize:     '0.75rem',
        color:        '#15803d',
        fontWeight:   500,
      }}>
        <CheckCircle size={13} style={{ flexShrink: 0, marginTop: 1 }} />
        Student registration only. Faculty &amp; admin accounts are managed by your institution.
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="student-id">Student ID</label>
        <input
          id="student-id"
          className={styles.input}
          type="text"
          placeholder="STU-YYYYNNNNN  (e.g. STU-202400123)"
          value={studentId}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="off"
          spellCheck={false}
        />
        <span className={styles.fieldHint}>Format: STU-YYYYNNNNN — issued by your school</span>
      </div>

      <motion.button
        type="button"
        className={styles.submitBtn}
        onClick={onNext}
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.985 }}
      >
        Continue <ArrowRight size={15} strokeWidth={2.5} />
      </motion.button>

      <SignupSocialButtons onGoogle={onGoogle} onFacebook={onFacebook} />

      <p className={styles.switchPrompt}>
        Already have an account?{' '}
        <Link href="/login" className={styles.switchLink}>Log in</Link>
      </p>
    </div>
  )
}