// app/(pages)/about/page.tsx
'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import {
  Target, Users, BookOpen, ShieldCheck,
  Lightbulb, Heart, ArrowRight, MapPin, Mail,
} from 'lucide-react'
import {
  heroContainer, heroItem, revealUp,
} from '@/animations/presets/publicPage'
import {
  statsContainer, statCard,
  missionText, missionImage,
  valuesContainer, valueItem,
  teamContainer, teamCard,
} from '@/animations/about/aboutAnimations'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import styles from './about.module.css'

const STATS = [
  { value: '10,000+', label: 'Reviewees Helped' },
  { value: '94%',     label: 'Avg Pass Rate'    },
  { value: '12',      label: 'PRC Programs'     },
  { value: '2022',    label: 'Year Founded'     },
]

const VALUES = [
  {
    icon: Target,
    title: 'Accuracy First',
    desc: 'Every question is curated and validated by licensed professionals. No recycled banks, no unverified items.',
    color: '#2563eb', bg: '#eff6ff',
  },
  {
    icon: Users,
    title: 'Reviewee-Centered',
    desc: 'Built by listening to actual board exam takers. Every feature came from a real pain point we heard firsthand.',
    color: '#16a34a', bg: '#f0fdf4',
  },
  {
    icon: Lightbulb,
    title: 'Adaptive by Design',
    desc: 'We don\'t believe in one-size-fits-all review. Our platform learns your weak spots and targets them.',
    color: '#d97706', bg: '#fffbeb',
  },
  {
    icon: ShieldCheck,
    title: 'Transparent & Fair',
    desc: 'Simple pricing, honest roadmap, no dark patterns. We show you exactly what you\'re getting.',
    color: '#7c3aed', bg: '#faf5ff',
  },
  {
    icon: BookOpen,
    title: 'Content Integrity',
    desc: 'Our question bank is updated every quarter based on the latest PRC exam trends and community reports.',
    color: '#0891b2', bg: '#ecfeff',
  },
  {
    icon: Heart,
    title: 'Filipino-Built',
    desc: 'We are reviewees ourselves. We understand the pressure, the stakes, and what it feels like to finally pass.',
    color: '#dc2626', bg: '#fef2f2',
  },
]

const TEAM = [
  {
    name:   'Julian Martir',
    role:   'Founder & Lead Developer',
    photo:  '/images/julian.jpg',
    bio:    'Full-stack developer and former board exam reviewer who built M.E.T.R.I.C. after failing to find a platform that actually helped.',
    loc:    'Bacolod City, PH',
  },
  {
    name:   'Content Team',
    role:   'Question Bank & Curriculum',
    photo:  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&q=80',
    bio:    'Licensed professionals across nursing, engineering, and accountancy who validate every item in our question bank.',
    loc:    'Philippines',
  },
  {
    name:   'James Roger Jaype',
    role:   'Product Design',
    photo:  '/images/james.JPG',
    bio:    'Focused on making every interaction feel fast, intuitive, and helpful — never frustrating.',
    loc:    'Remote',
  },
]

