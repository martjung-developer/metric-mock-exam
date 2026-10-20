// app/(auth)/signup/page.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Student-only signup wizard — 4 steps: id → credentials → program → review.
// Non-student IDs are rejected with an inline error on step 1.
// ─────────────────────────────────────────────────────────────────────────────
'use client'

import { useEffect, useState }    from 'react'
import Link                       from 'next/link'
import { motion }                 from 'framer-motion'
import {
  AlertCircle, ArrowRight, ArrowLeft,
  CheckCircle, Eye, EyeOff, Phone, Zap, Loader2,
} from 'lucide-react'
import { useSignup, SIGNUP_STEPS } from '@/lib/hooks/auth/useSignup'
import type { SignupProgram }      from '@/lib/hooks/auth/useSignup'
import { createClient }            from '@/lib/supabase/client'

const YEAR_LEVEL_OPTIONS = [
  { value: 1, label: '1st' },
  { value: 2, label: '2nd' },
  { value: 3, label: '3rd' },
  { value: 4, label: '4th' },
  { value: 5, label: '5th' },
]

import { SignupSuccessModal }  from '@/components/auth/signup/SuccessModal'
import styles from '../auth.module.css'

// ── Step heading metadata ─────────────────────────────────────────────────────

const STEP_META = {
  id:          { title: "Let's get started",   subtitle: 'Enter your school-issued Student ID'              },
  credentials: { title: 'Create your account', subtitle: 'Your name, contact info, and a secure password'   },
  program:     { title: 'Choose your program',  subtitle: 'Select your program and current year level'       },
  review:      { title: 'Confirm & create',     subtitle: 'Review your details before creating your account' },
} as const

// ── Strength bar → CSS class ──────────────────────────────────────────────────

type StrengthKey = 'weak' | 'fair' | 'good' | 'strong'
const STRENGTH_MAP: Record<StrengthKey, string> = {
  weak:   'strengthWeak',
  fair:   'strengthFair',
  good:   'strengthGood',
  strong: 'strengthStrong',
}

function strengthCls(s: StrengthKey | null): string {
  if (!s) { return '' }
  return (styles as Record<string, string>)[STRENGTH_MAP[s]] ?? ''
}

// ── Shared back button style ──────────────────────────────────────────────────

