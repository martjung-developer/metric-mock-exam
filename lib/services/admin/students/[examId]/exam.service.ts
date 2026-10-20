// lib/services/admin/students/[examId]/exam.service.ts
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'
import type { AssignedExamRow, AssignedExam } from '@/lib/types/admin/students/[examId]/exam.types'
import { mapExamRow } from '@/lib/utils/admin/students/[examId]/mappers'

type TypedClient = SupabaseClient<Database>

export async function getAssignedExams(
  client:    TypedClient,
  studentId: string,
): Promise<AssignedExam[]> {
  const { data, error } = await client
    .from('exam_assignments')
    .select(`
      id, exam_id, is_active, assigned_at, deadline,
      exams ( title, exam_type )
    `)
    .eq('student_id', studentId)
    .order('assigned_at', { ascending: false })

  if (error) { throw new Error(error.message) }

  return (data ?? []).map((row) => mapExamRow(row as unknown as AssignedExamRow))
}