// app/(pages)/roadmap/page.tsx
'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import {
  UserPlus, BookOpen, ClipboardList,
  CheckCircle, BarChart2, TrendingUp,
  ArrowRight, GraduationCap,
} from 'lucide-react'
import { heroContainer, heroItem } from '@/animations/presets/publicPage'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import styles from './roadmap.module.css'

interface Step {
  icon:        React.ElementType
  step:        number
  title:       string
  description: string
  detail:      string
  status:      'done' | 'active' | 'pending'
}

const STUDENT_STEPS: Step[] = [
  {
    icon: UserPlus,   step: 1,
    title: 'Create Account',
    description: 'Register & set up your profile',
    detail: 'Sign up with your email or school credentials, then select your degree program from the 9 supported board-related courses.',
    status: 'done',
  },
  {
    icon: BookOpen,   step: 2,
    title: 'Access Exams',
    description: 'Browse available mock boards',
    detail: 'Explore program-specific mock board exams and subject-based multiple-choice question sets uploaded by authorized faculty.',
    status: 'done',
  },
  {
    icon: ClipboardList, step: 3,
    title: 'Take Mock Exam',
    description: 'Answer within the time limit',
    detail: 'Complete timed, program-specific mock board assessments. Exams are automatically scored upon submission.',
    status: 'active',
  },
  {
    icon: CheckCircle, step: 4,
    title: 'View Results',
    description: 'Scores & item-level feedback',
    detail: 'See your score immediately after submission. Review per-subject performance and identify areas that need improvement.',
    status: 'pending',
  },
  {
    icon: BarChart2,  step: 5,
    title: 'Track Progress',
    description: 'Monitor improvement over time',
    detail: 'Monitor personal performance across multiple exam attempts, view score trends, and retake exams as often as needed.',
    status: 'pending',
  },
  {
    icon: TrendingUp, step: 6,
    title: 'Pass the Board',
    description: 'Sit the PRC exam with confidence',
    detail: 'Use analytical reports to guide your review. When you are ready, sit the actual PRC licensure examination.',
    status: 'pending',
  },
]

const doneCount    = STUDENT_STEPS.filter(s => s.status === 'done').length
const activeStep   = STUDENT_STEPS.find(s => s.status === 'active')
const pendingCount = STUDENT_STEPS.filter(s => s.status === 'pending').length

