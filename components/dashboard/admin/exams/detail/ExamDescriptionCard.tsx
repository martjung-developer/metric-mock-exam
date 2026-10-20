// components/dashboard/admin/exams/detail/ExamDescriptionCard.tsx

import React from 'react'
import { AlignLeft } from 'lucide-react'
import type { ExamDetail } from '@/lib/types/admin/exams/detail/exam.types'
import s from '@/app/(dashboard)/admin/exams/[examId]/detail.module.css'

interface ExamDescriptionCardProps {
  description: ExamDetail['description']
}

export default function ExamDescriptionCard({ description }: ExamDescriptionCardProps) {
  return (
    <div className={s.card}>
      <div className={s.cardHeader}>
        <AlignLeft size={15} color="var(--primary)" />
        <h2 className={s.cardTitle}>Description</h2>
      </div>
      <div className={s.cardBody}>
        <p className={s.description}>{description ?? 'No description provided.'}</p>
      </div>
    </div>
  )
}