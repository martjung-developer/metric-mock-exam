// components/dashboard/student/help/HelpHero.tsx
// Pure UI — renders the top search hero banner.

import React from 'react'
import Image from 'next/image'
import { Search, X, HelpCircle } from 'lucide-react'
import styles from '@/app/(dashboard)/student/help/help.module.css'

interface HelpHeroProps {
  search:            string
  onSearchChange:    (value: string) => void
  onSearchClear:     () => void
  onProgramPillClick: (program: string) => void
}

const PROGRAM_PILLS = [
  'BLIS', 'BSPsych', 'BSArch', 'BSID', 'BEEd',
  'BSEd-ENG', 'BSEd-FIL', 'BSEd-SCI', 'BSEd-MATH',
]

export default function HelpHero({
  search,
  onSearchChange,
  onSearchClear,
  onProgramPillClick,
}: HelpHeroProps) {
  return (
    <div className={styles.hero}>
      <Image
        src="/images/lccb_student_help.jpg"
        alt=""
        fill
        sizes="100vw"
        className={styles.heroImage}
        aria-hidden="true"
        priority
      />
      <div className={styles.heroOverlay} aria-hidden="true" />
      <div className={styles.heroInner}>
        <div className={styles.heroBadge}>
          <HelpCircle size={14} strokeWidth={2.5} />
          Help Center
        </div>

        <h1 className={styles.heroTitle}>How can we help you?</h1>
        <p className={styles.heroSub}>
          Find answers about mock board exams, reviewers, scores, and your degree program.
        </p>

        {/* Search */}
        <div className={styles.searchWrap}>
          <Search size={16} strokeWidth={2.2} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            type="text"
            placeholder='Search — e.g. "timer", "BLIS exam", "retake"…'
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onSearchChange(e.target.value)
            }
          />
          {search && (
            <button
              className={styles.searchClear}
              onClick={onSearchClear}
              aria-label="Clear search"
            >
              <X size={14} strokeWidth={2.5} />
            </button>
          )}
        </div>

        {/* Program quick-filter pills */}
        <div className={styles.programPills}>
          {PROGRAM_PILLS.map((p) => (
            <button
              key={p}
              className={styles.programPill}
              onClick={() => onProgramPillClick(p)}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
