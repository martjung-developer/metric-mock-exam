// lib/services/student/profile/profile.service.ts
//
// FIXED: getRecentSubmissions now correctly fetches the last 5 RELEASED
// submissions dynamically from Supabase — no static data.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database }       from '@/lib/types/database'

type TypedClient = SupabaseClient<Database>

// ── Row shapes ────────────────────────────────────────────────────────────────

export type ProfileRow = Pick<
  Database['public']['Tables']['profiles']['Row'],
  'full_name' | 'email' | 'avatar_url'
>

export type StudentRow = Pick<
  Database['public']['Tables']['students']['Row'],
  'id' | 'student_id' | 'year_level' | 'target_exam' | 'school' | 'program_id' | 'school_id'
>

export type ProgramRow = Pick<
  Database['public']['Tables']['programs']['Row'],
  'id' | 'name' | 'full_name' | 'code'
>

export type SchoolRow = Pick<
  Database['public']['Tables']['schools']['Row'],
  'id' | 'name'
>

export interface SubmissionRow {
  percentage:    number | null
  passed:        boolean | null
  submitted_at:  string | null
  exam_title:    string
  category_name: string
}

// ── Service functions ─────────────────────────────────────────────────────────

export async function getProfile(
  client: TypedClient,
  userId: string,
): Promise<ProfileRow | null> {
  const { data } = await client
    .from('profiles')
    .select('full_name, email, avatar_url')
    .eq('id', userId)
    .single()

  return data satisfies ProfileRow | null
}

export async function getStudent(
  client: TypedClient,
  userId: string,
): Promise<StudentRow | null> {
  const { data } = await client
    .from('students')
    .select('id, student_id, year_level, target_exam, school, program_id, school_id')
    .eq('id', userId)
    .single()

  return data satisfies StudentRow | null
}

export async function getProgram(
  client:    TypedClient,
  programId: string,
): Promise<ProgramRow | null> {
  const { data } = await client
    .from('programs')
    .select('id, name, full_name, code')
    .eq('id', programId)
    .single()

  return data satisfies ProgramRow | null
}

export async function getSchool(
  client:   TypedClient,
  schoolId: string,
): Promise<SchoolRow | null> {
  const { data } = await client
    .from('schools')
    .select('id, name')
    .eq('id', schoolId)
    .single()

  return data satisfies SchoolRow | null
}

export async function getTotalTaken(
  client: TypedClient,
  userId: string,
): Promise<number> {
  const { count } = await client
    .from('submissions')
    .select('id', { count: 'exact', head: true })
    .eq('student_id', userId)
    .in('status', ['submitted', 'graded', 'released'])

  return count ?? 0
}

// ── Internal helper types for multi-step join ─────────────────────────────────

interface RawSubmission {
  percentage:   number | null
  passed:       boolean | null
  submitted_at: string | null
  exam_id:      string | null
}

interface RawExam {
  id:          string
  title:       string
  category_id: string | null
}

interface RawCategory {
  id:   string
  name: string
}

/**
 * Fetches the last 5 RELEASED submissions for the student, joined with exam
 * and category data. All data comes from Supabase — nothing is hardcoded.
 *
 * Order: newest submitted_at first.
 */
export async function getRecentSubmissions(
  client: TypedClient,
  userId: string,
): Promise<SubmissionRow[]> {
  // Step 1: Fetch last 5 released submissions for this student
  const { data: rawSubs, error: subsError } = await client
    .from('submissions')
    .select('percentage, passed, submitted_at, exam_id')
    .eq('student_id', userId)
    .eq('status', 'released')
    .order('submitted_at', { ascending: false })
    .limit(5)

  if (subsError || !rawSubs || rawSubs.length === 0) {return []}

  const subs: RawSubmission[] = rawSubs

  // Step 2: Fetch related exams (unique exam IDs only)
  const examIds = [
    ...new Set(
      subs
        .map((s) => s.exam_id)
        .filter((id): id is string => id !== null),
    ),
  ]

  if (examIds.length === 0) {return []}

  const { data: examsRaw } = await client
    .from('exams')
    .select('id, title, category_id')
    .in('id', examIds)

  const exams: RawExam[] = examsRaw ?? []

  // Step 3: Fetch related categories (unique category IDs only)
  const categoryIds = [
    ...new Set(
      exams
        .map((e) => e.category_id)
        .filter((id): id is string => id !== null),
    ),
  ]

  const categoriesRaw =
    categoryIds.length > 0
      ? (
          await client
            .from('exam_categories')
            .select('id, name')
            .in('id', categoryIds)
        ).data ?? []
      : []

  const categories: RawCategory[] = categoriesRaw

  // Step 4: Build lookup maps and map to SubmissionRow
  const examMap     = new Map(exams.map((e) => [e.id, e]))
  const categoryMap = new Map(categories.map((c) => [c.id, c]))

  return subs.map((s) => {
    const exam     = s.exam_id     ? examMap.get(s.exam_id)           : undefined
    const category = exam?.category_id ? categoryMap.get(exam.category_id) : undefined

    return {
      percentage:    s.percentage,
      passed:        s.passed,
      submitted_at:  s.submitted_at,
      exam_title:    exam?.title    ?? 'Unknown Exam',
      category_name: category?.name ?? 'Uncategorised',
    }
  })
}

// ── Profile update helpers (used by the edit modal) ───────────────────────────

export interface UpdateProfilePayload {
  full_name: string
}

export interface ServiceResult<T = void> {
  data:  T | null
  error: string | null
}

export async function updateProfile(
  client:  TypedClient,
  userId:  string,
  payload: UpdateProfilePayload,
): Promise<ServiceResult<void>> {
  const updatePayload = {
    ...payload,
    updated_at: new Date().toISOString(),
  } as Database['public']['Tables']['profiles']['Update']

  const { error } = await client
    .from('profiles')
    .update(updatePayload)
    .eq('id', userId)

  if (error) {return { data: null, error: error.message }}
  return { data: null, error: null }
}