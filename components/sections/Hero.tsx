// src/components/sections/Hero.tsx

'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useCountUp } from '@/lib/hooks/useCountUp'
import styles from '@/app/page.module.css'

const TYPED_PHRASES = [
  'Board Exam',
  'Licensure Exam',
  'PRC Exam',
  'Review Exam',
]

const STATIC_IMAGES = {
  main:      { src: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=900&q=80', alt: 'Student studying for board exam' },
  secondary: { src: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&q=80', alt: 'Medical professional reviewing materials' },
  accent:    { src: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=400&q=80', alt: 'Library and academic resources' },
}

function TypingText() {
  const [phraseIdx, setPhraseIdx] = useState(0)
  const [displayed, setDisplayed] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const phrase = TYPED_PHRASES[phraseIdx]
    let timeout: ReturnType<typeof setTimeout>

    if (!deleting && displayed.length < phrase.length) {
      timeout = setTimeout(() => setDisplayed(phrase.slice(0, displayed.length + 1)), 80)
    } else if (!deleting && displayed.length === phrase.length) {
      timeout = setTimeout(() => setDeleting(true), 1800)
    } else if (deleting && displayed.length > 0) {
      timeout = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 45)
    } else if (deleting && displayed.length === 0) {
      timeout = setTimeout(() => {
        setDeleting(false)
        setPhraseIdx((i) => (i + 1) % TYPED_PHRASES.length)
      }, 0)
    }

    return () => clearTimeout(timeout)
  }, [displayed, deleting, phraseIdx])

  return <span className={styles.heroTyped}>{displayed}</span>
}

function StatItem({ end, suffix, label }: { end: number; suffix: string; label: string }) {
  const { display, ref } = useCountUp({ end, suffix, duration: 1600 })
  return (
    <div className={styles.heroStat}>
      <div
        className={styles.heroStatValue}
        ref={ref as React.RefObject<HTMLDivElement>}
        aria-label={`${end.toLocaleString()}${suffix} ${label}`}
      >
        {display}
      </div>
      <div className={styles.heroStatLabel}>{label}</div>
    </div>
  )
}

export default function Hero() {
  return (
    <section className={styles.hero} aria-label="Hero">
      <div className={styles.heroContent}>
        <div className={`${styles.heroBadge}`}></div>

        <h1 className={`${styles.heroTitle} reveal reveal-delay-1`}>
          Ace Your{' '}
          <TypingText />
          <span className={styles.heroTitleAccent}>on the First Try.</span>
        </h1>

        <p className={`${styles.heroSub} reveal reveal-delay-2`}>
          VERIPRAXIS delivers adaptive mock exams, real-time analytics, and
          structured review paths built specifically for Filipino board exam
          candidates.
        </p>

        <div className={`${styles.heroActions} reveal reveal-delay-3`}>
          <Link href="/" prefetch={true} className={styles.btnPrimary}>
            Start Reviewing Free
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5-5 5M6 12h12" />
            </svg>
          </Link>
          <Link href="#features" className={styles.btnOutline}>
            See How It Works
          </Link>
        </div>

        <div className={`${styles.heroStats} reveal reveal-delay-4`}>
          <StatItem end={10000} suffix="+" label="Active Reviewees" />
          <StatItem end={5000}  suffix="+" label="Reviewer Questions" />
          <StatItem end={95}    suffix="%" label="Pass Rate" />
        </div>
      </div>

      <div className={`${styles.heroVisual} reveal reveal-delay-2`} aria-hidden="true">
        <Image
          src={STATIC_IMAGES.main.src}
          alt={STATIC_IMAGES.main.alt}
          width={900}
          height={600}
          className={styles.heroImgMain}
          priority
        />
        <Image
          src={STATIC_IMAGES.secondary.src}
          alt={STATIC_IMAGES.secondary.alt}
          width={600}
          height={400}
          className={styles.heroImgSecondary}
        />
        <Image
          src={STATIC_IMAGES.accent.src}
          alt={STATIC_IMAGES.accent.alt}
          width={400}
          height={300}
          className={styles.heroImgAccent}
        />

        <div className={styles.heroImgFloat}>
          <div className={styles.heroImgFloatIcon}>
            <svg className={styles.heroImgFloatIconSvg} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className={styles.heroImgFloatText}>
            <div className={styles.heroImgFloatLabel}>Mock Exam Score</div>
            <div className={styles.heroImgFloatValue}>78/100</div>
          </div>
        </div>
      </div>
    </section>
  )
}
