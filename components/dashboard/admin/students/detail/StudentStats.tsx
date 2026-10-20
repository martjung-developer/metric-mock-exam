// components/dashboard/admin/students/detail/StudentStats.tsx
import {
  FileText, CheckCircle2, ClipboardList, BookOpen, Clock,
} from 'lucide-react'
import type { StudentStats }  from '@/lib/hooks/admin/students/[examId]/useStudentStats'
import styles from '@/app/(dashboard)/admin/students/[id]/student-detail.module.css'

interface Props {
  stats:             StudentStats
  assignedExamCount: number
  submissionCount:   number
  notificationCount: number
}

export function StudentStats({
  stats,
  assignedExamCount,
  submissionCount,
  notificationCount,
}: Props) {
  const STAT_CARDS = [
    {
      iconBg: '#eff6ff', iconColor: '#2563eb',
      Icon: FileText,     label: 'Exams Assigned',
      value: assignedExamCount,
    },
    {
      iconBg: '#f0fdf4', iconColor: '#059669',
      Icon: CheckCircle2, label: 'Submissions',
      value: submissionCount,
    },
    {
      iconBg: '#fffbeb', iconColor: '#d97706',
      Icon: ClipboardList, label: 'Avg Score',
      value: stats.avgScore !== null ? `${stats.avgScore}%` : '—',
    },
    {
      iconBg: '#f0fdf4', iconColor: '#059669',
      Icon: BookOpen,     label: 'Passed',
      value: stats.passedCount,
    },
    {
      iconBg: '#f5f3ff', iconColor: '#7c3aed',
      Icon: Clock,        label: 'Notifications',
      value: notificationCount,
    },
  ] as const

  return (
    <div className={styles.statsGrid}>
      {STAT_CARDS.map((stat) => (
        <div key={stat.label} className={styles.statCard}>
          <div className={styles.statIconWrap} style={{ background: stat.iconBg }}>
            <stat.Icon size={18} color={stat.iconColor} strokeWidth={2} />
          </div>
          <div>
            <div className={styles.statValue}>{stat.value}</div>
            <div className={styles.statLabel}>{stat.label}</div>
          </div>
        </div>
      ))}
    </div>
  )
}