// components/dashboard/admin/exams/create/ExamSettingsSection.tsx
// Pure UI — renders the Exam Settings card (duration, total points, passing score).
// No data fetching, no business logic.

import React from 'react'
import { Target, Clock, Hash, AlertCircle } from 'lucide-react'
import type { ExamFormData, ExamFormErrors } from '@/lib/types/admin/exams/create/exam.types'
import s from '@/app/(dashboard)/admin/exams/create/create.module.css'

interface ExamSettingsSectionProps {
  form:     ExamFormData
  errors:   ExamFormErrors
  setField: <K extends keyof ExamFormData>(field: K, value: ExamFormData[K]) => void
}

export default function ExamSettingsSection({
  form,
  errors,
  setField,
}: ExamSettingsSectionProps) {
  return (
    <div className={s.card}>
      <div className={s.cardHeader}>
        <div className={s.cardHeaderIcon}>
          <Target size={15} color="var(--primary)" />
        </div>
        <div>
          <h2 className={s.cardTitle}>Exam Settings</h2>
          <p className={s.cardSub}>Duration, scoring, and passing threshold</p>
        </div>
      </div>

      <div className={s.cardBody}>
        <div className={s.gridTwo}>

          {/* Duration */}
          <div className={s.fieldGroup}>
            <label className={s.label} htmlFor="duration">
              <Clock size={12} /> Duration (minutes) <span className={s.required}>*</span>
            </label>
            <div className={s.inputWithUnit}>
              <input
                id="duration"
                type="number"
                min={1}
                className={`${s.input} ${errors.duration_minutes ? s.inputError : ''}`}
                placeholder="60"
                value={form.duration_minutes}
                onChange={(e) => setField('duration_minutes', e.target.value)}
              />
              <span className={s.unit}>min</span>
            </div>
            {errors.duration_minutes && (
              <p className={s.fieldError}>
                <AlertCircle size={11} /> {errors.duration_minutes}
              </p>
            )}
          </div>

          {/* Total Points */}
          <div className={s.fieldGroup}>
            <label className={s.label} htmlFor="totalPoints">
              <Hash size={12} /> Total Points <span className={s.required}>*</span>
            </label>
            <input
              id="totalPoints"
              type="number"
              min={1}
              className={`${s.input} ${errors.total_points ? s.inputError : ''}`}
              placeholder="100"
              value={form.total_points}
              onChange={(e) => setField('total_points', e.target.value)}
            />
            {errors.total_points && (
              <p className={s.fieldError}>
                <AlertCircle size={11} /> {errors.total_points}
              </p>
            )}
          </div>

        </div>

        {/* Passing Score */}
        <div className={s.fieldGroup}>
          <label className={s.label} htmlFor="passingScore">
            <Target size={12} /> Passing Score (%) <span className={s.required}>*</span>
          </label>
          <div className={s.passingScoreWrap}>
            <input
              id="passingScore"
              type="range"
              min={0}
              max={100}
              step={5}
              className={s.rangeInput}
              value={form.passing_score}
              onChange={(e) => setField('passing_score', e.target.value)}
            />
            <div className={s.rangeValue}>{form.passing_score}%</div>
          </div>
          {errors.passing_score && (
            <p className={s.fieldError}>
              <AlertCircle size={11} /> {errors.passing_score}
            </p>
          )}
        </div>

      </div>
    </div>
  )
}