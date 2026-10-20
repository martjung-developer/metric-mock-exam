// components/dashboard/admin/exams/detail/ExamHeader.tsx

import React from 'react'
import Link from 'next/link'
import { BookOpen, ArrowLeft, Pencil, CheckCircle, XCircle } from 'lucide-react'
import type { ExamDetail } from '@/lib/types/admin/exams/detail/exam.types'
import s from '@/app/(dashboard)/admin/exams/[examId]/detail.module.css'

interface ExamHeaderProps {
  exam:     ExamDetail
  onEdit:   () => void
}

export default function ExamHeader({ exam, onEdit }: ExamHeaderProps) {
  return (
    <div className={s.header}>
      <Link href="/admin/exams" className={s.backBtn}>
        <ArrowLeft size={14} /> Back to Exams
      </Link>

      <div className={s.headerMain}>
        <div className={s.headerLeft}>
          <div className={s.headerIcon}>
            <BookOpen size={20} color="#fff" />
          </div>
          <div>
            <div className={s.headerMeta}>
              <span className={s.categoryBadge}>{exam.category?.name ?? '—'}</span>
              {exam.is_published ? (
                <span className={s.badgePublished}>
                  <CheckCircle size={11} /> Published
                </span>
              ) : (
                <span className={s.badgeDraft}>
                  <XCircle size={11} /> Draft
                </span>
              )}
            </div>
            <h1 className={s.heading}>{exam.title}</h1>
          </div>
        </div>

        <div className={s.headerActions}>
          <button className={s.btnSecondary} onClick={onEdit}>
            <Pencil size={13} /> Edit Exam
          </button>
        </div>
      </div>
    </div>
  )
}