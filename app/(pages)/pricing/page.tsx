// app/(pages)/pricing/page.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Check, X, Minus, ShieldCheck, Zap, BookOpen,
  BarChart2, FileDown, Headphones, Brain,
  ArrowRight, Star,
} from 'lucide-react'
import { heroContainer, heroItem, revealUp } from '@/animations/presets/publicPage'
import {
  pricingCardsContainer, pricingCard,
  toggleRow, faqContainer, faqItem, ctaSection,
} from '@/animations/pricing/pricingAnimations'
import { faqAnswer } from '@/animations/presets/publicPage'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import styles from './pricing.module.css'

interface Feature {
  icon: React.ElementType
  label: string
  free: string | boolean
  pro: string | boolean
}

const FEATURES: Feature[] = [
  { icon: BookOpen,   label: 'Full-length mock exams',    free: '3 / month',  pro: 'Unlimited'  },
  { icon: Brain,      label: 'Question bank access',      free: '100 / month',pro: 'Unlimited'  },
  { icon: Zap,        label: 'Exam programs',             free: '1 program',  pro: 'All 12'     },
  { icon: Check,      label: 'Answer rationales',         free: false,        pro: true         },
  { icon: BarChart2,  label: 'Subject heatmap analytics', free: false,        pro: true         },
  { icon: BarChart2,  label: 'Score trend charts',        free: false,        pro: true         },
  { icon: FileDown,   label: 'Downloadable PDF reports',  free: false,        pro: true         },
  { icon: Brain,      label: 'Adaptive difficulty mode',  free: false,        pro: true         },
  { icon: Headphones, label: 'Priority support',          free: false,        pro: true         },
]

const FREE_HIGHLIGHTS = [
  '3 full-length mock exams per month',
  'Basic score summary',
  '100 question bank items per month',
  'Access to 1 exam program',
]

const PRO_HIGHLIGHTS = [
  'Unlimited mock exams',
  'Full analytics & heatmaps',
  'Unlimited question bank access',
  'All 12 PRC exam programs',
  'Answer rationales for every question',
  'Downloadable PDF performance reports',
  'Adaptive difficulty engine',
  'Priority email & chat support',
]

const FAQS = [
  {
    q: 'Can I switch from Free to Pro at any time?',
    a: 'Yes — upgrade or downgrade from your account settings at any time. When you upgrade, your Pro access starts immediately.',
  },
  {
    q: 'Is the annual plan really worth it?',
    a: 'Absolutely. The annual plan saves you ₱999 versus paying monthly for 12 months — that\'s more than 2 months free.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept GCash, Maya, major credit/debit cards, and bank transfer through Paymongo. All transactions are encrypted and secure.',
  },
  {
    q: 'Do you offer refunds?',
    a: 'Yes — we offer a 7-day money-back guarantee for first-time Pro subscribers, no questions asked.',
  },
  {
    q: 'Can review centers get group pricing?',
    a: 'Yes! We have special pricing for review centers and bulk enrollments. Contact us at support@metric.ph for a quote.',
  },
]

const SOCIAL_PROOF = [
  { name: 'Maria S.',  role: 'NLE Passer 2024',    quote: 'Pro paid for itself the first week.' },
  { name: 'Kevin R.',  role: 'CPA Passer 2024',    quote: 'The analytics alone are worth it.' },
  { name: 'Anna L.',   role: 'LET Passer 2024',    quote: 'Passed on my first attempt!' },
]

