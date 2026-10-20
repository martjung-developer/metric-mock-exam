// components/dashboard/admin/exams/create/ExamSummaryCard.tsx
// Pure UI — renders the Summary + form actions sidebar card.
// No data fetching, no business logic.

import React from 'react'
import Link from 'next/link'
import { FileText, Save, Loader2 } from 'lucide-react'
import { EXAM_TYPE_META } from '@/lib/types/database'
import type { ExamFormData, CategoryOption } from '@/lib/types/admin/exams/create/exam.types'
import s from '@/app/(dashboard)/admin/exams/create/create.module.css'

interface ExamSummaryCardProps {
  form:       ExamFormData
  categories: CategoryOption[]
  submitting: boolean
  success:    boolean
}

export default function ExamSummaryCard({
  form,
  categories,
  submitting,
  success,
}: ExamSummaryCardProps) {
  const selectedCategory = categories.find((c) => c.id === form.category_id)

  return (
    <div className={s.card}>
      <div className={s.cardHeader}>
        <div className={s.cardHeaderIcon}>
          <FileText size={15} color="var(--primary)" />
        </div>
        <div>
          <h2 className={s.cardTitle}>Summary</h2>
        </div>
      </div>

      <div className={s.cardBody}>
        <div className={s.summaryList}>
          <div className={s.summaryRow}>
            <span className={s.summaryKey}>Exam Type</span>
            <span className={s.summaryVal}>
              {EXAM_TYPE_META[form.exam_type].label}
            </span>
          </div>
          <div className={s.summaryRow}>
            <span className={s.summaryKey}>Category</span>
            <span className={s.summaryVal}>
              {selectedCategory?.name ?? '—'}
            </span>
          </div>
          <div className={s.summaryRow}>
            <span className={s.summaryKey}>Duration</span>
            <span className={s.summaryVal}>
              {form.duration_minutes ? `${form.duration_minutes} min` : '—'}
            </span>
          </div>
          <div className={s.summaryRow}>
            <span className={s.summaryKey}>Total Points</span>
            <span className={s.summaryVal}>{form.total_points || '—'}</span>
          </div>
          <div className={s.summaryRow}>
            <span className={s.summaryKey}>Passing Score</span>
            <span className={s.summaryVal}>{form.passing_score}%</span>
          </div>
        </div>

        <div className={s.formActions}>
          <Link href="/admin/exams" className={s.btnSecondary}>
            Cancel
          </Link>
          <button
            type="submit"
            className={s.btnPrimary}
            disabled={submitting || success}
          >
            {submitting ? (
              <><Loader2 size={13} className={s.spinner} /> Saving…</>
            ) : (
              <><Save size={13} /> Create Exam</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}