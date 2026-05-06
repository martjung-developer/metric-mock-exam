// app/(auth)/login/page.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Reads ?role= query param as a UI hint only.
// Actual role is detected from ID input via detectRoleFromId() — this is the
// SOURCE OF TRUTH and overrides the query param for the final redirect.
//
// Detection badge behaviour:
//   • Student IDs  → immediately show "Detected: Student"
//   • Staff IDs    → show "Detected: Staff (PREFIX)" until the server resolves
//                    the actual role; after login the server role is authoritative.
//   • Mismatch     → warn but allow sign-in; server role wins.
// ─────────────────────────────────────────────────────────────────────────────
'use client'

import { useState, useEffect }     from 'react'
import Image                       from 'next/image'
import Link                        from 'next/link'
import { useSearchParams }         from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, ArrowRight, AlertCircle, ArrowLeft } from 'lucide-react'
import { MoleculeBackground }      from '@/animations/auth/MoleculeBackground'
import {
  signInWithId, signInWithGoogle, signInWithFacebook,
} from '@/lib/services/auth'
import {
  detectRoleFromId,
  validateLoginId,
  getStaffPrefix,
} from '@/lib/utils/auth'
import type { UserRole } from '@/lib/types/auth'
import styles from '../auth.module.css'

// ── Constants ─────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<UserRole, string> = {
  student: 'Student',
  faculty: 'Faculty',
  admin:   'Department Admin',
}

// ── Animation variants ────────────────────────────────────────────────────────

const cardAnim = {
  initial:    { opacity: 0, y: 18, scale: 0.97 },
  animate:    { opacity: 1, y: 0,  scale: 1    },
  transition: { duration: 0.42, ease: [0.34, 1.2, 0.64, 1] as const },
}

const fieldAnim = (delay = 0) => ({
  initial:    { opacity: 0, y: 8 },
  animate:    { opacity: 1, y: 0 },
  transition: { duration: 0.28, delay },
})

// ── Helpers ───────────────────────────────────────────────────────────────────

function isValidRole(v: string | null): v is UserRole {
  return v === 'student' || v === 'faculty' || v === 'admin'
}

/**
 * Returns the label shown in the detection badge BEFORE the server resolves
 * the user's actual role.
 *
 * - Student ID  → "Student"
 * - Staff ID    → "Staff (PREFIX)"   e.g. "Staff (SSLATE)"
 * - Unknown     → null (badge hidden)
 */
