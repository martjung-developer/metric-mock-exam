// app/(auth)/verify-email/page.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Mail, AlertCircle } from 'lucide-react'
import { MoleculeBackground } from '@/animations/auth/MoleculeBackground'
import { verifyOtp, sendOtp } from '@/lib/services/auth/'
import { OTP_LENGTH, OTP_RESEND_COOLDOWN } from '@/lib/constants/auth/'
import styles from '../auth.module.css'

export default function VerifyEmailPage() {
  const router = useRouter()

  const [code, setCode] = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [countdown, setCountdown] = useState(OTP_RESEND_COOLDOWN)
  const [email, setEmail] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  const inputsRef = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const emailFromUrl = params.get('email')
    const saved = sessionStorage.getItem('verify_email')

    if (saved) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEmail(saved)
    } else if (emailFromUrl) {
      setEmail(emailFromUrl)
      sessionStorage.setItem('verify_email', emailFromUrl)
    } else {
      router.replace('/signup')
    }
  }, [router])

  useEffect(() => {
    inputsRef.current[0]?.focus()
  }, [])

  useEffect(() => {
    if (countdown <= 0) {return}
    const t = setTimeout(() => setCountdown((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  function handleChange(i: number, val: string) {
    const char = val.replace(/\D/g, '').slice(-1)
    const next = [...code]
    next[i] = char
    setCode(next)
    setError(null)

    if (char && i < OTP_LENGTH - 1) {
      inputsRef.current[i + 1]?.focus()
    }
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !code[i] && i > 0) {
      inputsRef.current[i - 1]?.focus()
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)
    if (!pasted) {return}

    e.preventDefault()
    const next = [...code]

    pasted.split('').forEach((c, idx) => {
      next[idx] = c
    })

    setCode(next)
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!email) {return}

    const token = code.join('')
    console.warn('Submitting OTP:', token)  

    setError(null)
    setLoading(true)

    const result = await verifyOtp(email, token)

    if (!result.verified) {
      setLoading(false)
      setError(result.error)
      setCode(Array(OTP_LENGTH).fill(''))
      inputsRef.current[0]?.focus()
      return
    }

    try {
      const signupData = JSON.parse(localStorage.getItem('signup_data') || '{}')

      await fetch('/api/auth/create-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signupData),
      })

      // cleanup
      localStorage.removeItem('signup_data')
      sessionStorage.removeItem('verify_email')

      router.push(result.redirectTo)

    } catch (err) {
      console.error('Profile creation failed:', err)
      setError('Account created but profile setup failed. Please contact support.')
      setLoading(false)
    }
  }

  async function handleResend() {
    if (!email) {return}

    setResending(true)
    setError(null)

    const result = await sendOtp(email)

    setResending(false)

    if (!result.sent) {
      setError(result.error)
      return
    }

    setError('A new code has been sent. Please use the latest one.')
    setCountdown(OTP_RESEND_COOLDOWN)
    setCode(Array(OTP_LENGTH).fill(''))
    inputsRef.current[0]?.focus()
  }

  const isComplete = code.every(Boolean)

  return (
    <>
      <MoleculeBackground />
      <div className={styles.authPage}>
        <motion.div
          className={styles.card}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className={styles.logoWrap}>
            <Image
              src="/images/veripraxis-logo.png"
              alt="VeriPraxis"
              height={44}
              width={70}
              priority
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <div className={styles.iconCircle}>
              <Mail size={22} />
            </div>
          </div>

          <h1 className={styles.heading}>Check your email</h1>
          <p className={styles.subheading}>
            Enter the {OTP_LENGTH}-digit code sent to{' '}
            <strong>{email}</strong>
          </p>

          {error && (
            <div className={styles.errorBanner}>
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.otpRow} onPaste={handlePaste}>
              {code.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    inputsRef.current[i] = el
                  }}
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className={styles.otpInput}
                  maxLength={1}
                />
              ))}
            </div>

            <motion.button
              type="submit"
              className={styles.submitBtn}
              disabled={!isComplete || loading}
            >
              {loading ? 'Verifying…' : 'Verify Email'}
            </motion.button>

            <div className={styles.resendRow}>
              {countdown > 0 ? (
                <span>Resend in {countdown}s</span>
              ) : (
                <button onClick={handleResend} disabled={resending}>
                  {resending ? 'Sending…' : 'Resend code'}
                </button>
              )}
            </div>

            <p className={styles.switchPrompt}>
              Wrong email? <Link href="/signup">Back to signup</Link>
            </p>
          </form>
        </motion.div>
      </div>
    </>
  )
}
