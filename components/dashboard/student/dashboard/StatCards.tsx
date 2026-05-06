// components/dashboard/student/dashboard/StatCards.tsx
'use client'

import { motion }    from 'framer-motion'
import { ClipboardList, Trophy, BookOpen, Flame } from 'lucide-react'
import { statsGrid, statCard, cardHover } from '@/animations/dashboard/dashboardAnimations'
import styles        from '@/app/(dashboard)/student/dashboard/dashboard.module.css'
import type { DashboardStats } from '@/lib/types/student/dashboard/dashboard.types'

interface StatCardsProps {
  stats:   DashboardStats
  loading: boolean
}

function SkeletonBlock({ width = 60, height = 20 }: { width?: number; height?: number }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: 6,
        background:   'linear-gradient(90deg, #e4ecf3 25%, #f0f5fa 50%, #e4ecf3 75%)',
        backgroundSize: '200% 100%',
        animation:    'shimmer 1.4s infinite',
      }}
    />
  )
}

export function StatCards({ stats, loading }: StatCardsProps) {
  const cards = [
    {
      icon:   ClipboardList,
      label:  'Exams Taken',
      value:  String(stats.examsTaken),
      color:  '#2563a8',
      bg:     '#dbeafe',
      accent: '#3b82f6',
    },
    {
      icon:   Trophy,
      label:  'Best Score',
      value:  stats.bestScore !== null ? `${stats.bestScore}%` : '—',
      color:  '#92600a',
      bg:     '#fef3c7',
      accent: '#f59e0b',
    },
    {
      icon:   BookOpen,
      label:  'Reviewers Done',
      value:  String(stats.reviewersDone),
      color:  '#15693a',
      bg:     '#d1fae5',
      accent: '#10b981',
    },
    {
      icon:   Flame,
      label:  'Day Streak',
      // Minimum display of 1 to avoid showing 0 on first active day
      value:  String(stats.streak > 0 ? stats.streak : 1),
      color:  '#b91c1c',
      bg:     '#fee2e2',
      accent: '#ef4444',
    },
  ]

  return (
    <>
      {/* Shimmer keyframe — injected once */}
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0 }
          100% { background-position: -200% 0 }
        }
      `}</style>

      <motion.div className={styles.statsGrid} {...statsGrid}>
        {cards.map(({ icon: Icon, label, value, color, bg, accent }) => (
          <motion.div
            key={label}
            className={styles.statCard}
            style={{ ['--card-accent' as string]: accent }}
            {...statCard}
            {...cardHover}
          >
            <div className={styles.statIconWrap} style={{ backgroundColor: bg }}>
              <Icon size={20} color={color} strokeWidth={2} />
            </div>
            <div>
              {loading ? (
                <>
                  <SkeletonBlock width={50} height={22} />
                  <SkeletonBlock width={80} height={12} />
                </>
              ) : (
                <>
                  <div className={styles.statValue}>{value}</div>
                  <div className={styles.statLabel}>{label}</div>
                </>
              )}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </>
  )
}