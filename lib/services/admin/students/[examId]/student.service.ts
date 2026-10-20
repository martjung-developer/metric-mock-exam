// lib/services/admin/students/[examId]/student.service.ts
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'
import type { StudentProfileRow, StudentProfile } from '@/lib/types/admin/students/[examId]/student.types'
import { mapProfileRow } from '@/lib/utils/admin/students/[examId]/mappers'

type TypedClient = SupabaseClient<Database>

export async function getStudentProfile(
  client:    TypedClient,
  studentId: string,
): Promise<StudentProfile> {
  const { data, error } = await client
    .from('profiles')
    .select(`
      id, full_name, email, avatar_url, created_at,
      students!inner (
        student_id, year_level, program_id, school, target_exam,
        programs ( id, code, name )
      )
    `)
    .eq('id', studentId)
    .eq('role', 'student')
    .single()

  if (error || !data) {
    throw new Error(error?.message ?? 'Student not found.')
  }

  // Cast through the raw join shape — Supabase's generated types don't model
  // nested selects perfectly, so we validate structure in the mapper instead.
  return mapProfileRow(data as unknown as StudentProfileRow)
}