/**
 * services/admin/programs/programs.service.ts
 *
 * Pure data layer for the Programs domain.
 * - No React imports
 * - No UI state
 * - No business logic beyond data fetching / mapping
 * - Every public function is fully typed
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database }       from '@/lib/types/database'
import type {
  ProgramRowWithSchool,
  RawStudentJoin,
  RawExamRow,
  FetchAllProgramDataResult,
  UpdateDescriptionResult,
} from '@/lib/types/admin/programs/programs.types'

type AppSupabaseClient = SupabaseClient<Database>

// ── Individual fetchers ───────────────────────────────────────────────────────

/**
 * Fetches all program rows ordered by name.
 * Returns `{ data, error }` — the caller decides how to surface the error.
 */
export async function fetchPrograms(
  client: AppSupabaseClient,
  schoolId?: string | null,
): Promise<{ data: ProgramRowWithSchool[]; error: string | null }> {
  let query = client
    .from('programs')
    .select(
      'id, school_id, code, name, full_name, degree_type, major, years, description, created_at, school:schools!programs_school_id_fkey(code,name,full_name)',
    )

  if (schoolId) {
    query = query.eq('school_id', schoolId)
  }

  const { data, error } = await query
    .order('code')

  if (error) {
    return { data: [], error: error.message }
  }
  return { data: (data ?? []) as ProgramRowWithSchool[], error: null }
}

/**
 * Fetches all students rows joined with their profile.
 * The inner join guarantees `profiles` is always present.
 *
 * ⚠️  Unsafe cast justification:
 *   Supabase's generated types for joined relations return `Json | null` for
 *   nested objects because the SDK cannot statically infer joined shapes from
 *   the schema type.  We cast to `RawStudentJoin[]` which exactly mirrors the
 *   DB columns + the profiles foreign-key join we request — this is safe as
 *   long as the query string is correct.
 */
export async function fetchStudents(
  client: AppSupabaseClient,
  schoolId?: string | null,
): Promise<{ data: RawStudentJoin[]; error: string | null }> {
  let query = client
    .from('students')
    .select('id, program_id, year_level, profiles!inner(id, full_name, email)')

  if (schoolId) {
    query = query.eq('school_id', schoolId)
  }

  const { data, error } = await query

  if (error) {
    return { data: [], error: error.message }
  }
  return {
    data: (data ?? []) as unknown as RawStudentJoin[],
    error: null,
  }
}

/**
 * Fetches a summary of all exams (id, title, published flag, type, program).
 */
export async function fetchExams(
  client: AppSupabaseClient,
  programIds?: string[],
): Promise<{ data: RawExamRow[]; error: string | null }> {
  if (programIds && programIds.length === 0) {
    return { data: [], error: null }
  }

  let query = client
    .from('exams')
    .select('id, title, is_published, exam_type, program_id')

  if (programIds) {
    query = query.in('program_id', programIds)
  }

  const { data, error } = await query

  if (error) {
    return { data: [], error: error.message }
  }
  return { data: (data ?? []) as RawExamRow[], error: null }
}

// ── Batch fetcher (used by the hook) ─────────────────────────────────────────

/**
 * Fires all three queries in parallel and returns a single result object.
 * If ANY query fails we surface the first error found; partial data is still
 * returned so the UI can show whatever it received.
 */
export async function fetchAllProgramData(
  client: AppSupabaseClient,
  schoolId?: string | null,
): Promise<FetchAllProgramDataResult> {
  const programsResult = await fetchPrograms(client, schoolId)
  const programIds = programsResult.data.map((program) => program.id)

  const [studentsResult, examsResult] = await Promise.all([
    fetchStudents(client, schoolId),
    fetchExams(client, schoolId ? programIds : undefined),
  ])

  const error =
    programsResult.error ?? studentsResult.error ?? examsResult.error ?? null

  return {
    programs: programsResult.data,
    students: studentsResult.data,
    exams:    examsResult.data,
    error,
  }
}

// ── Mutations ─────────────────────────────────────────────────────────────────

/**
 * Persists a new description (or null to clear it) for a single program.
 */
export async function updateProgramDescription(
  client: AppSupabaseClient,
  programId:   string,
  description: string | null,
): Promise<UpdateDescriptionResult> {
  const { error } = await client
    .from('programs')
    .update({ description })
    .eq('id', programId)

  return { error: error?.message ?? null }
}
