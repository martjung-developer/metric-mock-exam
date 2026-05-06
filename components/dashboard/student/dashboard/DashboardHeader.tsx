// components/dashboard/student/dashboard/DashboardHeader.tsx
'use client'

import Link           from 'next/link'
import { motion }     from 'framer-motion'
import { ClipboardList } from 'lucide-react'
import { section, cardHover } from '@/animations/dashboard/dashboardAnimations'
import styles         from '@/app/(dashboard)/student/dashboard/dashboard.module.css'

interface DashboardHeaderProps {
  firstName: string
  greeting:  string
}

export function DashboardHeader({ firstName, greeting }: DashboardHeaderProps) {
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

      <motion.div {...cardHover}>
        <Link href="/student/mock-exams" className={styles.ctaBtn}>
          <ClipboardList size={15} strokeWidth={2.5} />
          Start an Exam
        </Link>
      </motion.div>
    </motion.div>
  )
}