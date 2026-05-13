// components/auth/LegalModal.tsx
'use client'

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, FileText, ShieldCheck, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import styles from './LegalModal.module.css'

export type DocType = 'terms' | 'privacy' | null

interface LegalModalProps {
  open:    DocType
  onClose: () => void
}

/* ── All content lives here — no page navigation needed ── */
const TERMS_SECTIONS = [
  {
    num: '01', title: 'Acceptance of Terms',
    body: 'By creating an account or using any feature of VeriPraxis ("the Platform"), you agree to these Terms and our Privacy Policy. If you do not agree, please do not use the Platform.',
  },
  {
    num: '02', title: 'Account Responsibilities',
    body: null,
    list: [
      'You must be at least 18 years old to create an account.',
      'You are responsible for maintaining the confidentiality of your login credentials.',
      'You must provide accurate and complete information during registration.',
      'Notify us immediately at support@veripraxis.ph if you suspect unauthorized access.',
    ],
  },
  {
    num: '03', title: 'Permitted Use',
    body: 'VeriPraxis is licensed to you for personal, non-commercial use to prepare for PRC licensure examinations only. Any other use requires our prior written consent.',
  },
  {
    num: '04', title: 'Prohibited Conduct',
    body: 'You agree not to:',
    list: [
      'Share, redistribute, or resell exam questions or answer keys.',
      'Use automated tools, bots, or scrapers to extract platform content.',
      'Attempt to reverse engineer or hack any part of the Platform.',
      'Create multiple accounts to circumvent usage limits.',
      'Post or transmit any harmful, offensive, or misleading content.',
    ],
  },
  {
    num: '05', title: 'Intellectual Property',
    body: 'All content on VeriPraxis — including exam questions, rationales, software, design, and branding — is the exclusive property of VeriPraxis Inc. You may not reproduce or distribute any content without prior written permission.',
  },
  {
    num: '06', title: 'Payments & Refunds',
    body: 'Pro subscriptions are billed monthly or annually in Philippine Pesos (PHP). A 7-day money-back guarantee applies for first-time Pro subscribers only. After 7 days, payments are non-refundable.',
  },
  {
    num: '07', title: 'Disclaimers',
    body: 'VeriPraxis is not affiliated with, endorsed by, or an official product of the Professional Regulation Commission (PRC). Passing a mock exam does not guarantee passing the actual board examination. The Platform is provided "as is" without warranties of any kind.',
  },
  {
    num: '08', title: 'Limitation of Liability',
    body: 'To the maximum extent permitted by Philippine law, VeriPraxis Inc. shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Platform.',
  },
  {
    num: '09', title: 'Termination',
    body: 'We reserve the right to suspend or terminate your account at any time for violations of these Terms, without prior notice. You may delete your account at any time from your account settings.',
  },
  {
    num: '10', title: 'Governing Law',
    body: 'These Terms are governed by the laws of the Republic of the Philippines. Disputes shall be subject to the exclusive jurisdiction of the courts of Pasig City, Metro Manila.',
  },
  {
    num: '11', title: 'Contact',
    body: 'Questions about these Terms? Email legal@veripraxis.ph. For support issues, email support@veripraxis.ph.',
  },
]

const PRIVACY_SECTIONS = [
  {
    num: '01', title: 'Information We Collect',
    body: 'When you register and use VeriPraxis, we collect:',
    list: [
      'Account data: your name, email address, and bcrypt-hashed password.',
      'Profile data: exam program, educational background, and study goals.',
      'Usage data: exam scores, question responses, time spent per item.',
      'Device data: browser type, OS, IP address, and device identifiers.',
      'Payment data: processed securely via Paymongo — we never store card numbers.',
    ],
  },
  {
    num: '02', title: 'How We Use Your Information',
    body: 'Your data powers a better review experience:',
    list: [
      'Provide and maintain your account and real-time exam sessions.',
      'Personalize your study experience and analytics dashboard.',
      'Send transactional emails — receipts, password resets, exam reminders.',
      'Send optional marketing emails (unsubscribe anytime, one click).',
      'Improve our question bank, features, and overall platform quality.',
      'Comply with legal obligations under RA 10173 and prevent fraud.',
    ],
  },
  {
    num: '03', title: 'Information Sharing',
    body: 'We do not sell, trade, or rent your personal information. Sharing is limited to: (1) service providers under strict data processing agreements, (2) legal requirements if compelled by Philippine law, and (3) business transfers with advance notice.',
  },
  {
    num: '04', title: 'Cookies & Tracking',
    body: 'We use cookies to keep you logged in, remember preferences, and understand aggregate usage. We do not use third-party advertising trackers.',
  },
  {
    num: '05', title: 'Data Security',
    body: 'We implement TLS 1.3 in transit, AES-256 at rest, bcrypt password hashing, and role-based access controls. Contact security@veripraxis.ph if you believe your account is compromised.',
  },
  {
    num: '06', title: 'Your Rights (RA 10173)',
    body: 'Under the Data Privacy Act of 2012, you have the right to:',
    list: [
      'Access — see what data we hold about you at any time.',
      'Correct — fix inaccurate or outdated information.',
      'Delete — remove your account and all associated data.',
      'Opt Out — unsubscribe from marketing emails instantly.',
      'Export — download your exam history and analytics.',
      'Object — dispute how your data is processed or used.',
    ],
  },
  {
    num: '07', title: "Children's Privacy",
    body: "VeriPraxis is intended for users 18 years and older. We do not knowingly collect data from minors. If you believe a child has created an account, contact us immediately.",
  },
  {
    num: '08', title: 'Changes to This Policy',
    body: 'We may update this Privacy Policy as our platform evolves. Material changes will be communicated via email and in-app notice at least 30 days before taking effect.',
  },
  {
    num: '09', title: 'Contact',
    body: 'For privacy-related questions, reach our Data Privacy Officer at privacy@veripraxis.ph. For general inquiries, email support@veripraxis.ph.',
  },
]

