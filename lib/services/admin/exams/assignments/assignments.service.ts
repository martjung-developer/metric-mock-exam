/**
 * lib/services/admin/exams/assignments/assignments.service.ts
 *
 * Pure data layer for the Exam Assignments domain.
 * No React. No UI state. No business logic beyond data fetching + mapping.
 * All Supabase calls are centralised here.
 */

import type { SupabaseClient }  from '@supabase/supabase-js'
import type { Database }        from '@/lib/types/database'

import type {
  Assignment,
  AssignmentQueryRow,
  AssignStudentsPayload,
  AssignProgramPayload,
  FetchAssignmentsResult,
  MutationResult,
  ProfileProjection,
  Program,
  StudentSearchResult,
  SubmissionProjection,
} from '@/lib/types/admin/exams/assignments/assignments.types'

import {
  buildBestSubmissionMap,
  toDisplayStatus,
  unwrapJoin,
} from '@/lib/utils/admin/assignments/assignment-helpers'

type AppClient = SupabaseClient<Database>

async function fetchExamProgramId(
  client: AppClient,
  examId: string,
): Promise<string | null> {
  const { data } = await client
    .from('exams')
    .select('program_id')
    .eq('id', examId)
    .maybeSingle()

  return data?.program_id ?? null
}

// ── Fetch all assignments for an exam ─────────────────────────────────────────

/**
 * Parallel-fetches exam_assignments, programs, and submissions for `examId`,
 * then merges them into the `Assignment[]` display shape.
 *
 * ⚠️  One `as unknown as` cast per query that involves a joined relation:
 *   Supabase's TypeScript SDK cannot statically resolve nested join shapes
 *   from the generated schema type — it falls back to `Json | null`.
 *   We define explicit interfaces (`AssignmentQueryRow`, `StudentJoinRow`)
 *   that exactly mirror the SELECT columns + join we request.
 *   The casts are therefore safe as long as the query strings match the types.
 */