export default function AboutPage() {
  return (
    <>
      <Navbar />

      <main className={styles.page}>

        {/* ── HERO ── */}
        <section className={styles.hero}>
          {/* Background: 2-panel split photo */}
          <div className={styles.heroBg}>
            <div className={styles.heroBgLeft}>
              <Image
                src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=900&q=80"
                alt="Student studying"
                fill style={{ objectFit: 'cover' }}
                priority
              />
            </div>
            <div className={styles.heroBgRight}>
              <Image
                src="https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=900&q=80"
                alt="University campus"
                fill style={{ objectFit: 'cover' }}
              />
            </div>
            <div className={styles.heroBgOverlay} />
          </div>

          <div className={styles.heroInner}>
            <motion.div {...heroContainer} className={styles.heroContent}>
              <motion.span {...heroItem} className={styles.heroBadge}>
                About M.E.T.R.I.C.
              </motion.span>
              <motion.h1 {...heroItem} className={styles.heroTitle}>
                Built for board exam{' '}
                <span className={styles.heroAccent}>success.</span>
              </motion.h1>
              <motion.p {...heroItem} className={styles.heroSub}>
                M.E.T.R.I.C. started as a frustration — the available review tools were
                either outdated, inaccurate, or built for everyone except Filipino
                board exam candidates. So we built our own.
              </motion.p>
              <motion.div {...heroItem} className={styles.heroActions}>
                <Link href="/programs" className={styles.btnPrimary}>
                  Browse Programs <ArrowRight size={15} strokeWidth={2.5} />
                </Link>
                <Link href="/contact" className={styles.btnGhost}>
                  Get in Touch
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ── STATS STRIP ── */}
        <div className={styles.statsStrip}>
          <motion.div className={styles.statsInner} {...statsContainer}>
            {STATS.map(({ value, label }) => (
              <motion.div key={label} className={styles.statItem} {...statCard}>
                <div className={styles.statValue}>{value}</div>
                <div className={styles.statLabel}>{label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* ── ORIGIN STORY / MISSION SPLIT ── */}
        <section className={styles.missionSection}>
          <div className={styles.missionInner}>
            <motion.div className={styles.missionText} {...missionText}>
              <span className={styles.sectionLabel}>Our Story</span>
              <h2 className={styles.sectionTitle}>
                Why we built M.E.T.R.I.C.
              </h2>
              <p className={styles.missionBody}>
                In 2022, our founder was preparing for his board exam and kept
                running into the same problem — every review platform felt like it
                was designed for someone else. Questions without rationale.
                No analytics. No way to know if you were actually improving.
              </p>
              <p className={styles.missionBody}>
                He built the first version of M.E.T.R.I.C. for himself. After passing,
                he shared it with his batchmates. Word spread. Within six months,
                over a hundred reviewees were using it.
              </p>
              <p className={styles.missionBody}>
                Today, M.E.T.R.I.C. serves thousands of Filipino professionals across
                12 PRC programs — and we&#39;re just getting started.
              </p>
              <div className={styles.missionQuote}>
                <div className={styles.missionQuoteMark}>{'\u201C'}</div>
                <p>We don&#39;t just want you to pass. We want you to walk into
                that exam room confident.</p>
              </div>
            </motion.div>

            <motion.div className={styles.missionImageWrap} {...missionImage}>
              <Image
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80"
                alt="Students collaborating"
                fill style={{ objectFit: 'cover' }}
              />
              {/* Floating badge */}
              <div className={styles.missionBadge}>
                <div className={styles.missionBadgeValue}>94%</div>
                <div className={styles.missionBadgeLabel}>pass rate among<br />Pro users</div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── VALUES ── */}
        <section className={styles.valuesSection}>
          <div className={styles.valuesSectionInner}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionLabel}>What We Stand For</span>
              <h2 className={styles.sectionTitle}>Our core values</h2>
              <p className={styles.sectionSub}>
                Six principles that guide every decision we make — from
                what questions we include to how we price our plans.
              </p>
            </div>
            <motion.div className={styles.valuesGrid} {...valuesContainer}>
              {VALUES.map(({ icon: Icon, title, desc, color, bg }) => (
                <motion.div key={title} className={styles.valueCard} {...valueItem}>
                  <div className={styles.valueIcon} style={{ background: bg, color }}>
                    <Icon size={20} strokeWidth={1.75} />
                  </div>
                  <h3 className={styles.valueTitle}>{title}</h3>
                  <p className={styles.valueDesc}>{desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── MISSION PHOTO BREAK ── */}
        <section className={styles.photoBreak}>
          <Image
            src="https://images.pexels.com/photos/1205651/pexels-photo-1205651.jpeg?auto=compress&cs=tinysrgb&w=1400"
            alt="Graduates celebrating"
            fill style={{ objectFit: 'cover' }}
          />
          <div className={styles.photoBreakOverlay} />
          <motion.div className={styles.photoBreakContent} {...revealUp()}>
            <blockquote className={styles.photoBreakQuote}>
              Every Filipino professional deserves a review tool
              that actually works.
            </blockquote>
            <div className={styles.photoBreakAuthor}>— The M.E.T.R.I.C. Team</div>
          </motion.div>
        </section>

        {/* ── TEAM ── */}
        <section className={styles.teamSection}>
          <div className={styles.teamInner}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionLabel}>The People</span>
              <h2 className={styles.sectionTitle}>Who builds M.E.T.R.I.C.</h2>
              <p className={styles.sectionSub}>
                A small, focused team of developers, educators, and licensed
                professionals — all with a stake in helping you pass.
              </p>
            </div>
            <motion.div className={styles.teamGrid} {...teamContainer}>
              {TEAM.map(({ name, role, photo, bio, loc }) => (
                <motion.div key={name} className={styles.teamCard} {...teamCard}>
                  <div className={styles.teamPhoto}>
                    <Image src={photo} alt={name} fill style={{ objectFit: 'cover' }} />
                  </div>
                  <div className={styles.teamBody}>
                    <div className={styles.teamName}>{name}</div>
                    <div className={styles.teamRole}>{role}</div>
                    <p className={styles.teamBio}>{bio}</p>
                    <div className={styles.teamLoc}>
                      <MapPin size={12} strokeWidth={2} />
                      {loc}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className={styles.ctaSection}>
          <div className={styles.ctaBg}>
            <Image
              src="https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1400&q=80"
              alt="Books and study materials"
              fill style={{ objectFit: 'cover' }}
            />
            <div className={styles.ctaBgOverlay} />
          </div>
          <motion.div className={styles.ctaInner} {...revealUp()}>
            <h2 className={styles.ctaTitle}>Ready to join the community?</h2>
            <p className={styles.ctaSub}>
              Start reviewing smarter today — free, no credit card required.
            </p>
            <div className={styles.ctaActions}>
              <Link href="/register" className={styles.btnPrimary}>
                Create Free Account <ArrowRight size={15} strokeWidth={2.5} />
              </Link>
              <Link href="/contact" className={styles.btnGhostDark}>
                <Mail size={14} strokeWidth={2} /> Contact Us
              </Link>
            </div>
          </motion.div>
        </section>

      </main>

      <Footer />
    </>
  )
}