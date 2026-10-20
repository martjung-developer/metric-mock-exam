// app/(auth)/forgot-password/page.tsx
'use client'

import { useState, useMemo } from 'react'
import Image                  from 'next/image'
import Link                   from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, ArrowLeft, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react'
import { MoleculeBackground }  from '@/animations/auth/MoleculeBackground'
import { createClient }        from '@/lib/supabase/client'
import { validateEmail }       from '@/lib/utils/auth/'
import styles from '../auth.module.css'

export default function ForgotPasswordPage() {
  // Stable Supabase client for the lifetime of this page
  const supabase = useMemo(() => createClient(), [])

  const [email,   setEmail]   = useState('')
  const [sent,    setSent]    = useState(false)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const err = validateEmail(email)
    if (err) { setError(err); return }

    setLoading(true)
    setError(null)

    const { error: authErr } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    setLoading(false)

    if (authErr) {
      setError(authErr.message)
      return
    }

    setSent(true)
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
            {!sent ? (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -8 }}
              >
                <h1 className={styles.heading}>Forgot password?</h1>
                <p className={styles.subheading}>
                  Enter your email and we&apos;ll send a reset link. Expires in 1 hour.
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
                  <div className={styles.fieldGroup}>
                    <label className={styles.label} htmlFor="reset-email">Email Address</label>
                    <div className={styles.inputWrap}>
                      <Mail size={15} strokeWidth={2} className={styles.inputIcon} />
                      <input
                        id="reset-email"
                        className={`${styles.input} ${styles.inputHasIcon}`}
                        type="email"
                        placeholder="you@email.com"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setError(null) }}
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  <motion.button
                    type="submit"
                    className={styles.submitBtn}
                    disabled={loading}
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.985 }}
                  >
                    {loading
                      ? 'Sending…'
                      : <> Send Reset Link <ArrowRight size={15} strokeWidth={2.5} /></>}
                  </motion.button>

                  <p className={styles.switchPrompt}>
                    <Link href="/login" className={styles.switchLink}>
                      <ArrowLeft size={13} style={{ display: 'inline', marginRight: 3 }} />
                      Back to sign in
                    </Link>
                  </p>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="sent"
                className={styles.successWrap}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className={styles.successIcon}>
                  <CheckCircle size={28} color="#22c55e" strokeWidth={2} />
                </div>
                <h1 className={styles.heading}>Check your email</h1>
                <p className={styles.subheading}>
                  We sent a reset link to{' '}
                  <strong style={{ color: '#0f172a' }}>{email}</strong>.
                  Check your spam folder if you don&apos;t see it.
                </p>
                <button
                  className={styles.submitBtn}
                  onClick={() => { setSent(false); setEmail('') }}
                  style={{ marginTop: '0.5rem' }}
                >
                  Try a different email
                </button>
                <Link
                  href="/login"
                  className={styles.switchLink}
                  style={{ marginTop: '0.5rem', fontSize: '0.82rem' }}
                >
                  Back to sign in
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </>
  )
}