export async function fetchAssignmentsForExam(
  client:  AppClient,
  examId:  string,
): Promise<FetchAssignmentsResult> {
  // Phase 1: fire all independent queries in parallel
  const [asnRes, progRes, subRes] = await Promise.all([
    client
      .from('exam_assignments')
      .select(`
        id,
        student_id,
        program_id,
        assigned_at,
        deadline,
        is_active,
        programs:program_id ( id, name, code )
      `)
      .eq('exam_id', examId)
      .eq('is_active', true)
      .order('assigned_at', { ascending: false }),

    client
      .from('programs')
      .select('id, code, name')
      .order('name'),

    // Fetch all submissions for this exam upfront — no per-student filtering.
    client
      .from('submissions')
      .select('student_id, status, score, percentage')
      .eq('exam_id', examId),

  ])

  if (asnRes.error) {
    return { assignments: [], programs: [], error: 'Could not load assignments.' }
  }

  const programs   = (progRes.data ?? []) as Program[]
  const rawList    = (asnRes.data ?? []) as unknown as AssignmentQueryRow[]
  const subRows    = (subRes.data   ?? []) as SubmissionProjection[]
  // Phase 2: build submission lookup (handles retakes via priority merge)
  const bestSubmission = buildBestSubmissionMap(subRows)

  // Phase 3: collect unique student IDs for batch profile fetch
  const studentIds = rawList
    .map((a) => a.student_id)
    .filter((id): id is string => id !== null)

  // If no individual student assignments exist, skip the profile batch query
  if (studentIds.length === 0) {
    const assignments: Assignment[] = rawList.map((a) => {
      const prog = unwrapJoin(a.programs)
      return {
        id:                a.id,
        student:           { id: '', full_name: '(Program assignment)', email: '', student_id: null },
        program_name:      prog ? `${prog.code} — ${prog.name}` : null,
        assignment_source: 'program',
        assigned_at:       a.assigned_at,
        deadline:          a.deadline,
        is_active:         a.is_active,
        submission_status: 'not_started',
        score:             null,
        percentage:        null,
      }
    })
    return { assignments, programs, error: null }
  }

  // Phase 4: batch-fetch profiles and student rows
  const [profilesRes, studentsRes] = await Promise.all([
    client
      .from('profiles')
      .select('id, full_name, email')
      .in('id', studentIds),

    client
      .from('students')
      .select('id, student_id, year_level, programs:program_id ( code, name )')
      .in('id', studentIds),
  ])

  // Build O(1) lookup maps
  const profileMap: Record<string, ProfileProjection> = {}
  for (const p of (profilesRes.data ?? []) as ProfileProjection[]) {
    profileMap[p.id] = p
  }

  const studentMap: Record<string, {
    id: string
    student_id: string | null
    year_level: number | null
    program_code: string | null
    program_name: string | null
  }> = {}
  for (const s of (studentsRes.data ?? []) as unknown as Array<{
    id: string
    student_id: string | null
    year_level: number | null
    programs: { code: string; name: string } | { code: string; name: string }[] | null
  }>) {
    const studentProgram = unwrapJoin(s.programs)
    studentMap[s.id] = {
      id: s.id,
      student_id: s.student_id,
      year_level: s.year_level,
      program_code: studentProgram?.code ?? null,
      program_name: studentProgram?.name ?? null,
    }
  }

  // Phase 5: merge assignment rows with their best submission
  const assignments: Assignment[] = rawList.map((a) => {
    const prog    = unwrapJoin(a.programs)
    const profile = a.student_id ? profileMap[a.student_id]  : undefined
    const student = a.student_id ? studentMap[a.student_id]  : undefined
    const sub     = a.student_id ? bestSubmission[a.student_id] : undefined
    const isProgramAssignment = a.program_id !== null

    return {
      id: a.id,
      student: {
        id:         a.student_id ?? '',
        full_name:  profile?.full_name ?? 'Unknown Student',
        email:      profile?.email     ?? '',
        student_id: student?.student_id ?? null,
      },
      program_name:      student?.program_code && student?.program_name
        ? `${student.program_code} — ${student.program_name}`
        : prog
          ? `${prog.code} — ${prog.name}`
          : null,
      assignment_source: isProgramAssignment ? 'program' : 'manual',
      assigned_at:       a.assigned_at,
      deadline:          a.deadline,
      is_active:         a.is_active,
      submission_status: sub ? toDisplayStatus(sub.status) : 'not_started',
      score:             sub?.score      ?? null,
      percentage:        sub?.percentage ?? null,
    }
  })

  return { assignments, programs, error: null }
}

// ── Assign students ───────────────────────────────────────────────────────────

/**
 * Assigns a batch of students to an exam.
 * Silently skips students already assigned (no duplicate assignments).
 */
export async function assignStudentsToExam(
  client:  AppClient,
  payload: AssignStudentsPayload,
): Promise<MutationResult> {
  const { examId, studentIds, deadline } = payload
  const examProgramId = await fetchExamProgramId(client, examId)
  if (!examProgramId) {
    return { error: 'This exam has no designated degree program.' }
  }

  const { data: students } = await client
    .from('students')
    .select('id, program_id')
    .in('id', studentIds)

  const invalidStudents = (students ?? [])
    .filter((row: { id: string; program_id: string | null }) => row.program_id !== examProgramId)
    .map((row: { id: string }) => row.id)

  if (invalidStudents.length > 0) {
    return { error: 'Some selected students are from a different degree program than this exam.' }
  }

  // Check for existing active assignments to avoid duplicates
  const { data: existing } = await client
    .from('exam_assignments')
    .select('student_id')
    .eq('exam_id', examId)
    .eq('is_active', true)
    .in('student_id', studentIds)

  const alreadyAssigned = new Set(
    (existing ?? [])
      .map((r: { student_id: string | null }) => r.student_id)
      .filter((id): id is string => id !== null),
  )

  const toInsert = studentIds
    .filter((id) => !alreadyAssigned.has(id))
    .map((id) => ({
      exam_id:    examId,
      student_id: id,
      deadline,
      is_active:  true,
    }))

  if (toInsert.length === 0) {return { error: null }}

  const { error } = await client
    .from('exam_assignments')
    .insert(toInsert)

  return { error: error?.message ?? null }
}

// ── Assign program ────────────────────────────────────────────────────────────

/**
 * Assigns a program to an exam (all active students in the program gain access).
 * Returns an error if the program is already assigned.
 */
