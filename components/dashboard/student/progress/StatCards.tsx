// components/dashboard/student/progress/StatCards.tsx
'use client'

import { memo } from 'react'
import {
  FileText, TrendingUp, Trophy, Flame, Clock, CheckCircle2,
} from 'lucide-react'
import type { ProgressMetrics } from '@/lib/types/student/progress/progress.types'
import styles from '@/app/(dashboard)/student/progress/progress.module.css'

// ── Animation helpers ─────────────────────────────────────────────────────────

const STAGGER = 0.055

function staggeredFadeUp(index: number): React.CSSProperties {
  return { animationDelay: `${index * STAGGER}s`, animationFillMode: 'both' }
}

// ── Card config builder ───────────────────────────────────────────────────────

interface StatCardConfig {
  Icon:          React.ComponentType<{ size: number; color: string; strokeWidth: number }>
  iconColor:     string
  iconBg:        string
  label:         string
  value:         string
  trend:         string
  trendPositive: boolean | null
  sub:           string
}

function buildStatCards(metrics: ProgressMetrics): StatCardConfig[] {
  return [
    {
      Icon: FileText, iconColor: '#3b82f6', iconBg: '#eff6ff',
      label: 'Exams Taken',
      value: String(metrics.examsTaken),
      trend: metrics.examsTaken > 0 ? `${metrics.examsTaken} total` : '—',
      trendPositive: metrics.examsTaken > 0 ? true : null,
      sub: 'submitted or graded',
    },
    {
      Icon: TrendingUp, iconColor: '#10b981', iconBg: '#f0fdf4',
      label: 'Average Score',
      value: metrics.averageScore > 0 ? `${metrics.averageScore}%` : '—',
      trend: metrics.averageScore >= 75
        ? 'Good'
        : metrics.averageScore > 0
          ? 'Needs work'
          : 'No releases yet',
      trendPositive: metrics.averageScore >= 75
        ? true
        : metrics.averageScore > 0 ? false : null,
      sub: 'released exams only',
    },
    {
      Icon: Trophy, iconColor: '#f59e0b', iconBg: '#fffbeb',
      label: 'Highest Score',
      value: metrics.highestScore > 0 ? `${metrics.highestScore}%` : '—',
      trend: '—',
      trendPositive: null,
      sub: metrics.highestScoreTitle,
    },
    {
      Icon: Flame, iconColor: '#ef4444', iconBg: '#fef2f2',
      label: 'Study Streak',
      value: `${metrics.studyStreakDays}d`,
      trend: metrics.studyStreakDays >= 7 ? '🔥 On fire' : 'Keep going',
      trendPositive: metrics.studyStreakDays >= 3 ? true : null,
      sub: 'consecutive days',
    },
    {
      Icon: Clock, iconColor: '#8b5cf6', iconBg: '#f5f3ff',
      label: 'Study Time',
      value: `${metrics.totalStudyHours}h`,
      trend: metrics.totalStudyHours > 0 ? `+${metrics.totalStudyHours}h` : '—',
      trendPositive: metrics.totalStudyHours > 0 ? true : null,
      sub: 'total across exams',
    },
    {
      Icon: CheckCircle2, iconColor: '#10b981', iconBg: '#f0fdf4',
      label: 'Pass Rate',
      value: metrics.passRate > 0 ? `${metrics.passRate}%` : '—',
      trend: metrics.passRate >= 70
        ? 'Great'
        : metrics.passRate >= 50
          ? 'Fair'
          : metrics.passRate > 0 ? 'Low' : 'Pending',
      trendPositive: metrics.passRate >= 70
        ? true
        : metrics.passRate >= 50 ? null : metrics.passRate > 0 ? false : null,
      sub: `${metrics.totalPassed} of ${metrics.examsTaken} passed`,
    },
  ]
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  metrics: ProgressMetrics
}

export const StatCards = memo(function StatCards({ metrics }: Props) {
  const cards = buildStatCards(metrics)

  return (
    <div className={styles.statsGrid}>
      {cards.map((card, idx) => (
        <div key={card.label} className={styles.statCard} style={staggeredFadeUp(idx)}>
          <div className={styles.statTop}>
            <div className={styles.statIcon} style={{ background: card.iconBg }}>
              <card.Icon size={18} color={card.iconColor} strokeWidth={2} />
            </div>
            {card.trendPositive === null ? (
              <span className={styles.trendNeutral}>{card.trend}</span>
            ) : card.trendPositive ? (
              <span className={styles.trendUp}>{card.trend}</span>
            ) : (
              <span className={styles.trendDown}>{card.trend}</span>
            )}
          </div>
          <div className={styles.statValue}>{card.value}</div>
          <div className={styles.statLabel}>{card.label}</div>
          <div className={styles.statSub}>{card.sub}</div>
        </div>
      ))}
    </div>
  )
})