export default function RoadmapPage() {
  return (
    <>
      <Navbar />

      <main className={styles.page}>

        {/* ── HERO ── */}
        <section className={styles.hero}>
          <div className={styles.heroBg}>
            <Image
              src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1400&q=80"
              alt="Students studying"
              fill style={{ objectFit: 'cover' }} priority
            />
            <div className={styles.heroBgOverlay} />
          </div>
          <div className={styles.heroInner}>
            <motion.div {...heroContainer} className={styles.heroContent}>
              <motion.span {...heroItem} className={styles.heroBadge}>
                How It Works
              </motion.span>
              <motion.h1 {...heroItem} className={styles.heroTitle}>
                Your path from{' '}
                <span className={styles.heroAccent}>student to licensed professional</span>
              </motion.h1>
              <motion.p {...heroItem} className={styles.heroSub}>
                M.E.T.R.I.C. gives you access to mock board examinations, automated
                scoring, and performance tracking — all in one platform built to
                help you pass your PRC licensure exam.
              </motion.p>
              <motion.div {...heroItem} className={styles.legend}>
                <div className={styles.legendItem}>
                  <GraduationCap size={13} strokeWidth={2} />
                  Student Journey
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ── TIMELINE SECTION ── */}
        <section className={styles.timelineSection}>
          <div className={styles.timelineCard}>

            {/* Card header */}
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderLeft}>
                <div className={styles.cardIconWrap}>
                  <GraduationCap size={18} strokeWidth={2} />
                </div>
                <div>
                  <div className={styles.cardTitle}>Student Roadmap</div>
                  <div className={styles.cardBreadcrumb}> Student Journey</div>
                </div>
              </div>
              <div className={styles.cardStepCount}>6 Steps</div>
            </div>

            {/* ── TIMELINE ── */}
            <div className={styles.timelineWrap}>
              <div className={styles.timelineLabel}>Student Journey — 6 Steps to Licensure</div>

              <div className={styles.grid}>

                {/* ── Row 1: labels above (steps 1, 3, 5) ── */}
                {STUDENT_STEPS.map((step, i) => (
                  <div key={`la-${i}`} className={styles.labelAboveCell}>
                    {i % 2 === 0 && (
                      <div className={styles.labelAbove}>
                        <div className={`${styles.labelTitle} ${step.status === 'active' ? styles.labelTitleActive : ''}`}>
                          {step.title}
                        </div>
                        <div className={styles.labelSub}>{step.description}</div>
                      </div>
                    )}
                  </div>
                ))}

                {/* ── Row 2: track + nodes ── */}
                {STUDENT_STEPS.map((step, i) => {
                  const Icon = step.icon
                  const isFirst = i === 0
                  const isLast  = i === STUDENT_STEPS.length - 1
                  return (
                    <div key={`node-${i}`} className={styles.nodeCell}>
                      {/* Left track segment */}
                      {!isFirst && (
                        <div className={`${styles.trackSeg} ${step.status === 'done' || step.status === 'active' ? styles.trackSegFilled : ''}`} />
                      )}

                      {/* Node */}
                      <motion.div
                        className={`${styles.node} ${step.status === 'done' ? styles.nodeDone : ''} ${step.status === 'active' ? styles.nodeActive : ''}`}
                        initial={{ scale: 0.7, opacity: 0 }}
                        whileInView={{ scale: 1, opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.08, duration: 0.35 }}
                      >
                        {step.status === 'done'
                          ? <CheckCircle size={16} strokeWidth={2.5} />
                          : <Icon size={step.status === 'active' ? 17 : 15} strokeWidth={2} />
                        }
                      </motion.div>

                      {/* Right track segment */}
                      {!isLast && (
                        <div className={`${styles.trackSeg} ${step.status === 'done' ? styles.trackSegFilled : ''}`} />
                      )}
                    </div>
                  )
                })}

                {/* ── Row 3: labels below (steps 2, 4, 6) ── */}
                {STUDENT_STEPS.map((step, i) => (
                  <div key={`lb-${i}`} className={styles.labelBelowCell}>
                    {i % 2 !== 0 && (
                      <div className={styles.labelBelow}>
                        <div className={`${styles.labelTitle} ${step.status === 'active' ? styles.labelTitleActive : ''}`}>
                          {step.title}
                        </div>
                        <div className={styles.labelSub}>{step.description}</div>
                      </div>
                    )}
                  </div>
                ))}

                {/* ── Row 4: detail cards ── */}
                {STUDENT_STEPS.map((step, i) => {
                  const Icon = step.icon
                  return (
                    <motion.div
                      key={`card-${i}`}
                      className={`${styles.detailCard} ${step.status === 'done' ? styles.detailCardDone : ''} ${step.status === 'active' ? styles.detailCardActive : ''}`}
                      initial={{ opacity: 0, y: 14 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.07, duration: 0.38 }}
                    >
                      <span className={`${styles.detailStep} ${step.status === 'done' ? styles.detailStepDone : ''} ${step.status === 'active' ? styles.detailStepActive : ''}`}>
                        Step {step.step}
                      </span>
                      <div className={styles.detailIcon}><Icon size={18} strokeWidth={2} /></div>
                      <div className={styles.detailTitle}>{step.title}</div>
                      <p className={styles.detailDesc}>{step.detail}</p>
                    </motion.div>
                  )
                })}

              </div>{/* /grid */}
            </div>{/* /timelineWrap */}

            {/* Footer bar */}
            <div className={styles.cardFooter}>
              <div className={styles.footerItem}>
                <CheckCircle size={15} strokeWidth={2} className={styles.footerIconGreen} />
                {doneCount} step{doneCount !== 1 ? 's' : ''} completed
              </div>
              <div className={styles.footerDivider} />
              <div className={styles.footerItem}>
                <ClipboardList size={15} strokeWidth={2} className={styles.footerIconBlue} />
                {activeStep ? `${activeStep.title} in progress` : 'No active step'}
              </div>
              <div className={styles.footerDivider} />
              <div className={styles.footerItem}>
                <BarChart2 size={15} strokeWidth={2} className={styles.footerIconSlate} />
                {pendingCount} step{pendingCount !== 1 ? 's' : ''} remaining
              </div>
            </div>

          </div>
        </section>

        {/* ── CTA ── */}
        <section className={styles.ctaSection}>
          <div className={styles.ctaBg}>
            <Image
              src="https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=1400&q=80"
              alt="University campus"
              fill style={{ objectFit: 'cover' }}
            />
            <div className={styles.ctaBgOverlay} />
          </div>
          <motion.div
            className={styles.ctaInner}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
          >
            <h2 className={styles.ctaTitle}>Ready to get started?</h2>
            <p className={styles.ctaSub}>
              Join students already using M.E.T.R.I.C. to prepare for their
              Philippine licensure examinations — anytime, anywhere.
            </p>
            <div className={styles.ctaActions}>
              <Link href="/register" className={styles.btnPrimary}>
                Start Reviewing Free <ArrowRight size={15} strokeWidth={2.5} />
              </Link>
              <Link href="/programs" className={styles.btnGhost}>
                Browse Programs
              </Link>
            </div>
          </motion.div>
        </section>

      </main>

      <Footer />
    </>
  )
}