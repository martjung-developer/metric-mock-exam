// components/dashboard/admin/exams/detail/ExamStats.tsx

import React, { useMemo } from 'react'
import { Clock, HelpCircle, Target, Users, FileText, Award } from 'lucide-react'
import type { ExamDetail } from '@/lib/types/admin/exams/detail/exam.types'
import s from '@/app/(dashboard)/admin/exams/[examId]/detail.module.css'

interface StatDef {
  icon:   React.ElementType
  label:  string
  value:  string | number
  color:  'blue' | 'violet' | 'amber' | 'green'
}

interface ExamStatsProps {
  exam: ExamDetail
}

export default function ExamStats({ exam }: ExamStatsProps) {
  const stats: StatDef[] = useMemo(
    () => [
      { icon: Clock,      label: 'Duration',     value: `${exam.duration_minutes} min`,                                 color: 'blue'   },
      { icon: HelpCircle, label: 'Questions',     value: exam.question_count,                                            color: 'violet' },
      { icon: Target,     label: 'Passing Score', value: `${exam.passing_score}%`,                                       color: 'amber'  },
      { icon: Users,      label: 'Assigned',      value: exam.assigned_count,                                            color: 'green'  },
      { icon: FileText,   label: 'Submissions',   value: exam.submission_count,                                          color: 'blue'   },
      { icon: Award,      label: 'Avg Score',     value: exam.avg_score !== null ? `${exam.avg_score.toFixed(1)}%` : '—', color: 'violet' },
    ],
    [exam],
  )

  return (
    <div className={s.statsGrid}>
      {stats.map((stat) => (
        <div key={stat.label} className={`${s.statCard} ${s[`stat_${stat.color}`]}`}>
          <div className={s.statIcon}>
            <stat.icon size={16} />
          </div>
          <div>
            <div className={s.statValue}>{stat.value}</div>
            <div className={s.statLabel}>{stat.label}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
