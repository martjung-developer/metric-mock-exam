// components/dashboard/student/dashboard/DashboardHeader.tsx
'use client'

import Link           from 'next/link'
import { motion }     from 'framer-motion'
import { ClipboardList, RefreshCw } from 'lucide-react'
import { section, cardHover } from '@/animations/dashboard/dashboardAnimations'
import styles         from '@/app/(dashboard)/student/dashboard/dashboard.module.css'

interface DashboardHeaderProps {
  firstName: string
  greeting:  string
  refreshing: boolean
  onRefresh: () => void
}

export function DashboardHeader({ firstName, greeting, refreshing, onRefresh }: DashboardHeaderProps) {
  return (
    <motion.div
      {...section}
      style={{
        display:        'flex',
        alignItems:     'flex-start',
        justifyContent: 'space-between',
        marginBottom:   '1.75rem',
      }}
    >
      <div className={styles.header}>
        <h1 className={styles.greeting}>
          {greeting}, {firstName}
        </h1>
        <p className={styles.subGreeting}>
          Here&apos;s your board exam prep summary for today.
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <button
          type="button"
          className={styles.ctaBtn}
          onClick={onRefresh}
          disabled={refreshing}
          aria-label="Refresh dashboard data"
        >
          <RefreshCw size={15} strokeWidth={2.5} className={refreshing ? styles.spinning : ''} />
          Refresh
        </button>
        <motion.div {...cardHover}>
          <Link href="/student/mock-exams" className={styles.ctaBtn}>
            <ClipboardList size={15} strokeWidth={2.5} />
            Start an Exam
          </Link>
        </motion.div>
      </div>
    </motion.div>
  )
}