function getPreResolveBadgeLabel(userId: string): string | null {
  const role   = detectRoleFromId(userId)
  if (!role) { return null }

  if (role === 'student') { return 'Student' }

  // Staff — show prefix only (admin vs faculty is resolved by the server)
  const prefix = getStaffPrefix(userId)
  return prefix ? `Staff (${prefix})` : 'Staff'
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const searchParams = useSearchParams()
  const queryRole    = searchParams.get('role')
  const selectedRole = isValidRole(queryRole) ? queryRole : null

  const [userId,       setUserId]       = useState('')
  const [password,     setPassword]     = useState('')
  const [showPw,       setShowPw]       = useState(false)
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState<string | null>(null)
  const [idError,      setIdError]      = useState<string | null>(null)

  // Pre-resolve: what the ID format implies (used for badge + mismatch check)
  const [detectedRole, setDetectedRole] = useState<UserRole | null>(null)

  // The label shown in the detection badge before server resolve
  const [badgeLabel,   setBadgeLabel]   = useState<string | null>(null)

  const [mismatch,     setMismatch]     = useState(false)

  // ── Real-time ID analysis ─────────────────────────────────────────────────
  useEffect(() => {
    const detected = detectRoleFromId(userId)
    setDetectedRole(detected)
    setBadgeLabel(getPreResolveBadgeLabel(userId))

    // Mismatch: only flag when the selected role and detected role are both
    // known and they disagree.
    if (detected && selectedRole && detected !== selectedRole) {
      setMismatch(true)
    } else {
      setMismatch(false)
    }
  }, [userId, selectedRole])

  function validateIdOnBlur() {
    if (!userId.trim()) { return }
    const err = validateLoginId(userId)
    if (err) { setIdError(err) } else { setIdError(null) }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (loading) { return }

    setError(null)
    setIdError(null)

    const idErr = validateLoginId(userId)
    if (idErr) { setIdError(idErr); return }

    if (!password) { setError('Please enter your password.'); return }

    // Mismatch warning — inform user but proceed; detected role may be wrong
    // at the prefix level (admin vs faculty). Server is authoritative.
    if (mismatch && detectedRole) {
      setError(
        `Your ID was detected as ${ROLE_LABELS[detectedRole]}, ` +
        `not ${selectedRole ? ROLE_LABELS[selectedRole] : 'the selected role'}. ` +
        `Signing in as ${ROLE_LABELS[detectedRole]}.`
      )
      // Do not return — allow sign-in to proceed.
    }

    setLoading(true)
    const result = await signInWithId(userId.trim(), password)
    setLoading(false)

    if (!result.success) {
      if (result.error?.toLowerCase().includes('not found')) {
        setIdError('ID not found.')
      } else if (result.error?.toLowerCase().includes('password')) {
        setError('Incorrect password.')
      } else {
        setError(result.error || 'Login failed.')
      }
      return
    }

    window.location.href = result.redirectTo
  }

  async function handleGoogle() {
    setError(null)
    const result = await signInWithGoogle()
    if (!result.success) { setError(result.error) }
  }

  async function handleFacebook() {
    setError(null)
    const result = await signInWithFacebook()
    if (!result.success) { setError(result.error) }
  }

  return (
    <>
      <MoleculeBackground />

      <div className={styles.authPage}>
        <motion.div className={styles.card} {...cardAnim}>

          {/* ── Back + Logo row ── */}
          <div className={styles.logoWrap} style={{ position: 'relative' }}>
            <Link href="/role-select" className={styles.cardBackLink} aria-label="Back to role selection">
              <ArrowLeft size={13} strokeWidth={2} />
              Back
            </Link>
            <Image
              src="/images/veripraxis-logo.png"
              alt="VeriPraxis"
              height={44}
              width={160}
              className={styles.logoImg}
              priority
              onError={(e) => {
                const parent = e.currentTarget.parentElement
                if (parent) {
                  parent.innerHTML = '<span class="logoTextFallback">Veri<em>Praxis</em></span>'
                }
              }}
            />
          </div>

          {/* ── Selected role hint pill ── */}
          {selectedRole && (
            <div className={styles.roleHintRow}>
              <span className={styles.roleHintLabel}>Signing in as</span>
              <span className={styles.roleHintPill} data-role={selectedRole}>
                {ROLE_LABELS[selectedRole]}
              </span>
              <Link href="/role-select" className={styles.roleHintChange}>
                Change
              </Link>
            </div>
          )}

          <h1 className={styles.heading}>Welcome back</h1>
          <p className={styles.subheading}>Enter your credentials to access your account</p>

          {/* ── Error / warning banner ── */}
          <AnimatePresence>
            {error && (
              <motion.div
                className={`${styles.errorBanner} ${mismatch ? styles.errorBannerWarn : ''}`}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ marginBottom: '0.75rem' }}
              >
                <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form className={styles.form} onSubmit={handleSubmit} noValidate>

            {/* ── ID Number ── */}
            <motion.div className={styles.fieldGroup} {...fieldAnim(0)}>
              <div className={styles.fieldRow}>
                <label className={styles.label} htmlFor="login-id">
                  ID NUMBER
                </label>

                {/*
                  Detection badge:
                  • Student IDs  → "✓ Detected: Student"
                  • Staff IDs    → "✓ Detected: Staff (SSLATE)"
                    The actual admin/faculty split is shown only after the server
                    resolves it (redirect URL reveals the dashboard, not this badge).
                  • Mismatch     → "⚠ Detected: Student" / "⚠ Detected: Staff (…)"
                */}
                <AnimatePresence>
                  {badgeLabel && (
                    <motion.span
                      className={`${styles.detectedBadge} ${mismatch ? styles.detectedBadgeMismatch : ''}`}
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.85 }}
                      transition={{ duration: 0.18 }}
                    >
                      {mismatch ? '⚠ ' : '✓ '}Detected: {badgeLabel}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>

              <input
                id="login-id"
                className={`${styles.input} ${idError ? styles.inputError : ''} ${mismatch ? styles.inputMismatch : ''}`}
                type="text"
                placeholder="23-0249-605  or  SBIT-16113"
                value={userId}
                onChange={(e) => { setUserId(e.target.value); setIdError(null); setError(null) }}
                onBlur={validateIdOnBlur}
                autoComplete="username"
                spellCheck={false}
              />

              {idError && <span className={styles.fieldError}>{idError}</span>}

              {mismatch && detectedRole && !idError && (
                <span className={styles.fieldWarn}>
                  ID does not match selected role — will sign in as {ROLE_LABELS[detectedRole]}.
                </span>
              )}
            </motion.div>

            {/* ── Password ── */}
            <motion.div className={styles.fieldGroup} {...fieldAnim(0.06)}>
              <div className={styles.fieldRow}>
                <label className={styles.label} htmlFor="login-password">Password</label>
                <Link href="/forgot-password" className={styles.forgotLink}>Forgot password?</Link>
              </div>
              <div className={styles.inputWrap}>
                <input
                  id="login-password"
                  className={styles.input}
                  type={showPw ? 'text' : 'password'}
                  placeholder="•••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className={styles.inputToggle}
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw
                    ? <EyeOff size={15} strokeWidth={2} />
                    : <Eye   size={15} strokeWidth={2} />}
                </button>
              </div>
            </motion.div>

            {/* ── Submit ── */}
            <motion.button
              type="submit"
              className={styles.submitBtn}
              disabled={loading}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.985 }}
            >
              {loading
                ? 'Signing in…'
                : <> Log in <ArrowRight size={15} strokeWidth={2.5} /></>}
            </motion.button>

            {/* ── Divider ── */}
            <div className={styles.divider}>
              <div className={styles.dividerLine} />
              <span className={styles.dividerText}>Or continue with</span>
              <div className={styles.dividerLine} />
            </div>

            {/* ── Social buttons ── */}
            <div className={styles.socialGroup}>
              <GoogleButton   onClick={() => void handleGoogle()} />
              <FacebookButton onClick={() => void handleFacebook()} />
            </div>

            {/* ── Switch ── */}
            <p className={styles.switchPrompt}>
              Don&apos;t have an account?{' '}
              <Link href="/signup" className={styles.switchLink}>Sign up</Link>
            </p>

          </form>
        </motion.div>
      </div>
    </>
  )
}

// ── Social button sub-components ──────────────────────────────────────────────

function GoogleButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className={styles.googleBtn} onClick={onClick}>
      <svg className={styles.googleIcon} viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      Continue with Google
    </button>
  )
}

function FacebookButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className={styles.facebookBtn} onClick={onClick}>
      <svg className={styles.facebookIcon} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M24 12.073C24 5.406 18.627 0 12 0S0 5.406 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047v-2.66c0-3.026 1.792-4.697 4.532-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.514c-1.491 0-1.956.93-1.956 1.886v2.265h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
      </svg>
      Continue with Facebook
    </button>
  )
}