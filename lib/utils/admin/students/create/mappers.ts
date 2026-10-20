// lib/utils/admin/students/create/mappers.ts
//
// Pure transformation functions — form state → service payload.
// No React, no Supabase.

import type { StudentFormData, StudentCreatePayload } from '@/lib/types/admin/students/create/student.types'

/**
 * Converts raw form strings into the typed payload the service layer expects.
 * Handles trimming, lowercasing, and null-coercion for optional fields.
 */
export function mapFormToPayload(form: StudentFormData): StudentCreatePayload {
  return {
    full_name:  form.full_name.trim(),
    email:      form.email.trim().toLowerCase(),
    password:   form.password,
    student_id: form.student_id.trim() || null,
    program_id: form.program_id         || null,
    year_level: form.year_level         ? Number(form.year_level) : null,
    school:     form.school.trim()      || null,
  }
}