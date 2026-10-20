// app/(pages)/features/page.tsx

'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import {
  Brain,
  BarChart2,
  Map,
  Trophy,
  FileText,
  Smartphone,
  Zap,
  Target,
  RefreshCw,
  TrendingUp,
  Search,
  Timer,
  Compass,
  CheckCircle,
  BookOpen,
  ArrowRight,
} from 'lucide-react'
import styles from './features.module.css'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import {
  heroContainer,
  heroFadeUp,
  heroImageZoom,
  cardsContainer,
  featureCard,
  splitText,
  splitVisual,
} from '@/animations/features/featuresAnimations'

const OVERVIEW_CARDS = [
  {
    icon: Brain,
    title: 'Adaptive Questioning',
    desc: 'Our engine adjusts difficulty in real time based on your answers, so every session pushes you exactly where you need it most.',
  },
  {
    icon: BarChart2,
    title: 'Real-Time Analytics',
    desc: 'Track scores, spot weak topics, and watch your progress curve shift week over week with detailed per-subject breakdowns.',
  },
  {
    icon: Map,
    title: 'Structured Review Paths',
    desc: 'Follow curated study roadmaps designed around actual PRC exam coverage—nothing filler, nothing missing.',
  },
  {
    icon: Trophy,
    title: 'Live Leaderboards',
    desc: 'Compete with peers nationwide. Rankings refresh after every exam session to keep motivation sharp.',
  },
  {
    icon: FileText,
    title: 'Post-Exam Rationale',
    desc: 'Every question comes with a detailed explanation so you understand the "why," not just the correct letter.',
  },
  {
    icon: Smartphone,
    title: 'Web & Mobile',
    desc: 'Switch seamlessly between desktop and phone. Your progress syncs instantly across every device you own.',
  },
]

const ADAPTIVE_FEATURES = [
  { icon: Zap,       title: 'Dynamic difficulty scaling', desc: 'Harder questions appear as you improve; easier ones surface where you slip.' },
  { icon: Target,    title: 'Topic-pinpoint targeting',   desc: 'The engine identifies weak areas and over-indexes questions there.' },
  { icon: RefreshCw, title: 'Spaced repetition logic',    desc: 'Missed items resurface at intervals proven to move them into long-term memory.' },
]

const ANALYTICS_FEATURES = [
  { icon: TrendingUp, title: 'Score trend over time',    desc: 'Session-by-session charts show your upward curve clearly.' },
  { icon: Search,     title: 'Per-topic breakdown',      desc: 'See exactly which subject areas are dragging your average down.' },
  { icon: Timer,      title: 'Time management insights', desc: 'Average time per question flagged against passing benchmarks.' },
]

const REVIEW_FEATURES = [
  { icon: Compass,      title: 'PRC-aligned curriculum map', desc: 'Coverage mirrors the actual table of specifications for each program.' },
  { icon: CheckCircle,  title: 'Progress checkpoints',       desc: 'Clear milestones so you know when a subject is truly ready.' },
  { icon: BookOpen,     title: 'Multi-program support',      desc: 'Nursing, Engineering, Education, and more — each with their own path.' },
]

const COMPARISON_ROWS = [
  { feature: 'Adaptive difficulty engine',      veri: true,  others: false },
  { feature: 'Per-topic performance breakdown',  veri: true,  others: false },
  { feature: 'PRC-aligned question bank',        veri: true,  others: true  },
  { feature: 'Detailed answer rationale',        veri: true,  others: false },
  { feature: 'Live nationwide leaderboard',      veri: true,  others: false },
  { feature: 'Mobile-first experience',          veri: true,  others: true  },
  { feature: 'Multi-program support',            veri: true,  others: false },
  { feature: 'Free starter plan',                veri: true,  others: true  },
]

