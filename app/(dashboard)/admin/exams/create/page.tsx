// app/(dashboard)/admin/exams/create/page.tsx
//
// FIXED: passes programs from useExamCategories to CreateExamForm.
// The form now binds to form.program_id (UUID) not form.program (text).
// ─────────────────────────────────────────────────────────────────────────────

'use client'

import Link              from 'next/link'
import { BookOpen, ArrowLeft } from 'lucide-react'
import { useCreateExam }      from '@/lib/hooks/admin/exams/create/useCreateExam'
import { useExamCategories }  from '@/lib/hooks/admin/exams/create/useExamCategories'
import CreateExamForm         from '@/components/dashboard/admin/exams/create/CreateExamForm'
import s from './create.module.css'

export default function CreateExamPage() {
  const {
    form, errors, submitting, success, submitError, setField, submit,
  } = useCreateExam()

  const { categories, programs, catLoading } = useExamCategories()

  return (
    <div className={s.page}>
      <div className={s.header}>
        <div className={s.headerLeft}>
          <Link href="/admin/exams" className={s.backBtn}>
            <ArrowLeft size={15} /> Back to Exams
          </Link>
          <div className={s.headerIcon}>
            <BookOpen size={20} color="#fff" />
          </div>
          <div>
            <h1 className={s.heading}>Create Exam</h1>
            <p className={s.headingSub}>Fill in the details to create a new exam</p>
          </div>
        </div>
      </div>

      <CreateExamForm
        form={form}
        errors={errors}
        categories={categories}
        programs={programs}        
        catLoading={catLoading}
        submitting={submitting}
        success={success}
        submitError={submitError}
        setField={setField}
        onSubmit={submit}
      />
    </div>
  )
}
