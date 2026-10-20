// components/dashboard/student/results/ResultsStats.tsx
import { FileText, TrendingUp, Trophy, CheckCircle2, Clock } from 'lucide-react'
import type { SummaryStats } from '@/lib/types/student/results/results.types'
import styles from '@/app/(dashboard)/student/results/results.module.css'
import { formatDuration } from '@/lib/utils/formatDuration'

interface Props {
  stats:    SummaryStats
  passRate: number | null
}

export function ResultsStats({ stats, passRate }: Props) {
  const STAT_CARDS = [
    {
      Icon: FileText,     iconColor: '#2563eb', iconBg: '#eff6ff',
      label: 'Released Results', sub: 'score visible to you',
      value: String(stats.totalExams), empty: stats.totalExams === 0,
    },
    {
      Icon: TrendingUp,   iconColor: '#059669', iconBg: '#f0fdf4',
      label: 'Average Score',    sub: 'across released exams',
      value: stats.averageScore !== null ? `${stats.averageScore}%` : '—',
      empty: stats.averageScore === null,
    },
    {
      Icon: Trophy,       iconColor: '#d97706', iconBg: '#fffbeb',
      label: 'Highest Score',    sub: 'personal best',
      value: stats.highestScore !== null ? `${stats.highestScore}%` : '—',
      empty: stats.highestScore === null,
    },
    {
      Icon: CheckCircle2, iconColor: '#dc2626', iconBg: '#fef2f2',
      label: 'Pass Rate',        sub: passRate !== null ? `${passRate}% pass rate` : 'No released results',
      value: stats.totalExams > 0 ? `${stats.passed}/${stats.totalExams} passed` : '—',
      empty: stats.totalExams === 0,
    },
    {
      Icon: Clock,        iconColor: '#7c3aed', iconBg: '#f5f3ff',
      label: 'Total Time',       sub: (stats.validTimeCount ?? 0) > 0 ? 'combined valid time' : 'no valid time data',
      value: stats.totalTimeSeconds !== undefined && stats.totalTimeSeconds !== null
        ? formatDuration(stats.totalTimeSeconds)
        : '—',
      empty: stats.totalTimeSeconds === null || stats.totalTimeSeconds === undefined,
    },
  ] as const

  return (
    <div className={styles.statsGrid}>
      {STAT_CARDS.map((card) => (
        <div key={card.label} className={styles.statCard}>
          <div className={styles.statTop}>
            <div className={styles.statIcon} style={{ background: card.iconBg }}>
              <card.Icon size={18} color={card.iconColor} strokeWidth={2} />
            </div>
          </div>
          <div className={`${styles.statValue} ${card.empty ? styles.statValueEmpty : ''}`}>
            {card.value}
          </div>
          <div className={styles.statLabel}>{card.label}</div>
          <div className={styles.statSub}>{card.sub}</div>
        </div>
      ))}
    </div>
  )
}