export default function FeaturesPage() {
  return (
    <>
      <Navbar />

      <main className={styles.page}>

        {/* ── HERO ── */}
<motion.section className={styles.hero} {...heroContainer}>

  <div className={styles.heroImageGrid}>

    <motion.div
      className={styles.heroImgA}
      {...heroImageZoom}
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
    >
      <Image
        src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&q=80"
        alt="Student reviewing notes"
        fill
        style={{ objectFit: 'cover' }}
        priority
      />
    </motion.div>

    <motion.div
      className={styles.heroImgB}
      {...heroImageZoom}
      transition={{ delay: 0.2 }}
    >
      <Image
        src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&q=80"
        alt="Students studying together"
        fill
        style={{ objectFit: 'cover' }}
      />
    </motion.div>

    <motion.div
      className={styles.heroImgC}
      {...heroImageZoom}
      transition={{ delay: 0.35 }}
    >
      <Image
        src="https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=500&q=80"
        alt="Books and study materials"
        fill
        style={{ objectFit: 'cover' }}
      />
    </motion.div>

    <div className={styles.heroOverlay} />
  </div>

  <div className={styles.heroBody}>
    <motion.span className={styles.heroBadge} {...heroFadeUp}>
      Platform Features
    </motion.span>

    <motion.h1 className={styles.heroTitle} {...heroFadeUp}>
      Built for one goal —<br />
      <span className={styles.heroAccent}>
        passing your board exam.
      </span>
    </motion.h1>

    <motion.p className={styles.heroSub} {...heroFadeUp}>
      Every feature in M.E.T.R.I.C. exists because Filipino reviewees needed it.
      No bloat. No filler. Just the tools that actually move your score.
    </motion.p>

    <motion.div className={styles.heroActions} {...heroFadeUp}>
      <Link href="/signup" className={styles.btnPrimary}>
        Start Free Today
      </Link>
      <Link href="/pricing" className={styles.btnGhost}>
        See Pricing
      </Link>
    </motion.div>
  </div>

</motion.section>

        {/* ── OVERVIEW CARDS — Animation 1: stagger scale-in on scroll ── */}
        <section className={styles.overviewSection}>
          <span className={styles.sectionLabel}>What&#39;s Inside</span>
          <h2 className={styles.sectionTitle}>Everything in one platform</h2>
          <p className={styles.sectionSub}>
            Six core pillars designed to take you from uncertain to exam-ready.
          </p>
          <motion.div
            className={styles.overviewGrid}
            {...cardsContainer}
          >
            {OVERVIEW_CARDS.map(({ icon: Icon, title, desc }) => (
              <motion.div
                key={title}
                className={styles.overviewCard}
                {...featureCard}
              >
                <div className={styles.cardIcon}>
                  <Icon size={22} strokeWidth={1.75} />
                </div>
                <h3 className={styles.cardTitle}>{title}</h3>
                <p className={styles.cardDesc}>{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* ── SPLIT: Adaptive Engine — Animation 2: slide in from sides ── */}
        <section className={styles.splitAlt}>
          <div className={styles.splitAltInner}>
            <div className={styles.splitRow}>
              <motion.div className={styles.splitContent} {...splitText(true)}>
                <span className={styles.sectionLabel}>Smart Exam Engine</span>
                <h2 className={styles.sectionTitle}>Questions that adapt to you</h2>
                <p className={styles.sectionSub}>
                  Not everyone starts at the same level. M.E.T.R.I.C. reads your performance
                  in real time and adjusts question difficulty so you&#39;re always being
                  challenged—never bored, never overwhelmed.
                </p>
                <div className={styles.featureList}>
                  {ADAPTIVE_FEATURES.map(({ icon: Icon, title, desc }) => (
                    <div key={title} className={styles.featureListItem}>
                      <div className={styles.featureListIcon}>
                        <Icon size={17} strokeWidth={1.75} />
                      </div>
                      <div>
                        <div className={styles.featureListTitle}>{title}</div>
                        <div className={styles.featureListDesc}>{desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
              <motion.div className={styles.splitVisualImg} {...splitVisual(false)}>
                <Image
                  src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80"
                  alt="Person studying on laptop"
                  fill
                  style={{ objectFit: 'cover' }}
                />
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── SPLIT: Analytics ── */}
        <section className={styles.splitSection}>
          <div className={styles.splitRowReverse}>
            <motion.div className={styles.splitContent} {...splitText(false)}>
              <span className={styles.sectionLabel}>Performance Analytics</span>
              <h2 className={styles.sectionTitle}>Know exactly where you stand</h2>
              <p className={styles.sectionSub}>
                Gut feeling isn&#39;t a study strategy. M.E.T.R.I.C. gives you hard
                numbers — per-subject scores, time-per-question, and a trend line
                that shows whether your preparation is actually working.
              </p>
              <div className={styles.featureList}>
                {ANALYTICS_FEATURES.map(({ icon: Icon, title, desc }) => (
                  <div key={title} className={styles.featureListItem}>
                    <div className={styles.featureListIcon}>
                      <Icon size={17} strokeWidth={1.75} />
                    </div>
                    <div>
                      <div className={styles.featureListTitle}>{title}</div>
                      <div className={styles.featureListDesc}>{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
            <motion.div className={styles.splitVisualImg} {...splitVisual(true)}>
              <Image
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80"
                alt="Analytics dashboard on screen"
                fill
                style={{ objectFit: 'cover' }}
              />
            </motion.div>
          </div>
        </section>

        {/* ── SPLIT: Review Paths ── */}
        <section className={styles.splitAlt}>
          <div className={styles.splitAltInner}>
            <div className={styles.splitRow}>
              <motion.div className={styles.splitContent} {...splitText(true)}>
                <span className={styles.sectionLabel}>Review Paths</span>
                <h2 className={styles.sectionTitle}>A roadmap, not just random drills</h2>
                <p className={styles.sectionSub}>
                  Random practice only goes so far. M.E.T.R.I.C. structures your review
                  around the actual coverage of your board exam — ordered, progressive,
                  and complete.
                </p>
                <div className={styles.featureList}>
                  {REVIEW_FEATURES.map(({ icon: Icon, title, desc }) => (
                    <div key={title} className={styles.featureListItem}>
                      <div className={styles.featureListIcon}>
                        <Icon size={17} strokeWidth={1.75} />
                      </div>
                      <div>
                        <div className={styles.featureListTitle}>{title}</div>
                        <div className={styles.featureListDesc}>{desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
              <motion.div className={styles.splitVisualImg} {...splitVisual(false)}>
                <Image
                  src="https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=800&q=80"
                  alt="Library books and study resources"
                  fill
                  style={{ objectFit: 'cover' }}
                />
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── SOCIAL PROOF STRIP ── */}
        <section className={styles.proofStrip}>
          <div className={styles.proofInner}>
            <div className={styles.proofStat}>
              <span className={styles.proofValue}>10,000+</span>
              <span className={styles.proofLabel}>Active Reviewees</span>
            </div>
            <div className={styles.proofDivider} />
            <div className={styles.proofStat}>
              <span className={styles.proofValue}>5,000+</span>
              <span className={styles.proofLabel}>Reviewer Questions</span>
            </div>
            <div className={styles.proofDivider} />
            <div className={styles.proofStat}>
              <span className={styles.proofValue}>95%</span>
              <span className={styles.proofLabel}>Pass Rate</span>
            </div>
            <div className={styles.proofDivider} />
            <div className={styles.proofStat}>
              <span className={styles.proofValue}>12+</span>
              <span className={styles.proofLabel}>Degree Programs</span>
            </div>
          </div>
        </section>

        {/* ── COMPARISON TABLE ── */}
        <section className={styles.comparisonSection}>
          <div className={styles.sectionHeaderCenter}>
            <span className={styles.sectionLabel}>How We Compare</span>
            <h2 className={styles.sectionTitle}>M.E.T.R.I.C. vs Other Review Tools</h2>
            <p className={styles.sectionSub} style={{ margin: '0 auto' }}>
              Not all review tools are built the same. Here&#39;s how M.E.T.R.I.C.
              stands out to help you succeed.
            </p>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Feature</th>
                  <th>M.E.T.R.I.C.</th>
                  <th>Others</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((r) => (
                  <tr key={r.feature}>
                    <td className={styles.featureName}>{r.feature}</td>
                    <td className={r.veri   ? styles.checkYes : styles.checkNo}>{r.veri   ? '✓' : '✗'}</td>
                    <td className={r.others ? styles.checkYes : styles.checkNo}>{r.others ? '✓' : '✗'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── TESTIMONIAL ── */}
        <section className={styles.testimonialSection}>
          <div className={styles.testimonialInner}>
            <div className={styles.testimonialImgWrap}>
              <Image
                src="https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=900&q=80"
                alt="University campus"
                fill
                style={{ objectFit: 'cover' }}
              />
              <div className={styles.testimonialImgOverlay} />
            </div>
            <div className={styles.testimonialContent}>
              <span className={styles.testimonialQuoteMark}>{'\u201C'}</span>
              <p className={styles.testimonialText}>
                I failed twice before M.E.T.R.I.C.. The analytics showed me I was losing
                points in Pharmacology every single time. Three months of targeted review
                later, I passed with 87%.
              </p>
              <div className={styles.testimonialAuthor}>
                <div className={styles.testimonialName}>Kyla Reyes</div>
                <div className={styles.testimonialRole}>BSN Graduate · PRC Nursing Exam Passer</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className={styles.ctaSection}>
          <h2 className={styles.ctaTitle}>Ready to start reviewing smarter?</h2>
          <p className={styles.ctaSub}>
            Join thousands of Filipino board exam candidates who stopped guessing
            and started passing.
          </p>
          <div className={styles.ctaActions}>
            <Link href="/register" className={styles.btnPrimary}>
              Create Free Account
              <ArrowRight size={15} strokeWidth={2.5} />
            </Link>
            <Link href="/programs" className={styles.btnGhost}>Browse Programs</Link>
          </div>
        </section>

      </main>

      <Footer />
    </>
  )
}