const BACK_BTN: React.CSSProperties = {
  flex:         '0 0 auto',
  padding:      '0.65rem 0.85rem',
  background:   '#f1f5f9',
  border:       '1px solid #e2e8f0',
  borderRadius: 10,
  cursor:       'pointer',
  display:      'flex',
  alignItems:   'center',
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function SignupPage() {
  const supabase = createClient()
  const {
    state, stepIndex, loading, error, showPw, strength,
    patch, togglePw,
    goBack,
    handleIdNext, handleCredentialsNext, handleProgramNext,
    handleSignupWithReturn,
  } = useSignup()

  const [showSuccess,  setShowSuccess]  = useState(false)
  const [createdEmail, setCreatedEmail] = useState('')
  const [emailConfirmationRequired, setEmailConfirmationRequired] = useState(false)
  const [programs, setPrograms] = useState<SignupProgram[]>([])
  const [programsLoading, setProgramsLoading] = useState(true)
  const selectedProgram = state.selectedProgram
  const maxYear = selectedProgram?.years ?? 4

  useEffect(() => {
    let mounted = true
    async function loadPrograms() {
      setProgramsLoading(true)
      const { data } = await supabase
        .from('programs')
        .select('id, code, name, full_name, major, years, school_id')
        .order('code')
      if (!mounted) { return }
      setPrograms(data ?? [])
      setProgramsLoading(false)
    }
    void loadPrograms()
    return () => {
      mounted = false
    }
  }, [supabase])

  const { title, subtitle } = STEP_META[state.step]

  async function handleSubmit() {
    const result = await handleSignupWithReturn()
    if (result.success) {
      setCreatedEmail(state.email)
      setEmailConfirmationRequired(result.emailConfirmationRequired ?? false)
      setShowSuccess(true)
    }
  }

  return (
    <>
      {showSuccess && (
        <SignupSuccessModal
          email={createdEmail}
          emailConfirmationRequired={emailConfirmationRequired}
          onClose={() => setShowSuccess(false)}
        />
      )}

      <div className={styles.authPage}>
        <motion.div
          className={styles.card}
          key={state.step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        >
          {/* ── Logo icon ── */}
          <div className={styles.logoIcon}>
            <Zap size={22} color="#ffffff" strokeWidth={2.5} />
          </div>

          {state.step === 'id' && (
            <div style={{ marginBottom: '0.25rem' }}>
              <Link href="/welcome" className={styles.backToSite}>← Back to site</Link>
            </div>
          )}

          {/* ── Step dots ── */}
          <div className={styles.stepRow}>
            {SIGNUP_STEPS.map((s, i) => (
              <div
                key={s}
                className={[
                  styles.stepDot,
                  i === stepIndex ? styles.stepDotActive : '',
                  i  < stepIndex  ? styles.stepDotDone   : '',
                ].join(' ')}
              />
            ))}
          </div>

          <h1 className={styles.heading}>{title}</h1>
          <p className={styles.subheading}>{subtitle}</p>

          {/* Student-only notice — step 1 only */}
          {state.step === 'id' && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.55rem 0.8rem', marginBottom: '1rem',
              background: '#f0fdf4', border: '1px solid #bbf7d0',
              borderRadius: '9px', fontSize: '0.75rem',
              color: '#15803d', fontWeight: 500,
            }}>
              <CheckCircle size={13} style={{ flexShrink: 0 }} />
              Student registration only. Faculty &amp; admin accounts are managed by your institution.
            </div>
          )}

          {/* ── Error banner ── */}
          {error && (
            <div className={styles.errorBanner} style={{ marginBottom: '0.75rem' }}>
              <AlertCircle size={14} style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}

          {/* ══ STEP 1: Student ID ══ */}
          {state.step === 'id' && (
            <div className={styles.form}>
              <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="student-id">Student ID</label>
                <input
                  id="student-id"
                  className={styles.input}
                  type="text"
                  placeholder="YY-NNNN-NNN  (e.g. 23-0249-605)"
                  value={state.studentId}
                  onChange={(e) => patch({ studentId: e.target.value })}
                  autoComplete="off"
                  spellCheck={false}
                />
                <span className={styles.fieldHint}>
                  Format: YY-NNNN-NNN — issued by your school
                </span>
              </div>

              <motion.button
                type="button"
                className={styles.submitBtn}
                onClick={handleIdNext}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.985 }}
              >
                Continue <ArrowRight size={15} strokeWidth={2.5} />
              </motion.button>

              <p className={styles.switchPrompt}>
                Already have an account?{' '}
                <Link href="/login" className={styles.switchLink}>Sign in</Link>
              </p>
            </div>
          )}

          {/* ══ STEP 2: Name + email + phone + password ══ */}
          {state.step === 'credentials' && (
            <div className={styles.form}>
              <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="signup-fullname">Full Name</label>
                <input
                  id="signup-fullname"
                  className={styles.input}
                  type="text"
                  placeholder="e.g. Juan Dela Cruz"
                  value={state.fullName}
                  onChange={(e) => patch({ fullName: e.target.value })}
                  autoComplete="name"
                  spellCheck={false}
                />
                <span className={styles.fieldHint}>
                  Enter your name exactly as it appears on school records.
                </span>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="signup-email">Email Address</label>
                <input
                  id="signup-email"
                  className={styles.input}
                  type="email"
                  placeholder="you@email.com"
                  value={state.email}
                  onChange={(e) => patch({ email: e.target.value })}
                  autoComplete="email"
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="signup-phone">
                  Phone Number{' '}
                  <span style={{ fontWeight: 400, color: '#94a3b8', fontSize: '0.7rem' }}>(optional)</span>
                </label>
                <div className={styles.inputWrap}>
                  <Phone size={15} strokeWidth={2} className={styles.inputIcon} />
                  <input
                    id="signup-phone"
                    className={`${styles.input} ${styles.inputHasIcon}`}
                    type="tel"
                    placeholder="09XXXXXXXXX or +639XXXXXXXXX"
                    value={state.phone}
                    onChange={(e) => patch({ phone: e.target.value })}
                    autoComplete="tel"
                  />
                </div>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="signup-password">Password</label>
                <div className={styles.inputWrap}>
                  <input
                    id="signup-password"
                    className={styles.input}
                    type={showPw ? 'text' : 'password'}
                    placeholder="Min. 8 characters"
                    value={state.password}
                    onChange={(e) => patch({ password: e.target.value })}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className={styles.inputToggle}
                    onClick={togglePw}
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                  >
                    {showPw
                      ? <EyeOff size={15} strokeWidth={2} />
                      : <Eye   size={15} strokeWidth={2} />}
                  </button>
                </div>
                {strength && (
                  <div className={`${styles.strengthRow} ${strengthCls(strength)}`}>
                    {[0, 1, 2, 3].map((i) => <div key={i} className={styles.strengthBar} />)}
                    <span className={styles.strengthLabel}>
                      {{ weak: 'Weak', fair: 'Fair', good: 'Good', strong: 'Strong' }[strength]}
                    </span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="button" onClick={goBack} style={BACK_BTN}>
                  <ArrowLeft size={15} color="#64748b" />
                </button>
                <motion.button
                  type="button"
                  className={styles.submitBtn}
                  style={{ flex: 1, marginTop: 0 }}
                  onClick={handleCredentialsNext}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.985 }}
                >
                  Continue <ArrowRight size={15} strokeWidth={2.5} />
                </motion.button>
              </div>
            </div>
          )}

          {/* ══ STEP 3: Program + year level ══ */}
          {state.step === 'program' && (
            <div className={styles.form}>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Program</label>
                <div className={styles.programGrid}>
                  {programs.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className={[
                        styles.programBtn,
                        state.programCode === p.code ? styles.programBtnActive : '',
                      ].join(' ')}
                      onClick={() => patch({
                        programCode: p.code,
                        selectedProgram: p,
                        yearLevel: state.yearLevel !== null && state.yearLevel > (p.years ?? 4)
                          ? null
                          : state.yearLevel,
                      })}
                    >
                      {p.code}
                    </button>
                  ))}
                </div>
                {programsLoading && (
                  <p style={{ fontSize: '0.75rem', color: '#64748b', textAlign: 'center', margin: '0.35rem 0 0' }}>
                    Loading programs...
                  </p>
                )}
                {!programsLoading && programs.length === 0 && (
                  <p style={{ fontSize: '0.75rem', color: '#dc2626', textAlign: 'center', margin: '0.35rem 0 0' }}>
                    No programs found in database.
                  </p>
                )}
                {selectedProgram && (
                  <p style={{
                    fontSize: '0.75rem', color: '#6366f1',
                    fontWeight: 500, textAlign: 'center', margin: '0.35rem 0 0',
                  }}>
                    {selectedProgram.full_name}
                  </p>
                )}
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label}>Year Level</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.4rem' }}>
                  {Array.from({ length: maxYear }, (_, i) => i + 1).map((year) => {
                    const yr = YEAR_LEVEL_OPTIONS.find((option) => option.value === year) ?? {
                      value: year,
                      label: String(year),
                    }
                    const active = state.yearLevel === yr.value
                    return (
                      <button
                        key={yr.value}
                        type="button"
                        onClick={() => patch({ yearLevel: yr.value })}
                        style={{
                          padding: '0.5rem 0.25rem', borderRadius: '9px',
                          border: `1.5px solid ${active ? '#6366f1' : '#e2e8f0'}`,
                          background: active ? '#eef2ff' : '#fff',
                          color: active ? '#4338ca' : '#475569',
                          fontFamily: 'inherit', fontSize: '0.75rem',
                          fontWeight: active ? 700 : 500,
                          cursor: 'pointer', transition: 'all 0.15s ease',
                          textAlign: 'center' as const,
                        }}
                      >
                        {yr.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="button" onClick={goBack} style={BACK_BTN}>
                  <ArrowLeft size={15} color="#64748b" />
                </button>
                <motion.button
                  type="button"
                  className={styles.submitBtn}
                  style={{ flex: 1, marginTop: 0 }}
                  onClick={handleProgramNext}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.985 }}
                >
                  Continue <ArrowRight size={15} strokeWidth={2.5} />
                </motion.button>
              </div>
            </div>
          )}

          {/* ══ STEP 4: Review + submit ══ */}
          {state.step === 'review' && (
            <div className={styles.form}>
              <div style={{
                background: '#f8fafc', border: '1px solid #e2e8f0',
                borderRadius: 10, padding: '0.85rem 1rem',
                display: 'flex', flexDirection: 'column' as const, gap: '0.4rem',
              }}>
                {(
                  [
                    { label: 'Student ID', value: state.studentId },
                    { label: 'Full Name',  value: state.fullName  },
                    { label: 'Email',      value: state.email     },
                    { label: 'Phone',      value: state.phone || '—' },
                    {
                      label: 'Program',
                      value: selectedProgram
                        ? selectedProgram.full_name
                        : '—',
                    },
                    {
                      label: 'Year Level',
                      value: state.yearLevel !== null
                        ? (YEAR_LEVEL_OPTIONS.find((y) => y.value === state.yearLevel)?.label ?? '—')
                        : '—',
                    },
                  ] satisfies Array<{ label: string; value: string }>
                ).map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.79rem' }}>
                    <span style={{ color: '#64748b', fontWeight: 500 }}>{label}</span>
                    <span style={{ color: '#0f172a', fontWeight: 600, maxWidth: '60%', textAlign: 'right' as const, wordBreak: 'break-word' }}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>

              <p style={{ fontSize: '0.78rem', color: '#64748b', textAlign: 'center', margin: 0 }}>
                Your account will be created instantly. You can log in right away.
              </p>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="button" onClick={goBack} style={BACK_BTN}>
                  <ArrowLeft size={15} color="#64748b" />
                </button>
                <motion.button
                  type="button"
                  className={styles.submitBtn}
                  style={{ flex: 1, marginTop: 0 }}
                  disabled={loading}
                  onClick={handleSubmit}
                  whileHover={loading ? {} : { y: -1 }}
                  whileTap={loading  ? {} : { scale: 0.985 }}
                >
                  {loading
                    ? <><Loader2 size={15} className={styles.spinnerIcon} /> Creating account…</>
                    : <> Create Account <ArrowRight size={15} strokeWidth={2.5} /></>}
                </motion.button>
              </div>
            </div>
          )}

        </motion.div>
      </div>
    </>
  )
}
