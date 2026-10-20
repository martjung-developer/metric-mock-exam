// lib/utils/admin/students/edit/validators.ts
import type { EditStudentForm, EditStudentFormErrors } from '@/lib/types/admin/students/edit/student.types'

export function validateEditStudentForm(form: EditStudentForm): EditStudentFormErrors {
  const errors: EditStudentFormErrors = {}
  if (!form.full_name.trim()) {errors.full_name = 'Full name is required.'}
  if (!form.student_id.trim()) {errors.student_id = 'Student ID is required.'}
  if (!form.program_id.trim()) {errors.program_id = 'Program is required.'}
  if (!form.year_level.trim()) {errors.year_level = 'Year level is required.'}
  if (!form.school.trim()) {errors.school = 'School is required.'}
  if (!form.target_exam.trim()) {errors.target_exam = 'Target exam is required.'}
  return errors
}