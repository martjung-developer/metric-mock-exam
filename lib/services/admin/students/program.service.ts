/**
 * lib/services/admin/students/program.service.ts
 *
 * Pure data layer for programs used on the students admin page.
 * No React, no UI state, no business logic.
 */

import type { SupabaseClient }    from '@supabase/supabase-js'
import type { Database }          from '@/lib/types/database'
import type {
  FetchProgramsResult,
  Program,
} from '@/lib/types/admin/students/program.types'

type AppClient = SupabaseClient<Database>

interface ProgramScope {
  schoolId: string | null
  programId: string | null
  role: 'admin' | 'faculty' | 'other'
}

async function getProgramScope(client: AppClient): Promise<ProgramScope> {
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

/**
 * Fetches all programs ordered by code ascending.
 * Returns only the columns needed by the students page.
 */
export async function getPrograms(
  client: AppClient,
): Promise<FetchProgramsResult> {
  const scope = await getProgramScope(client)
  if ((scope.role === 'admin' || scope.role === 'faculty') && !scope.schoolId) {
    return { programs: [], error: null }
  }

  let query = client
    .from('programs')
    .select('id, code, name')

  if (scope.schoolId) {
    query = query.eq('school_id', scope.schoolId)
  }
  if (scope.programId) {
    query = query.eq('id', scope.programId)
  }

  const { data, error } = await query.order('code', { ascending: true })

  if (error) {
    return { programs: [], error: error.message }
  }

  return { programs: (data ?? []) as Program[], error: null }
}
