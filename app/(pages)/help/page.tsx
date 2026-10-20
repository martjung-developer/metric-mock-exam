// app/help/page.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Rocket, CreditCard, ClipboardList, BarChart2,
  Search, Mail, MessageCircle, ChevronDown,
  BookOpen, Clock, RefreshCw, AlertCircle,
} from 'lucide-react'
import {
  quickLinksContainer,
  quickCard,
  faqGroups,
  faqGroup,
  faqAnswer,
} from '@/animations/help/help'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import styles from './help.module.css'

const QUICK_LINKS = [
  { icon: Rocket,        title: 'Getting Started',      color: '#2563eb', bg: '#eff6ff' },
  { icon: CreditCard,    title: 'Billing & Plans',       color: '#16a34a', bg: '#f0fdf4' },
  { icon: ClipboardList, title: 'Taking Exams',          color: '#d97706', bg: '#fffbeb' },
  { icon: BarChart2,     title: 'Understanding Results', color: '#7c3aed', bg: '#faf5ff' },
]

const FAQ_CATEGORIES = [
  {
    icon: Rocket,
    title: 'Getting Started',
    faqs: [
      {
        q: 'What is M.E.T.R.I.C. and who is it for?',
        a: 'M.E.T.R.I.C. is a mock exam platform designed specifically for Filipino professionals preparing for PRC licensure board exams. We currently support nursing, engineering, accountancy, and other major programs.',
      },
      {
        q: 'How do I create an account?',
        a: 'Click "Sign Up Free" on the homepage, enter your email and a password, choose your exam program, and you\'re in. No credit card required to start with the Free plan.',
      },
      {
        q: 'Is there a free plan? What does it include?',
        a: 'Yes! The Free plan gives you access to 3 full-length mock exams per month, basic score breakdowns, and limited question bank access. Upgrade to Pro for unlimited exams and detailed analytics.',
      },
    ],
  },
  {
    icon: ClipboardList,
    title: 'Taking Exams',
    faqs: [
      {
        q: 'How long does a full mock exam take?',
        a: 'Each exam is timed to match the real PRC format — typically 100–120 questions at 3–4 hours depending on the program. You can pause and resume if needed.',
      },
      {
        q: 'Can I review my answers after finishing an exam?',
        a: 'Yes. After submitting, you get a full item review showing your answer, the correct answer, and a detailed rationale for each question. Pro users also get downloadable PDF reports.',
      },
      {
        q: 'Are the questions updated regularly?',
        a: 'We update our question bank every quarter based on the latest PRC exam trends and reports from recent test takers. Outdated questions are flagged and replaced.',
      },
    ],
  },
  {
    icon: CreditCard,
    title: 'Billing & Subscriptions',
    faqs: [
      {
        q: 'What payment methods are accepted?',
        a: 'We accept major credit/debit cards, GCash, Maya, and bank transfer via Paymongo. All transactions are secured and encrypted.',
      },
      {
        q: 'Can I cancel my Pro subscription anytime?',
        a: 'Absolutely. You can cancel at any time from your account settings. Your Pro access continues until the end of the current billing period — no questions asked.',
      },
      {
        q: 'Do you offer student or group discounts?',
        a: 'We offer discounts for registered review centers and bulk enrollments. Contact us at support@metric.ph for pricing details.',
      },
    ],
  },
  {
    icon: AlertCircle,
    title: 'Technical Issues',
    faqs: [
      {
        q: "The exam isn't loading — what should I do?",
        a: 'Try refreshing the page or clearing your browser cache. M.E.T.R.I.C. works best on Chrome, Edge, or Firefox. If the issue persists, contact us via the chat widget or email support@metric.ph.',
      },
      {
        q: 'I found a question with an error. How do I report it?',
        a: 'Every question has a "Report Issue" button next to it during and after an exam. Use that to flag inaccuracies, typos, or incorrect answer keys — our content team reviews reports within 48 hours.',
      },
    ],
  },
]

const SUPPORT_STATS = [
  { icon: Clock,     value: '< 4hrs',  label: 'Avg response time' },
  { icon: BookOpen,  value: '50+',     label: 'Help articles'     },
  { icon: RefreshCw, value: '24/7',    label: 'Self-serve support' },
]

