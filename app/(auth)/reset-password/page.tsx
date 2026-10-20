// app/(auth)/reset-password/page.tsx
'use client'

import { useState, useMemo } from 'react'
import Image                  from 'next/image'
import Link                   from 'next/link'
import { useRouter }          from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react'
import { MoleculeBackground }  from '@/animations/auth/MoleculeBackground'
import { createClient }        from '@/lib/supabase/client'
import { getPasswordStrength } from '@/lib/utils/auth/'
import styles from '../auth.module.css'

export default function ResetPasswordPage() {
  const router   = useRouter()
  // Stable Supabase client for the lifetime of this page
  const supabase = useMemo(() => createClient(), [])

  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [showPw2,  setShowPw2]  = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [done,     setDone]     = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  const strength = getPasswordStrength(password)
  const mismatch = confirm.length > 0 && password !== confirm

  function strengthClass(s: ReturnType<typeof getPasswordStrength>): string {
    if (!s) {return ''}
    return (styles as Record<string, string>)[`strength${s.charAt(0).toUpperCase()}${s.slice(1)}`] ?? ''
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (mismatch)             { setError("Passwords don't match."); return }
    if (password.length < 8)  { setError('Password must be at least 8 characters.'); return }

    setLoading(true)
    setError(null)

    const { error: authErr } = await supabase.auth.updateUser({ password })

    setLoading(false)

    if (authErr) {
      setError(authErr.message)
      return
    }

    setDone(true)
    setTimeout(() => router.push('/login'), 2500)
  }

  return (
    <>
      <MoleculeBackground />
      <div className={styles.authPage}>
        <motion.div
          className={styles.card}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.34, 1.2, 0.64, 1] }}
        >
          <div className={styles.logoWrap}>
            <Image
              src="/images/metric-logo.png"
              alt="M.E.T.R.I.C."
              height={44}
              width={160}
              className={styles.logoImg}
              priority
            />
          </div>

          <AnimatePresence mode="wait">
            {!done ? (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -8 }}
              >
                <h1 className={styles.heading}>Set new password</h1>
                <p className={styles.subheading}>
                  Choose a strong password to keep your account secure.
                </p>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      className={styles.errorBanner}
                      style={{ marginBottom: '0.75rem' }}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <AlertCircle size={14} style={{ flexShrink: 0 }} />
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <form className={styles.form} onSubmit={handleSubmit} noValidate>
                  {/* New password */}
                  <div className={styles.fieldGroup}>
                    <label className={styles.label} htmlFor="new-pw">New Password</label>
                    <div className={styles.inputWrap}>
                      <Lock size={15} strokeWidth={2} className={styles.inputIcon} />
                      <input
                        id="new-pw"
                        className={`${styles.input} ${styles.inputHasIcon}`}
                        type={showPw ? 'text' : 'password'}
                        placeholder="Min. 8 characters"
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setError(null) }}
                        autoComplete="new-password"
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
                    {strength && (
                      <div className={`${styles.strengthRow} ${strengthClass(strength)}`}>
                        {[0, 1, 2, 3].map((i) => <div key={i} className={styles.strengthBar} />)}
                        <span className={styles.strengthLabel}>
                          {{ weak: 'Weak', fair: 'Fair', good: 'Good', strong: 'Strong' }[strength]}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Confirm password */}
                  <div className={styles.fieldGroup}>
                    <label className={styles.label} htmlFor="confirm-pw">Confirm Password</label>
                    <div className={styles.inputWrap}>
                      <Lock size={15} strokeWidth={2} className={styles.inputIcon} />
                      <input
                        id="confirm-pw"
                        className={`${styles.input} ${styles.inputHasIcon} ${mismatch ? styles.inputError : ''}`}
                        type={showPw2 ? 'text' : 'password'}
                        placeholder="Repeat your password"
                        value={confirm}
                        onChange={(e) => { setConfirm(e.target.value); setError(null) }}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        className={styles.inputToggle}
                        onClick={() => setShowPw2((v) => !v)}
                        aria-label={showPw2 ? 'Hide password' : 'Show password'}
                      >
                        {showPw2
                          ? <EyeOff size={15} strokeWidth={2} />
                          : <Eye   size={15} strokeWidth={2} />}
                      </button>
                    </div>
                    {mismatch && (
                      <span className={styles.fieldError}>Passwords don&apos;t match.</span>
                    )}
                  </div>

                  <motion.button
                    type="submit"
                    className={styles.submitBtn}
                    disabled={loading || mismatch || !password}
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.985 }}
                  >
                    {loading ? 'Updating…' : 'Set New Password'}
                  </motion.button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="done"
                className={styles.successWrap}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className={styles.successIcon}>
                  <CheckCircle size={28} color="#22c55e" strokeWidth={2} />
                </div>
                <h1 className={styles.heading}>Password updated!</h1>
                <p className={styles.subheading}>
                  You can now sign in with your new password. Redirecting…
                </p>
                <Link
                  href="/login"
                  className={styles.submitBtn}
                  style={{ marginTop: '0.5rem', textDecoration: 'none' }}
                >
                  Go to Sign In
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </>
  )
}