export default function PricingPage() {
  const [annual, setAnnual]   = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const monthlyPrice = 299
  const annualPrice  = Math.round(monthlyPrice * 10 / 12)

  return (
    <>
      <Navbar />

      <main className={styles.page}>

        {/* ── HERO ── */}
        <section className={styles.hero}>
          {/* Background photo */}
          <div className={styles.heroBg}>
            <Image
              src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1400&q=80"
              alt="Student studying"
              fill
              style={{ objectFit: 'cover' }}
              priority
            />
            <div className={styles.heroBgOverlay} />
          </div>

          <div className={styles.heroInner}>
            {/* Left: text content */}
            <motion.div {...heroContainer} className={styles.heroContent}>
              <motion.span {...heroItem} className={styles.heroBadge}>
                Simple Pricing
              </motion.span>
              <motion.h1 {...heroItem} className={styles.heroTitle}>
                Invest in your{' '}
                <span className={styles.heroAccent}>board exam success.</span>
              </motion.h1>
              <motion.p {...heroItem} className={styles.heroSub}>
                Start free and upgrade only when you need the full experience.
                No hidden fees. No confusing tiers. Cancel anytime.
              </motion.p>

              {/* Social proof micro-strip */}
              <motion.div {...heroItem} className={styles.heroProof}>
                <div className={styles.heroProofAvatars}>
                  {[
                    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&q=80',
                    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&q=80',
                    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&q=80',
                  ].map((src, i) => (
                    <div key={i} className={styles.heroProofAvatar}>
                      <Image src={src} alt="Reviewer" fill style={{ objectFit: 'cover' }} />
                    </div>
                  ))}
                </div>
                <div className={styles.heroProofText}>
                  <div className={styles.heroProofStars}>
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={13} fill="#fbbf24" color="#fbbf24" />
                    ))}
                  </div>
                  <span>Trusted by 10,000+ Filipino reviewees</span>
                </div>
              </motion.div>
            </motion.div>

            {/* Right: floating price preview card */}
            <motion.div
              className={styles.heroCard}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
            >
              <div className={styles.heroCardLabel}>Pro Plan</div>
              <div className={styles.heroCardPrice}>
                <span className={styles.heroCardCurrency}>₱</span>
                <span className={styles.heroCardAmount}>{annual ? annualPrice : monthlyPrice}</span>
                <span className={styles.heroCardPeriod}>/mo</span>
              </div>
              {annual && (
                <div className={styles.heroCardNote}>Billed ₱{annualPrice * 12}/year</div>
              )}
              <ul className={styles.heroCardList}>
                {PRO_HIGHLIGHTS.slice(0, 4).map((f) => (
                  <li key={f} className={styles.heroCardItem}>
                    <Check size={13} strokeWidth={2.5} className={styles.heroCardCheck} />
                    {f}
                  </li>
                ))}
                <li className={styles.heroCardMore}>+ 4 more features</li>
              </ul>
              <Link href="/register?plan=pro" className={styles.heroCardCta}>
                Start Pro <ArrowRight size={14} strokeWidth={2.5} />
              </Link>
              <div className={styles.heroCardGuarantee}>
                <ShieldCheck size={13} strokeWidth={2} />
                7-day money-back guarantee
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── BILLING TOGGLE ── */}
        <div className={styles.toggleSection}>
          <motion.div {...toggleRow} className={styles.toggleRow}>
            <span className={`${styles.toggleLabel} ${!annual ? styles.toggleLabelActive : ''}`}>
              Monthly
            </span>
            <button
              className={styles.toggle}
              onClick={() => setAnnual((a) => !a)}
              aria-label="Toggle billing period"
            >
              <motion.span
                className={styles.toggleKnob}
                animate={{ left: annual ? 25 : 3 }}
                transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
              />
            </button>
            <span className={`${styles.toggleLabel} ${annual ? styles.toggleLabelActive : ''}`}>
              Annual
            </span>
            {annual && <span className={styles.saveBadge}>Save 17%</span>}
          </motion.div>
        </div>

        {/* ── PRICING CARDS ── */}
        <section className={styles.pricingSection}>
          <motion.div className={styles.pricingGrid} {...pricingCardsContainer}>

            {/* Free Card */}
            <motion.div className={styles.card} {...pricingCard}>
              <div className={styles.cardTop}>
                <div>
                  <div className={styles.planName}>Free</div>
                  <p className={styles.planDesc}>
                    Explore M.E.T.R.I.C. before committing.
                  </p>
                </div>
                <div className={styles.priceBlock}>
                  <div className={styles.priceRow}>
                    <span className={styles.priceCurrency}>₱</span>
                    <span className={styles.priceAmount}>0</span>
                  </div>
                  <span className={styles.pricePeriod}>forever free</span>
                </div>
              </div>
              <div className={styles.divider} />
              <ul className={styles.featuresList}>
                {FREE_HIGHLIGHTS.map((f) => (
                  <li key={f} className={styles.featuresItem}>
                    <Check size={14} strokeWidth={2.5} className={styles.checkIcon} />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/register" className={styles.ctaFree}>
                Get Started Free
              </Link>
            </motion.div>

            {/* Pro Card */}
            <motion.div className={`${styles.card} ${styles.cardFeatured}`} {...pricingCard}>
              {/* Background photo accent */}
              <div className={styles.cardFeaturedBg}>
                <Image
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80"
                  alt="Students studying"
                  fill
                  style={{ objectFit: 'cover' }}
                />
                <div className={styles.cardFeaturedBgOverlay} />
              </div>

              <div className={styles.cardContent}>
                <div className={styles.planBadge}>
                  <Star size={11} fill="currentColor" />
                  Most Popular
                </div>
                <div className={styles.cardTop}>
                  <div>
                    <div className={`${styles.planName} ${styles.planNameLight}`}>Pro</div>
                    <p className={`${styles.planDesc} ${styles.planDescLight}`}>
                      Everything you need to pass — unlimited.
                    </p>
                  </div>
                  <div className={styles.priceBlock}>
                    <div className={styles.priceRow}>
                      <span className={`${styles.priceCurrency} ${styles.priceCurrencyLight}`}>₱</span>
                      <AnimatePresence mode="wait">
                        <motion.span
                          key={annual ? 'annual' : 'monthly'}
                          className={`${styles.priceAmount} ${styles.priceAmountLight}`}
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 8 }}
                          transition={{ duration: 0.2 }}
                        >
                          {annual ? annualPrice : monthlyPrice}
                        </motion.span>
                      </AnimatePresence>
                    </div>
                    <span className={`${styles.pricePeriod} ${styles.pricePeriodLight}`}>
                      {annual ? `₱${annualPrice * 12}/year` : 'per month'}
                    </span>
                  </div>
                </div>
                <div className={`${styles.divider} ${styles.dividerLight}`} />
                <ul className={styles.featuresList}>
                  {PRO_HIGHLIGHTS.map((f) => (
                    <li key={f} className={`${styles.featuresItem} ${styles.featuresItemLight}`}>
                      <Check size={14} strokeWidth={2.5} className={styles.checkIconLight} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/register?plan=pro" className={styles.ctaPro}>
                  Start Pro {annual ? '(Annual)' : '(Monthly)'}
                  <ArrowRight size={15} strokeWidth={2.5} />
                </Link>
                <div className={styles.cardGuarantee}>
                  <ShieldCheck size={13} strokeWidth={2} />
                  7-day money-back guarantee
                </div>
              </div>
            </motion.div>

          </motion.div>
        </section>

        {/* ── SOCIAL PROOF STRIP ── */}
        <section className={styles.proofSection}>
          <div className={styles.proofInner}>
            {SOCIAL_PROOF.map((p) => (
              <div key={p.name} className={styles.proofCard}>
                <div className={styles.proofStars}>
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={12} fill="#fbbf24" color="#fbbf24" />
                  ))}
                </div>
                <p className={styles.proofQuote}>&ldquo;{p.quote}&rdquo;</p>
                <div className={styles.proofMeta}>
                  <span className={styles.proofName}>{p.name}</span>
                  <span className={styles.proofRole}>{p.role}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── FULL COMPARISON TABLE ── */}
        <section className={styles.comparisonSection}>
          <motion.div className={styles.sectionHeaderCenter} {...revealUp()}>
            <span className={styles.sectionLabel}>Full Comparison</span>
            <h2 className={styles.sectionTitle}>Free vs Pro — side by side</h2>
          </motion.div>
          <motion.div {...revealUp(0.1)}>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Feature</th>
                    <th>Free</th>
                    <th>
                      <span className={styles.thPro}>Pro</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {FEATURES.map(({ icon: Icon, label, free, pro }) => (
                    <tr key={label}>
                      <td className={styles.featureName}>
                        <Icon size={14} strokeWidth={1.75} className={styles.featureIcon} />
                        {label}
                      </td>
                      <td>
                        {typeof free === 'boolean'
                          ? free
                            ? <Check size={16} className={styles.checkYes} />
                            : <Minus size={16} className={styles.checkNo} />
                          : <span className={styles.featureValue}>{free}</span>
                        }
                      </td>
                      <td>
                        {typeof pro === 'boolean'
                          ? pro
                            ? <Check size={16} className={styles.checkYes} />
                            : <X size={16} className={styles.checkNo} />
                          : <span className={`${styles.featureValue} ${styles.featureValuePro}`}>{pro}</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </section>

        {/* ── FAQ ── */}
        <section className={styles.faqSection}>
          <motion.h2 className={styles.faqSectionTitle} {...revealUp()}>
            Pricing FAQs
          </motion.h2>
          <motion.div {...faqContainer}>
            {FAQS.map((f, i) => (
              <motion.div
                key={i}
                className={`${styles.faqItem} ${openFaq === i ? styles.faqItemOpen : ''}`}
                {...faqItem}
              >
                <button
                  className={styles.faqQuestion}
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span>{f.q}</span>
                  <motion.svg
                    className={styles.faqChevron}
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    animate={{ rotate: openFaq === i ? 180 : 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <path d="m6 9 6 6 6-6" />
                  </motion.svg>
                </button>
                <AnimatePresence initial={false}>
                  {openFaq === i && (
                    <motion.div {...faqAnswer}>
                      <div className={styles.faqAnswerInner}>{f.a}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* ── CTA ── */}
        <section className={styles.ctaSection}>
          <div className={styles.ctaBg}>
            <Image
                src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1400&q=80"
                alt="Student studying at a desk"
                fill
              style={{ objectFit: 'cover' }}
            />
            <div className={styles.ctaBgOverlay} />
          </div>
          <motion.div className={styles.ctaInner} {...ctaSection}>
            <h2 className={styles.ctaTitle}>Start your review today</h2>
            <p className={styles.ctaSub}>
              Join 10,000+ reviewees preparing smarter with M.E.T.R.I.C..
            </p>
            <div className={styles.ctaActions}>
              <Link href="/register" className={styles.btnPrimary}>
                Get Started Free <ArrowRight size={15} strokeWidth={2.5} />
              </Link>
              <Link href="/features" className={styles.btnGhost}>
                Explore Features
              </Link>
            </div>
          </motion.div>
        </section>

      </main>

      <Footer />
    </>
  )
}