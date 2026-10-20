// components/dashboard/admin/exams/create/ExamPublishCard.tsx
// Pure UI — renders the Publish Settings sidebar card.
// No data fetching, no business logic.

import React from 'react'
import { CheckCircle, AlertCircle } from 'lucide-react'
import type { ExamFormData } from '@/lib/types/admin/exams/create/exam.types'
import s from '@/app/(dashboard)/admin/exams/create/create.module.css'

interface ExamPublishCardProps {
  isPublished: ExamFormData['is_published']
  setField:    <K extends keyof ExamFormData>(field: K, value: ExamFormData[K]) => void
}

export default function ExamPublishCard({ isPublished, setField }: ExamPublishCardProps) {
  return (
    <div className={s.card}>
      <div className={s.cardHeader}>
        <div className={s.cardHeaderIcon}>
          <CheckCircle size={15} color="var(--primary)" />
        </div>
        <div>
          <h2 className={s.cardTitle}>Publish Settings</h2>
          <p className={s.cardSub}>Control exam visibility</p>
        </div>
      </div>

      <div className={s.cardBody}>
        <label className={s.toggleRow}>
          <div>
            <div className={s.toggleLabel}>Published</div>
            <div className={s.toggleSub}>Students can see and take this exam</div>
          </div>
          <div
            className={`${s.toggle} ${isPublished ? s.toggleOn : ''}`}
            onClick={() => setField('is_published', !isPublished)}
          >
            <div className={s.toggleThumb} />
          </div>
        </label>

        <div className={`${s.statusNote} ${isPublished ? s.statusNotePublished : s.statusNoteDraft}`}>
          {isPublished ? (
            <><CheckCircle size={13} /> This exam will be visible to assigned students once published.</>
          ) : (
            <><AlertCircle size={13} /> This exam is saved as a draft and is not visible to students.</>
          )}
        </div>
      </div>
    </div>
  )
}