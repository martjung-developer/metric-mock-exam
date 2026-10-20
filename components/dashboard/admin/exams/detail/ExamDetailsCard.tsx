// components/dashboard/admin/exams/detail/ExamDetailsCard.tsx

import React, { useMemo } from 'react'
import { Tag } from 'lucide-react'
import { EXAM_TYPE_META } from '@/lib/types/database'
import type { ExamDetail } from '@/lib/types/admin/exams/detail/exam.types'
import { formatDate } from '@/lib/utils/admin/exams/detail/mappers'
import s from '@/app/(dashboard)/admin/exams/[examId]/detail.module.css'

interface DetailRowDef {
  label: string
  value: string | number
}

interface ExamDetailsCardProps {
  exam: ExamDetail
}

export default function ExamDetailsCard({ exam }: ExamDetailsCardProps) {
  const rows: DetailRowDef[] = useMemo(
    () => [
      { label: 'Category',      value: exam.category?.name ?? '—' },
      { label: 'Program',       value: exam.program ? `${exam.program.code} — ${exam.program.name}` : '—' },
      { label: 'Exam Type',     value: EXAM_TYPE_META[exam.exam_type].label },
      { label: 'Duration',      value: `${exam.duration_minutes} minutes` },
      { label: 'Total Points',  value: exam.total_points },
      { label: 'Passing Score', value: `${exam.passing_score}%` },
      { label: 'Created',       value: formatDate(exam.created_at) },
      { label: 'Last Updated',  value: formatDate(exam.updated_at) },
    ],
    [exam],
  )

  return (
    <div className={s.card}>
      <div className={s.cardHeader}>
        <Tag size={15} color="var(--primary)" />
        <h2 className={s.cardTitle}>Exam Details</h2>
      </div>
      <div className={s.cardBody}>
        <div className={s.detailGrid}>
          {rows.map((row) => (
            <div key={row.label} className={s.detailRow}>
              <span className={s.detailKey}>{row.label}</span>
              <span className={s.detailVal}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}