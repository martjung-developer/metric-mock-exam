// src/components/sections/FAQ.tsx
'use client'

import { useState } from 'react'
import styles from '@/app/page.module.css'

const FAQS = [
  {
    q: 'What exams does VERIPRAXIS cover?',
    a: 'VERIPRAXIS currently supports the SBIT (Library & Information Science), SSLATE (Education, Psychology, and Liberal Arts), and SARFAID (Architecture, Fine Arts, and Interior Design) licensure examinations. More programs are being added based on community demand.',
  },
  {
    q: 'Is there a free trial for the Pro plan?',
    a: 'Yes. When you sign up for the Pro plan, you get a 7-day free trial with full access to all features. No credit card required to start. You will only be charged after the trial period ends.',
  },
  {
    q: 'How accurate are the mock exams?',
    a: 'Our question bank is curated by licensed professionals and past board exam topnotchers. Questions are regularly reviewed and updated to reflect the current PRC syllabi and exam formats.',
  },
  {
    q: 'Can I access VERIPRAXIS on my phone?',
    a: 'We haven\'t released a dedicated mobile app yet. VERIPRAXIS is fully responsive and works on all screen sizes — phones, tablets, and desktops. A dedicated mobile app is currently in development.',
  },
  {
    q: 'How do I cancel my subscription?',
    a: 'You can cancel your Pro subscription at any time from your account settings page. You will retain full Pro access until the end of your current billing cycle — no partial-month charges.',
  },
]

export default function FAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(0)

  return (
    <section id="faq" aria-labelledby="faq-heading">
      <div className={styles.section}>
        <div className={`${styles.sectionHeader} ${styles.sectionHeaderCenter} reveal`}>
          <span className={styles.sectionLabel}>FAQ</span>
          <h2 id="faq-heading" className={styles.sectionTitle}>
            Frequently Asked Questions
          </h2>
          <p className={styles.sectionSub}>
            Still have questions?{' '}
            <a href="/contact" style={{ color: 'var(--blue)', fontWeight: 600 }}>
              Reach out to us
            </a>
            .
          </p>
        </div>

        <div
          className={`${styles.faqList} reveal reveal-delay-1`}
          role="list"
        >
          {FAQS.map((faq, i) => {
            const isOpen = openIdx === i
            return (
              <div
                key={faq.q}
                className={`${styles.faqItem} ${isOpen ? styles.faqOpen : ''}`}
                role="listitem"
              >
                <button
                  type="button"
                  className={styles.faqQuestion}
                  onClick={() => setOpenIdx(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${i}`}
                  id={`faq-btn-${i}`}
                >
                  {faq.q}
                  <svg
                    className={styles.faqChevron}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <div
                  className={styles.faqAnswer}
                  id={`faq-answer-${i}`}
                  role="region"
                  aria-labelledby={`faq-btn-${i}`}
                >
                  <p className={styles.faqAnswerInner}>{faq.a}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}