// components/dashboard/student/dashboard/QuickActions.tsx
'use client'

import Link      from 'next/link'
import { motion } from 'framer-motion'
import {
  ClipboardList, BookOpen, FileText,
  TrendingUp, Trophy, BarChart2,
} from 'lucide-react'
import { card, quickGrid, quickItem, cardHover } from '@/animations/dashboard/dashboardAnimations'
import styles from '@/app/(dashboard)/student/dashboard/dashboard.module.css'

const QUICK_ACTIONS = [
  {
    href:  '/student/mock-exams',
    icon:  ClipboardList,
    label: 'Take a Mock Exam',
    desc:  'Timed simulation',
    color: '#1d4ed8',
    bg:    '#eff6ff',
  },
  {
    href:  '/student/practice-exams',
    icon:  BookOpen,
    label: 'Start a Reviewer',
    desc:  'Practice questions',
    color: '#047857',
    bg:    '#ecfdf5',
  },
  {
    href:  '/student/study-materials',
    icon:  FileText,
    label: 'Study Materials',
    desc:  'Read & learn',
    color: '#6d28d9',
    bg:    '#f5f3ff',
  },
  {
    href:  '/student/progress',
    icon:  TrendingUp,
    label: 'View Progress',
    desc:  'Track your growth',
    color: '#b45309',
    bg:    '#fffbeb',
  },
  {
    href:  '/student/results',
    icon:  Trophy,
    label: 'Past Results',
    desc:  'See your scores',
    color: '#be123c',
    bg:    '#fff1f2',
  },
  {
    href:  '/student/profile',
    icon:  BarChart2,
    label: 'My Profile',
    desc:  'Update your info',
    color: '#0e7490',
    bg:    '#ecfeff',
  },
] as const

export function QuickActions() {
  return (
    <motion.div className={styles.card} {...card}>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>Quick Actions</h2>
      </div>
      <motion.div className={styles.quickGrid} {...quickGrid}>
        {QUICK_ACTIONS.map(({ href, icon: Icon, label, desc, color, bg }) => (
          <motion.div key={href} {...quickItem} {...cardHover}>
            <Link href={href} className={styles.quickItem}>
              <div className={styles.quickIconWrap} style={{ backgroundColor: bg }}>
                <Icon size={17} color={color} strokeWidth={2} />
              </div>
              <div>
                <div className={styles.quickLabel}>{label}</div>
                <div className={styles.quickDesc}>{desc}</div>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  )
}