// lib/services/admin/students/[examId]/submission.service.ts
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database }       from '@/lib/types/database'
import type { SubmissionRaw, Submission } from '@/lib/types/admin/students/[examId]/submission.types'
import { mapSubmissionRow }    from '@/lib/utils/admin/students/[examId]/mappers'

type TypedClient = SupabaseClient<Database>

export async function getSubmissions(
  client:    TypedClient,
  studentId: string,
): Promise<Submission[]> {
  const { data, error } = await client
    .from('submissions')
    .select(`
      id,
      exam_id,
      status,
      score,
      percentage,
      passed,
      submitted_at,
      exams ( title, exam_type )
    `)
    .eq('student_id', studentId)
    .order('submitted_at', { ascending: false, nullsFirst: false })
    .limit(100)

  if (error) { throw new Error(error.message) }

  // Keep only the latest submission per exam (rows are already newest-first)
  const seen = new Set<string>()
  const latest = (data ?? []).filter((row) => {
    const key = (row as { exam_id: string | null }).exam_id ?? row.id
    if (seen.has(key)) { return false }
    seen.add(key)
    return true
  })

  return latest.map((row) => mapSubmissionRow(row as unknown as SubmissionRaw))
}