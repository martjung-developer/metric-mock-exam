// components/dashboard/admin/exams/create/CreateExamForm.tsx
// Composes the form layout from section components.
// Owns the <form> element and passes state/handlers down as props.
// No data fetching, no business logic.
//
// FIXED: accepts `programs` prop and passes it to ExamBasicInfoSection

import React from 'react'
import { CheckCircle, AlertCircle } from 'lucide-react'
import ExamBasicInfoSection from './ExamBasicInfoSection'
import ExamSettingsSection  from './ExamSettingsSection'
import ExamPublishCard      from './ExamPublishCard'
import ExamSummaryCard      from './ExamSummaryCard'
import type { ExamFormData, ExamFormErrors, CategoryOption } from '@/lib/types/admin/exams/create/exam.types'
import s from '@/app/(dashboard)/admin/exams/create/create.module.css'

interface ProgramOption {
  id:   string
  code: string
  name: string
}

interface CreateExamFormProps {
  form:        ExamFormData
  errors:      ExamFormErrors
  categories:  CategoryOption[]
  programs:    ProgramOption[]   // ← NEW
  catLoading:  boolean
  submitting:  boolean
  success:     boolean
  submitError: string | null
  setField:    <K extends keyof ExamFormData>(field: K, value: ExamFormData[K]) => void
  addCategory: (name: string, programId: string) => Promise<CategoryOption>
  onSubmit:    (e: React.FormEvent) => Promise<void>
}

export default function CreateExamForm({
  form,
  errors,
  categories,
  programs,
  catLoading,
  submitting,
  success,
  submitError,
  setField,
  addCategory,
  onSubmit,
}: CreateExamFormProps) {
  return (
    <>
      {/* ── Status Banners ── */}
      {success && (
        <div className={s.successBanner}>
          <CheckCircle size={15} /> Exam created successfully! Redirecting…
        </div>
      )}
      {submitError && (
        <div
          className={s.successBanner}
          style={{
            background:  'var(--danger-pale)',
            borderColor: '#fca5a5',
            color:       'var(--danger)',
          }}
        >
          <AlertCircle size={15} /> {submitError}
        </div>
      )}

      {/* ── Form ── */}
      <form onSubmit={onSubmit} noValidate>
        <div className={s.layout}>

          {/* Main Column */}
          <div className={s.mainCol}>
            <ExamBasicInfoSection
              form={form}
              errors={errors}
              categories={categories}
              programs={programs}    
              catLoading={catLoading}
              setField={setField}
              addCategory={addCategory}
            />
            <ExamSettingsSection
              form={form}
              errors={errors}
              setField={setField}
            />
          </div>

          {/* Side Column */}
          <div className={s.sideCol}>
            <ExamPublishCard
              isPublished={form.is_published}
              setField={setField}
            />
            <ExamSummaryCard
              form={form}
              categories={categories}
              submitting={submitting}
              success={success}
            />
          </div>

        </div>
      </form>
    </>
  )
}
