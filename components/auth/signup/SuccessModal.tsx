// components/auth/signup/SignupSuccessModal.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Shown immediately after a student account is created successfully.
// Auto-redirects to /login after REDIRECT_DELAY_MS with a countdown.
// The student can also click "Go to Login" to redirect immediately.
// ─────────────────────────────────────────────────────────────────────────────

'use client'

import { useEffect, useState, useCallback } from 'react'
import Link                                 from 'next/link'
import { useRouter }                        from 'next/navigation'
import { motion, AnimatePresence }          from 'framer-motion'
import { CheckCircle, ArrowRight }    from 'lucide-react'

// ── Constants ─────────────────────────────────────────────────────────────────
const REDIRECT_DELAY_MS = 5_000   
const TICK_MS           = 1_000

interface SignupSuccessModalProps {
  email?: string
  emailConfirmationRequired?: boolean
  onClose?: () => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export function SignupSuccessModal({
  email,
  emailConfirmationRequired = false,
  onClose,
}: SignupSuccessModalProps) {
  const router                  = useRouter()
  const [seconds, setSeconds]   = useState(Math.round(REDIRECT_DELAY_MS / TICK_MS))

  // ── Countdown + auto-redirect ─────────────────────────────────────────────

  const redirect = useCallback(() => {
    onClose?.()
    router.push('/login')
  }, [router, onClose])

  useEffect(() => {
    if (seconds <= 0) { redirect(); return }
    const t = setTimeout(() => setSeconds((s) => s - 1), TICK_MS)
    return () => clearTimeout(t)
  }, [seconds, redirect])

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        style={{
          position:        'fixed',
          inset:           0,
          zIndex:          999,
          background:      'rgba(10, 18, 32, 0.55)',
          backdropFilter:  'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          display:         'flex',
          alignItems:      'center',
          justifyContent:  'center',
          padding:         '1.25rem',
        }}
        onClick={redirect}
      >
        <motion.div
          key="modal"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1,   y: 0  }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.3, ease: [0.34, 1.2, 0.64, 1] }}
          // Stop click propagation so clicking the card doesn't trigger backdrop
          onClick={(e) => e.stopPropagation()}
          style={{
            background:   '#ffffff',
            borderRadius: '20px',
            padding:      '2.25rem 2rem 2rem',
            width:        '100%',
            maxWidth:     '400px',
            textAlign:    'center',
            boxShadow:
              '0 24px 60px rgba(10,18,32,0.2), 0 4px 16px rgba(10,18,32,0.08)',
          }}
        >
          {/* ── Animated check icon ── */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 14 }}
            style={{
              width:          '72px',
              height:         '72px',
              borderRadius:   '50%',
              background:     '#f0fdf4',
              border:         '2px solid #bbf7d0',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              margin:         '0 auto 1.25rem',
            }}
          >
            <CheckCircle size={36} color="#22c55e" strokeWidth={2} />
          </motion.div>

          {/* ── Heading ── */}
          <h2 style={{
            fontFamily:     'Inter, system-ui, sans-serif',
            fontSize:       '1.3rem',
            fontWeight:     800,
            color:          '#0f172a',
            margin:         '0 0 0.4rem',
            letterSpacing:  '-0.02em',
          }}>
            {emailConfirmationRequired ? 'Check your email' : 'Account Created!'}
          </h2>

          <p style={{
            fontSize:    '0.85rem',
            color:       '#64748b',
            margin:      '0 0 1rem',
            lineHeight:  1.55,
          }}>
            {emailConfirmationRequired
              ? `We sent a confirmation link${email ? ` to ${email}` : ''}. Finish confirming your email to complete profile setup.`
              : 'Welcome to M.E.T.R.I.C.! Your student account has been created successfully.'}
          </p>

          <div style={{
            display:      'flex',
            alignItems:   'flex-start',
            gap:          '0.5rem',
            padding:      '0.75rem 0.9rem',
            background:   '#f0f9ff',
            border:       '1px solid #bae6fd',
            borderRadius: '10px',
            marginBottom: '1.5rem',
            textAlign:    'left',
          }}>
            
          </div>
          

          <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.985 }}>
            <Link
              href="/login"
              onClick={onClose}
              style={{
                display:         'flex',
                alignItems:      'center',
                justifyContent:  'center',
                gap:             '0.45rem',
                width:           '100%',
                padding:         '0.72rem 1.25rem',
                background:      '#0f172a',
                color:           '#ffffff',
                borderRadius:    '10px',
                fontFamily:      'Inter, system-ui, sans-serif',
                fontSize:        '0.875rem',
                fontWeight:      600,
                textDecoration:  'none',
                transition:      'background 0.15s',
                boxSizing:       'border-box',
              }}
            >
              Go to Login <ArrowRight size={15} strokeWidth={2.5} />
            </Link>
          </motion.div>

          <p style={{
            fontSize:   '0.74rem',
            color:      '#94a3b8',
            marginTop:  '0.75rem',
            marginBottom: 0,
          }}>
            Redirecting automatically in{' '}
            <span style={{ fontWeight: 700, color: '#6366f1' }}>{seconds}s</span>…
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