export default function HelpPage() {
  const [openMap, setOpenMap] = useState<Record<string, boolean>>({})
  const [search, setSearch]   = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  function toggle(key: string) {
    setOpenMap((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const filtered = FAQ_CATEGORIES
    .filter((cat) => activeCategory === null || cat.title === activeCategory)
    .map((cat) => ({
      ...cat,
      faqs: cat.faqs.filter(
        (f) =>
          search === '' ||
          f.q.toLowerCase().includes(search.toLowerCase()) ||
          f.a.toLowerCase().includes(search.toLowerCase()),
      ),
    }))
    .filter((cat) => cat.faqs.length > 0)

  return (
    <>
      <Navbar />

      <main className={styles.page}>

        {/* ── HERO ── */}
        <section className={styles.hero}>
          <div className={styles.heroBg}>
            <Image
              src="https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1400&q=80"
              alt="Library resources"
              fill
              style={{ objectFit: 'cover' }}
              priority
            />
            <div className={styles.heroBgOverlay} />
          </div>

          <div className={styles.heroInner}>
            <motion.div
              initial="hidden"
              animate="show"
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}
              className={styles.heroContent}
            >
              <motion.span
                variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}
                className={styles.heroBadge}
              >
                Help Center
              </motion.span>
              <motion.h1
                variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.55 } } }}
                className={styles.heroTitle}
              >
                How can we <span className={styles.heroAccent}>help you?</span>
              </motion.h1>
              <motion.p
                variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}
                className={styles.heroSub}
              >
                Search our knowledge base or browse by category below.
              </motion.p>

              {/* Search bar */}
              <motion.div
                variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.1 } } }}
                className={styles.searchWrap}
              >
                <Search size={17} strokeWidth={2} className={styles.searchIcon} />
                <input
                  type="text"
                  className={styles.searchInput}
                  placeholder="Search questions…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button className={styles.searchClear} onClick={() => setSearch('')}>
                    ✕
                  </button>
                )}
              </motion.div>

              {/* Support stats */}
              <motion.div
                variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.5, delay: 0.2 } } }}
                className={styles.heroStats}
              >
                {SUPPORT_STATS.map(({ icon: Icon, value, label }) => (
                  <div key={label} className={styles.heroStat}>
                    <Icon size={14} strokeWidth={2} className={styles.heroStatIcon} />
                    <strong>{value}</strong>
                    <span>{label}</span>
                  </div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ── QUICK LINKS ── */}
        <div className={styles.quickSection}>
          <motion.div className={styles.quickGrid} {...quickLinksContainer}>
            {QUICK_LINKS.map(({ icon: Icon, title, color, bg }) => (
              <motion.button
                key={title}
                className={`${styles.quickCard} ${activeCategory === title ? styles.quickCardActive : ''}`}
                onClick={() => setActiveCategory(activeCategory === title ? null : title)}
                {...quickCard}
              >
                <div className={styles.quickIcon} style={{ background: bg, color }}>
                  <Icon size={20} strokeWidth={1.75} />
                </div>
                <div className={styles.quickTitle}>{title}</div>
                <div className={styles.quickArrow} style={{ color }}>→</div>
              </motion.button>
            ))}
          </motion.div>
        </div>

        {/* ── FAQ SECTIONS ── */}
        <div className={styles.faqWrapper}>
          {activeCategory && (
            <div className={styles.filterBar}>
              <span>Showing: <strong>{activeCategory}</strong></span>
              <button className={styles.filterClear} onClick={() => setActiveCategory(null)}>
                Clear filter ✕
              </button>
            </div>
          )}

          {filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={styles.emptyState}
            >
              <Search size={32} strokeWidth={1.5} className={styles.emptyIcon} />
              <p>No results for <strong>&ldquo;{search}&rdquo;</strong></p>
              <button className={styles.emptyReset} onClick={() => { setSearch(''); setActiveCategory(null) }}>
                Clear search
              </button>
            </motion.div>
          ) : (
            <motion.div className={styles.faqColumns} {...faqGroups}>
              {filtered.map((cat) => {
                const CatIcon = cat.icon
                return (
                  <motion.div key={cat.title} className={styles.faqGroup} {...faqGroup}>
                    <div className={styles.categoryHeader}>
                      <div className={styles.categoryIcon}>
                        <CatIcon size={16} strokeWidth={1.75} />
                      </div>
                      <h2 className={styles.categoryTitle}>{cat.title}</h2>
                    </div>

                    {cat.faqs.map((faq, i) => {
                      const key = `${cat.title}:${i}`
                      const isOpen = !!openMap[key]
                      return (
                        <div
                          key={key}
                          className={`${styles.faqItem} ${isOpen ? styles.faqItemOpen : ''}`}
                        >
                          <button
                            className={styles.faqQuestion}
                            onClick={() => toggle(key)}
                          >
                            <span>{faq.q}</span>
                            <motion.div
                              animate={{ rotate: isOpen ? 180 : 0 }}
                              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                              className={styles.faqChevronWrap}
                            >
                              <ChevronDown size={16} strokeWidth={2} />
                            </motion.div>
                          </button>
                          <AnimatePresence initial={false}>
                            {isOpen && (
                              <motion.div {...faqAnswer}>
                                <div className={styles.faqAnswerInner}>{faq.a}</div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )
                    })}
                  </motion.div>
                )
              })}
            </motion.div>
          )}
        </div>

        {/* ── CONTACT CTA ── */}
        <section className={styles.ctaSection}>
          <div className={styles.ctaBg}>
            <Image
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1400&q=80"
              alt="Students studying together"
              fill
              style={{ objectFit: 'cover' }}
            />
            <div className={styles.ctaBgOverlay} />
          </div>
          <div className={styles.ctaInner}>
            <h2 className={styles.ctaTitle}>Still need help?</h2>
            <p className={styles.ctaSub}>
              Our support team is available Mon–Fri, 9AM–6PM PHT.
              We typically reply within 4 hours.
            </p>
            <div className={styles.ctaActions}>
              <Link href="/contact" className={styles.btnPrimary}>
                <Mail size={15} strokeWidth={2.5} />
                Email Support
              </Link>
              <Link href="/contact" className={styles.btnGhost}>
                <MessageCircle size={15} strokeWidth={2.5} />
                Live Chat
              </Link>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </>
  )
}