// app/(dashboard)/admin/students/[id]/edit/page.tsx
'use client'

import { use }          from 'react'
import { useRouter }    from 'next/navigation'
import { useAuthGuard } from '@/lib/hooks/admin/students/edit/useAuthGuard'
import { useStudent }   from '@/lib/hooks/admin/students/edit/useStudent'
import { usePrograms }  from '@/lib/hooks/admin/students/edit/usePrograms'
import { useUpdateStudent } from '@/lib/hooks/admin/students/edit/useUpdateStudent'
import {
  LoadingState,
  ErrorState,
  SuccessState,
  EditStudentHeader,
  EditStudentForm,
} from '@/components/dashboard/admin/students/edit'

export default function EditStudentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: studentId } = use(params)
  const router = useRouter()

  // ── Auth ──────────────────────────────────────────────────────────────────
  const { authLoading } = useAuthGuard()

  // ── Data ──────────────────────────────────────────────────────────────────
  const { loading, error, displayName, initialForm } = useStudent(studentId)
  const programs = usePrograms()

  // ── Mutations ─────────────────────────────────────────────────────────────
  const {
    form, formErrors, saving, success,
    handleChange, handleSubmit,
  } = useUpdateStudent(studentId, initialForm)

  // ── State gates ───────────────────────────────────────────────────────────
  if (authLoading || loading || !form) {return <LoadingState />}
  if (error)   {return <ErrorState  message={error} onBack={() => router.back()} />}
  if (success) {return <SuccessState fullName={form.full_name} />}

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", maxWidth: 820 }}>
      <EditStudentHeader
        studentId={studentId}
        displayName={displayName}
      />
      <EditStudentForm
        studentId={studentId}
        form={form}
        formErrors={formErrors}
        programs={programs}
        saving={saving}
        onChange={handleChange}
        onSubmit={handleSubmit}
      />
    </div>
  )
}