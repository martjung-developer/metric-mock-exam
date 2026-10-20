// app/(dashboard)/admin/students/create/page.tsx
//
// Clean orchestration layer — zero business logic, zero Supabase calls.
// Wires three hooks into two render branches (success / form).

'use client'

import Link from 'next/link'
import { ArrowLeft, UserPlus } from 'lucide-react'
import { useAuthGuard }      from '@/lib/hooks/admin/students/useAuthGuard'
import { usePrograms }       from '@/lib/hooks/admin/students/usePrograms'
import { useCreateStudent }  from '@/lib/hooks/admin/students/create/useCreateStudent'
import {
  CreateStudentForm,
  SuccessState,
} from '@/components/dashboard/admin/students/create'
import styles from './create.module.css'

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CreateStudentPage() {
  // Auth redirect (no-op if already authenticated)
  useAuthGuard()

  // Programs for the select dropdown
  const { programs } = usePrograms()

  // Form state, validation, submit, redirect
  const {
    form,
    errors,
    saving,
    success,
    handleChange,
    handleSubmit,
  } = useCreateStudent()

  // ── Success branch ──────────────────────────────────────────────────────────
  if (success) {
    return <SuccessState fullName={form.full_name} />
  }

  // ── Form branch ─────────────────────────────────────────────────────────────
  return (
    <div className={styles.page}>

      {/* Header */}
      <div className={styles.header}>
        <Link href="/admin/students" className={styles.backLink}>
          <ArrowLeft size={15} aria-hidden /> All Students
        </Link>
        <div className={styles.headerInfo}>
          <div className={styles.headerIcon} aria-hidden>
            <UserPlus size={20} strokeWidth={1.75} />
          </div>
          <div>
            <h1 className={styles.title}>Add Student</h1>
            <p className={styles.subtitle}>Create a new student account</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <CreateStudentForm
        form={form}
        errors={errors}
        programs={programs}
        saving={saving}
        onChange={handleChange}
        onSubmit={handleSubmit}
      />

    </div>
  )
}