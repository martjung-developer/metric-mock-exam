// app/(pages)/blog/page.tsx
'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import {
  ArrowRight, Rss,
  BadgeCheck, Star, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { heroContainer, heroItem } from '@/animations/presets/publicPage'
import {
  filterRow, newsletter,
} from '@/animations/blog/blogAnimations'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import styles from './blog.module.css'

/* ─────────────────────────────────────────
   BLOG DATA
───────────────────────────────────────── */
const CATEGORIES = ['All', 'Study Tips', 'Exam Updates', 'Success Stories', 'Wellness']


/* ─────────────────────────────────────────
   WALL OF TRUST DATA
───────────────────────────────────────── */
type EndorserType = 'prc-professional' | 'faculty-head' | 'board-passer' | 'hiring-partner' | 'review-center'

interface Endorser {
  initials:   string
  name:       string
  role:       string
  type:       EndorserType
  quote:      string
  stars:      number
  verifiedAs: string
}

const TYPE_CONFIG: Record<EndorserType, { label: string; color: string; bg: string; border: string; avatar: string }> = {
  'prc-professional': { label: 'PRC Professional',   color: '#0C447C', bg: '#E6F1FB', border: '#85B7EB', avatar: '#dbeafe' },
  'faculty-head':     { label: 'Faculty Head',        color: '#085041', bg: '#E1F5EE', border: '#5DCAA5', avatar: '#ccfbf1' },
  'board-passer':     { label: 'Board Exam Passer',   color: '#3C3489', bg: '#EEEDFE', border: '#AFA9EC', avatar: '#ede9fe' },
  'hiring-partner':   { label: 'Hiring Partner',      color: '#633806', bg: '#FAEEDA', border: '#EF9F27', avatar: '#fef3c7' },
  'review-center':    { label: 'Review Center',       color: '#712B13', bg: '#FAECE7', border: '#F0997B', avatar: '#ffedd5' },
}

const ENDORSERS: Endorser[] = [
  {
    initials: 'MR', name: 'Dr. Maria Reyes',
    role: 'Licensed Physician · PRC Reg. No. 012345',
    type: 'prc-professional', stars: 5,
    quote: 'VeriPraxis questions are remarkably close to the actual board format. I recommend it to all my interns preparing for their licensure.',
    verifiedAs: 'Verified PRC license holder',
  },
  {
    initials: 'JC', name: 'Prof. Jose Cruz',
    role: 'Dean, College of Education · LCCB Bacolod',
    type: 'faculty-head', stars: 5,
    quote: "Our students who used VeriPraxis consistently outperform in the LET. The question quality and subject alignment to PRC's syllabus is excellent. This is now part of our official review toolkit.",
    verifiedAs: 'Verified school department head',
  },
  {
    initials: 'AL', name: 'Ana Lim',
    role: 'LET Passer — Secondary Math · Batch 2024',
    type: 'board-passer', stars: 5,
    quote: 'Passed on my first try! The per-subject drills and analytics helped me pinpoint exactly where I was weak. Highly recommend to all future teachers.',
    verifiedAs: 'Verified board exam passer',
  },
  {
    initials: 'SP', name: 'Sir. Samuel Perez',
    role: 'Lead Instructor · Leyte Review Center',
    type: 'review-center', stars: 5,
    quote: "I've seen dozens of review platforms. VeriPraxis stands out because the rationale per question actually teaches — not just tells — the correct answer. My reviewees love it.",
    verifiedAs: 'Verified review center instructor',
  },
  {
    initials: 'CG', name: 'Arch. Clara Garcia',
    role: 'Licensed Architect · PRC Reg. No. 023891',
    type: 'prc-professional', stars: 5,
    quote: 'The ALE question bank is thorough and well-structured. I wish this existed when I was reviewing. Passed my boards and now refer all junior colleagues here.',
    verifiedAs: 'Verified PRC license holder',
  },
  {
    initials: 'RB', name: 'Engr. Rico Bautista',
    role: 'HR Manager · Aboitiz Construction Group',
    type: 'hiring-partner', stars: 4,
    quote: 'We actively encourage fresh graduates to use VeriPraxis before applying. Candidates who pass their boards on the first attempt stand out significantly in our hiring process.',
    verifiedAs: 'Verified company representative',
  },
  {
    initials: 'KS', name: 'Karen Santos',
    role: 'LLE Passer · Batch 2023',
    type: 'board-passer', stars: 4,
    quote: 'Great question bank for LLE. The cataloging and classification section could use a few more items but overall the platform is well-designed and easy to use.',
    verifiedAs: 'Verified board exam passer',
  },
  {
    initials: 'BT', name: 'Prof. Ben Torres',
    role: 'Program Chair, Architecture · STI Bacolod',
    type: 'faculty-head', stars: 4,
    quote: 'A solid platform for architecture students. I would love to see more structural engineering questions added to the ALE bank in future updates.',
    verifiedAs: 'Verified school department head',
  },
  {
    initials: 'LD', name: 'Liza Dela Cruz',
    role: 'Interior Design Passer · Batch 2024',
    type: 'board-passer', stars: 3,
    quote: 'The IDLE section is good but still growing. Some topics are not yet fully covered. I supplemented with other materials but the mock exam format was very helpful.',
    verifiedAs: 'Verified board exam passer',
  },
  {
    initials: 'MN', name: 'Mark Navarro',
    role: 'PLE Passer · Batch 2023',
    type: 'board-passer', stars: 3,
    quote: 'Decent platform overall. The UI is clean and easy to navigate. Wish the PLE statistics section had more depth — it felt lighter than the other subjects.',
    verifiedAs: 'Verified board exam passer',
  },
  {
    initials: 'RP', name: 'Riza Pascual',
    role: 'Review Center Coordinator · Cebu',
    type: 'review-center', stars: 2,
    quote: 'Promising platform but still needs more content for some programs. The mobile experience also needs improvement — some pages load slowly on our students\' phones.',
    verifiedAs: 'Verified review center instructor',
  },
  {
    initials: 'JM', name: 'Joel Mendoza',
    role: 'LET Secondary Science Passer · Batch 2024',
    type: 'board-passer', stars: 2,
    quote: 'The science section needs more biology questions. I found myself relying on other review materials to cover those gaps. The platform itself is well-designed though.',
    verifiedAs: 'Verified board exam passer',
  },
]

