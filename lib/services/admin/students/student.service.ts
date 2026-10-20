// lib/services/admin/students/student.service.ts
// ONLY data retrieval helpers added — all existing functions unchanged.

import type { SupabaseClient }  from '@supabase/supabase-js'
import type { Database }        from '@/lib/types/database'
import type {
  DeleteStudentResult,
  FetchStudentsResult,
  StudentRaw,
} from '@/lib/types/admin/students/student.types'
import { mapStudentRow } from '@/lib/utils/admin/students/mappers'

type AppClient = SupabaseClient<Database>

interface StudentScope {
  schoolId: string | null
  programId: string | null
  role: 'admin' | 'faculty' | 'other'
}

async function getStudentScope(client: AppClient): Promise<StudentScope> {
  const { data: userRes } = await client.auth.getUser()
  const userId = userRes.user?.id ?? null
  if (!userId) {
    return { schoolId: null, programId: null, role: 'other' }
  }

  const { data: profile } = await client
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle()

  if (profile?.role === 'faculty') {
    const { data: facultyRow } = await client
      .from('faculty')
      .select('school_id, program_id')
      .eq('user_id', userId)
      .maybeSingle()

    return {
      schoolId: facultyRow?.school_id ?? null,
      programId: facultyRow?.program_id ?? null,
      role: 'faculty',
    }
  }

  const { data: adminRow } = await client
    .from('admins')
    .select('school_id')
    .eq('user_id', userId)
    .maybeSingle()

  return {
    schoolId: adminRow?.school_id ?? null,
    programId: null,
    role: profile?.role === 'admin' ? 'admin' : 'other',
  }
}

// ── ADDED: Student access snapshot ───────────────────────────────────────────
// Returns the program_id and year_level needed for exam access validation.
// These are the source-of-truth values — always fetched fresh, never cached.
//
// Throws if the student row is not found (hard error by design — a missing
// student record means the auth pipeline is broken and we must not proceed).

export interface StudentAccessSnapshot {
  id:         string
  program_id: string | null
  year_level: number | null
}

export async function getStudentAccessSnapshot(
  client:    AppClient,
  studentId: string,
): Promise<StudentAccessSnapshot> {
  const { data, error } = await client
    .from('students')
    .select('id, program_id, year_level')
    .eq('id', studentId)
    .single()

  if (error || !data) {
    throw new Error(
      `Student record not found for id=${studentId}. ` +
      `Cannot proceed without program_id and year_level. ` +
      (error?.message ?? ''),
    )
  }

  const row = data as { id: string; program_id: string | null; year_level: number | null }

  return {
    id:         row.id,
    program_id: row.program_id,
    year_level:  row.year_level,
  }
}

// ── Existing functions — UNCHANGED ────────────────────────────────────────────

export async function getStudentsWithProfiles(
  client: AppClient,
): Promise<FetchStudentsResult> {
  const scope = await getStudentScope(client)
  if ((scope.role === 'admin' || scope.role === 'faculty') && !scope.schoolId) {
    return { students: [], error: null }
  }

  let query = client
    .from('students')
    .select(`
      id,
      student_id,
      year_level,
      program_id,
      created_at,
      profiles!inner (
        full_name,
        email,
        role
      ),
      programs (
        id,
        code,
        name
      )
    `)
    .eq('profiles.role', 'student')

  if (scope.schoolId) {
    query = query.eq('school_id', scope.schoolId)
  }
  if (scope.programId) {
    query = query.eq('program_id', scope.programId)
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) {
    return { students: [], error: 'Failed to load students.' }
  }

  const students = (data as unknown as StudentRaw[]).map(mapStudentRow)
  return { students, error: null }
}

export async function createStudent(
  client: AppClient,
  payload: { student_id: string; year_level: number; program_id: string }
) {
  const { data, error } = await client
    .from('students')
    .insert([payload])
    .select()

  if (error) {
    return { student: null, error: error.message }
  }

  return { student: data?.[0] ?? null, error: null }
}

export async function deleteStudentById(
  client: AppClient,
  id:     string,
): Promise<DeleteStudentResult> {
  const { error } = await client
    .from('profiles')
    .delete()
    .eq('id', id)

  return { error: error?.message ?? null }
}