export async function assignProgramToExam(
  client:  AppClient,
  payload: AssignProgramPayload & { assignedBy: string | null },
): Promise<MutationResult> {
  const { examId, programId, assignedBy, deadline } = payload
  const examProgramId = await fetchExamProgramId(client, examId)
  if (!examProgramId) {
    return { error: 'This exam has no designated degree program.' }
  }
  if (programId !== examProgramId) {
    return { error: 'Cannot assign this exam to a different degree program.' }
  }

  const { data: students, error: studentErr } = await client
    .from('students')
    .select('id')
    .eq('program_id', programId)
  if (studentErr) {
    return { error: studentErr.message }
  }

  const studentIds = (students ?? []).map((row) => row.id).filter(Boolean)
  if (!studentIds.length) {
    return { error: null }
  }

  const { data: existingStudentRows, error: existingErr } = await client
    .from('exam_assignments')
    .select('student_id')
    .eq('exam_id', examId)
    .eq('is_active', true)
    .in('student_id', studentIds)

  if (existingErr) {
    return { error: existingErr.message }
  }

  const existingStudentIds = new Set(
    (existingStudentRows ?? [])
      .map((row) => row.student_id)
      .filter((id): id is string => !!id),
  )

  const rowsToInsert = studentIds
    .filter((studentId) => !existingStudentIds.has(studentId))
    .map((studentId) => ({
      exam_id: examId,
      student_id: studentId,
      program_id: programId,
      assigned_by: assignedBy,
      deadline,
      is_active: true,
    }))

  if (!rowsToInsert.length) {
    return { error: null }
  }

  const { error: insertErr } = await client
    .from('exam_assignments')
    .insert(rowsToInsert)

  return { error: insertErr?.message ?? null }
}

// ── Unassign ──────────────────────────────────────────────────────────────────

/**
 * Soft-deletes an assignment by setting `is_active = false`.
 * Preserves submission data.
 */
export async function unassignFromExam(
  client:       AppClient,
  assignmentId: string,
): Promise<MutationResult> {
  const { error } = await client
    .from('exam_assignments')
    .update({ is_active: false })
    .eq('id', assignmentId)

  return { error: error?.message ?? null }
}

// ── Student search ────────────────────────────────────────────────────────────

/**
 * Searches students by name or email, then joins with their student record
 * to surface the program code.
 */
export async function searchStudents(
  client: AppClient,
  query:  string,
  examId: string,
): Promise<{ results: StudentSearchResult[]; error: string | null }> {
  const examProgramId = await fetchExamProgramId(client, examId)
  if (!examProgramId) {
    return { results: [], error: 'This exam has no designated degree program.' }
  }

  const { data: profileData, error: profileErr } = await client
    .from('profiles')
    .select('id, full_name, email')
    .eq('role', 'student')
    .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
    .limit(10)

  if (profileErr)        {return { results: [], error: profileErr.message }}
  if (!profileData?.length) {return { results: [], error: null }}

  const profileIds = profileData.map((p: ProfileProjection) => p.id)

  const { data: studentData } = await client
    .from('students')
    .select('id, student_id, program_id, programs:program_id ( code )')
    .in('id', profileIds)
    .eq('program_id', examProgramId)

  // Build lookup: profile_id → { student_id, program_code }
  const studentMeta: Record<string, { student_id: string | null; program_code: string | null }> = {}

  for (const row of (studentData ?? []) as unknown as Array<{
    id:         string
    student_id: string | null
    program_id: string | null
    programs:   { code: string } | { code: string }[] | null
  }>) {
    const prog = unwrapJoin(row.programs)
    studentMeta[row.id] = {
      student_id:   row.student_id ?? null,
      program_code: prog?.code     ?? null,
    }
  }

  const results: StudentSearchResult[] = (profileData as ProfileProjection[])
    .filter((p) => studentMeta[p.id] !== undefined)
    .map((p) => ({
      id:           p.id,
      full_name:    p.full_name ?? 'Unknown',
      email:        p.email,
      student_id:   studentMeta[p.id]?.student_id   ?? null,
      program_code: studentMeta[p.id]?.program_code ?? null,
    }))

  return { results, error: null }
}