type SortOption = 'all' | 'positive' | 'negative'
const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'all',      label: 'All Reviews'  },
  { value: 'positive', label: 'Highest First' },
  { value: 'negative', label: 'Lowest First' },
]
const ITEMS_PER_PAGE = 6

function StarRow({ count }: { count: number }) {
  return (
    <div className={styles.wotStars}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={12}
          strokeWidth={1.5}
          fill={i < count ? '#f59e0b' : 'none'}
          color={i < count ? '#f59e0b' : 'var(--slate-border)'}
        />
      ))}
    </div>
  )
}

/* ─────────────────────────────────────────
   PAGE
───────────────────────────────────────── */
export default function BlogPage() {
  const [activeCategory, setActiveCategory] = React.useState('All')

  // Wall of Trust state
  const [sort, setSort]           = useState<SortOption>('all')
  const [starFilter, setStarFilter] = useState<number>(0)
  const [page, setPage]           = useState(1)

  // WoT logic
  const wotSorted = [...ENDORSERS].sort((a, b) =>
    sort === 'positive' ? b.stars - a.stars :
    sort === 'negative' ? a.stars - b.stars : 0
  )
  const wotFiltered   = starFilter === 0 ? wotSorted : wotSorted.filter((e) => e.stars === starFilter)
  const totalPages    = Math.ceil(wotFiltered.length / ITEMS_PER_PAGE)
  const wotPaginated  = wotFiltered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)
  const avgRating     = (ENDORSERS.reduce((s, e) => s + e.stars, 0) / ENDORSERS.length).toFixed(1)
  const starCounts    = [5, 4, 3, 2, 1].map((s) => ({
    star:  s,
    count: ENDORSERS.filter((e) => e.stars === s).length,
    pct:   Math.round((ENDORSERS.filter((e) => e.stars === s).length / ENDORSERS.length) * 100),
  }))

  function handleSort(v: SortOption) { setSort(v); setPage(1) }
  function handleStar(v: number)     { setStarFilter(v); setPage(1) }

  return (
    <>
      <Navbar />

      <main className={styles.page}>

        {/* ── HERO ── */}
        <section className={styles.hero}>
          <div className={styles.heroBg}>
            <Image
              src="https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1400&q=80"
              alt="Library books"
              fill style={{ objectFit: 'cover' }}
              priority
            />
            <div className={styles.heroBgOverlay} />
          </div>
          <div className={styles.heroInner}>
            <motion.div {...heroContainer} className={styles.heroContent}>
              <motion.span {...heroItem} className={styles.heroBadge}>
                <Rss size={11} strokeWidth={2.5} />
                VeriPraxis Blog
              </motion.span>
              <motion.h1 {...heroItem} className={styles.heroTitle}>
                Insights for the{' '}
                <span className={styles.heroAccent}>serious reviewee.</span>
              </motion.h1>
              <motion.p {...heroItem} className={styles.heroSub}>
                Study strategies, PRC exam updates, success stories, and wellness
                tips — all designed to help you pass.
              </motion.p>
              <motion.div {...filterRow} className={styles.filterRow}>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    className={`${styles.filterBtn} ${activeCategory === cat ? styles.filterBtnActive : ''}`}
                    onClick={() => setActiveCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ── WALL OF TRUST ── */}
        <section className={styles.wotSection}>
          <div className={styles.wotInner}>

            {/* Header row */}
            <div className={styles.wotHeader}>
              <div className={styles.wotHeaderLeft}>
                <span className={styles.wotEyebrow}>
                  <span className={styles.wotEyebrowDot} />
                  Wall of Trust
                </span>
                <h2 className={styles.wotTitle}>Reviewed by professionals & educators</h2>
                <p className={styles.wotSub}>Real voices from the Philippine licensure community</p>
              </div>

              {/* Rating summary card */}
              <div className={styles.wotRatingCard}>
                <div className={styles.wotRatingBig}>{avgRating}</div>
                <StarRow count={Math.round(Number(avgRating))} />
                <div className={styles.wotRatingCount}>{ENDORSERS.length} review ratings</div>
                <div className={styles.wotRatingBars}>
                  {starCounts.map(({ star, count, pct }) => (
                    <button
                      key={star}
                      className={`${styles.wotRatingBar} ${starFilter === star ? styles.wotRatingBarActive : ''}`}
                      onClick={() => handleStar(starFilter === star ? 0 : star)}
                    >
                      <span className={styles.wotRatingBarLabel}>{star}</span>
                      <Star size={9} fill="#f59e0b" stroke="none" />
                      <div className={styles.wotRatingBarTrack}>
                        <div className={styles.wotRatingBarFill} style={{ width: `${pct}%` }} />
                      </div>
                      <span className={styles.wotRatingBarCount}>{count}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Filter bar */}
            <div className={styles.wotFilterBar}>
              <div className={styles.wotSortRow}>
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    className={`${styles.wotSortBtn} ${sort === opt.value ? styles.wotSortBtnActive : ''}`}
                    onClick={() => handleSort(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <div className={styles.wotStarPills}>
                {[0, 5, 4, 3, 2, 1].map((s) => (
                  <button
                    key={s}
                    className={`${styles.wotStarPill} ${starFilter === s ? styles.wotStarPillActive : ''}`}
                    onClick={() => handleStar(s)}
                  >
                    {s === 0 ? 'All' : `${s} ★`}
                  </button>
                ))}
              </div>
            </div>

            {/* Masonry grid */}
            <div className={styles.wotMasonry}>
              {wotPaginated.map((e) => {
                const cfg = TYPE_CONFIG[e.type]
                return (
                  <div key={`${e.name}-${e.stars}`} className={styles.wotCard}>
                    <div className={styles.wotCardTop}>
                      <div
                        className={styles.wotAvatar}
                        style={{ background: cfg.avatar, color: cfg.color }}
                      >
                        {e.initials}
                      </div>
                      <div className={styles.wotCardMeta}>
                        <div className={styles.wotCardName}>{e.name}</div>
                        <div className={styles.wotCardRole}>{e.role}</div>
                        <span
                          className={styles.wotTypeBadge}
                          style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}
                        >
                          {cfg.label}
                        </span>
                      </div>
                    </div>

                    <StarRow count={e.stars} />

                    <blockquote className={styles.wotQuote}>{e.quote}</blockquote>

                    <div className={styles.wotVerified}>
                      <BadgeCheck size={12} color="#1d4ed8" strokeWidth={2} />
                      {e.verifiedAs}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className={styles.wotPagination}>
                <button
                  className={styles.wotPageBtn}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft size={15} strokeWidth={2} />
                </button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    className={`${styles.wotPageNum} ${page === i + 1 ? styles.wotPageNumActive : ''}`}
                    onClick={() => setPage(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  className={styles.wotPageBtn}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  <ChevronRight size={15} strokeWidth={2} />
                </button>
                <span className={styles.wotPageInfo}>
                  Showing {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, wotFiltered.length)} of {wotFiltered.length}
                </span>
              </div>
            )}
          </div>
        </section>

        {/* ── NEWSLETTER ── */}
        <section className={styles.newsletterSection}>
          <div className={styles.newsletterBg}>
            <Image
              src="https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=1400&q=80"
              alt="Open notebook and pen"
              fill style={{ objectFit: 'cover' }}
            />
            <div className={styles.newsletterBgOverlay} />
          </div>
          <motion.div className={styles.newsletterInner} {...newsletter}>
            <span className={styles.newsletterBadge}>
              <Rss size={11} strokeWidth={2.5} />
              Weekly Newsletter
            </span>
            <h2 className={styles.newsletterTitle}>Stay ahead of the curve</h2>
            <p className={styles.newsletterSub}>
              Get exam updates, study tips, and new articles delivered to your
              inbox every week. No spam, unsubscribe anytime.
            </p>
            <div className={styles.newsletterForm}>
              <input
                type="email"
                placeholder="your@email.com"
                className={styles.newsletterInput}
              />
              <button className={styles.newsletterBtn}>
                Subscribe <ArrowRight size={14} strokeWidth={2.5} />
              </button>
            </div>
            <p className={styles.newsletterNote}>
              Joined by 3,000+ reviewees. Free forever.
            </p>
          </motion.div>
        </section>

      </main>

      <Footer />
    </>
  )
}