export default function LegalModal({ open, onClose }: LegalModalProps): React.ReactElement | null {
  const scrollRef = useRef<HTMLDivElement>(null)

  /* Close on Escape */
  useEffect(() => {
    if (!open) {return}
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') {onClose()} }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  /* Lock body scroll while open */
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  /* Reset scroll position when switching documents */
  useEffect(() => {
    if (scrollRef.current) {scrollRef.current.scrollTop = 0}
  }, [open])

  const isTerms   = open === 'terms'
  const sections  = isTerms ? TERMS_SECTIONS : PRIVACY_SECTIONS
  const docTitle  = isTerms ? 'Terms of Service' : 'Privacy Policy'
  const docDate   = 'January 1, 2025'
  const Icon      = isTerms ? FileText : ShieldCheck
  const fullHref  = isTerms ? '/terms' : '/privacy'

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className={styles.modal}
            initial={{ opacity: 0, y: 28, scale: 0.97 }}
            animate={{ opacity: 1, y: 0,  scale: 1    }}
            exit={{    opacity: 0, y: 18, scale: 0.97 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            role="dialog"
            aria-modal="true"
            aria-label={docTitle}
          >

            {/* ── HEADER ── */}
            <div className={styles.header}>
              <div className={styles.headerLeft}>
                <div className={styles.headerIconWrap}>
                  <Icon size={18} strokeWidth={2} />
                </div>
                <div>
                  <div className={styles.headerTitle}>{docTitle}</div>
                  <div className={styles.headerMeta}>Effective {docDate} · VeriPraxis Inc.</div>
                </div>
              </div>
              <div className={styles.headerRight}>
                <Link
                  href={fullHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.fullPageLink}
                  title={`Open full ${docTitle} page`}
                >
                  <ExternalLink size={13} strokeWidth={2.5} />
                  Full page
                </Link>
                <button
                  className={styles.closeBtn}
                  onClick={onClose}
                  aria-label="Close"
                >
                  <X size={18} strokeWidth={2} />
                </button>
              </div>
            </div>

            {/* ── DISCLAIMER BANNER ── */}
            {isTerms && (
              <div className={styles.banner}>
                Please read these Terms carefully. By creating an account, you agree to be bound by them.
              </div>
            )}

            {/* ── SCROLLABLE BODY ── */}
            <div className={styles.body} ref={scrollRef}>
              {sections.map((s) => (
                <div key={s.num} className={styles.section}>
                  <div className={styles.sectionHeader}>
                    <span className={styles.sectionNum}>§{s.num}</span>
                    <h3 className={styles.sectionTitle}>{s.title}</h3>
                  </div>
                  {s.body && <p className={styles.sectionBody}>{s.body}</p>}
                  {s.list && (
                    <ul className={styles.sectionList}>
                      {s.list.map((item) => (
                        <li key={item} className={styles.sectionListItem}>
                          <span className={styles.sectionListDot} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>

            {/* ── FOOTER ── */}
            <div className={styles.footer}>
              <p className={styles.footerNote}>
                {isTerms
                  ? 'By checking "I agree", you accept all terms above.'
                  : 'Your data is protected under RA 10173 — Data Privacy Act of 2012.'}
              </p>
              <button className={styles.footerBtn} onClick={onClose}>
                I understand
              </button>
            </div>

          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}