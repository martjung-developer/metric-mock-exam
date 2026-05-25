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
): Promise<{ data: ProgramRowWithSchool[]; error: string | null }> {
  const { data, error } = await client
    .from('programs')
    .select(
      'id, school_id, code, name, full_name, degree_type, major, years, description, created_at, schools(code,name,full_name)',
    )
    .order('name', { foreignTable: 'schools', ascending: true })
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
): Promise<{ data: RawStudentJoin[]; error: string | null }> {
  const { data, error } = await client
    .from('students')
    .select('id, program_id, year_level, profiles!inner(id, full_name, email)')

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
): Promise<{ data: RawExamRow[]; error: string | null }> {
  const { data, error } = await client
    .from('exams')
    .select('id, title, is_published, exam_type, program_id')

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
): Promise<FetchAllProgramDataResult> {
  const [programsResult, studentsResult, examsResult] = await Promise.all([
    fetchPrograms(client),
    fetchStudents(client),
    fetchExams(client),
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
