// app/api/admin/notifications/route.ts
import { NextResponse, type NextRequest } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/types/database'
import type { SendNotificationPayload } from '@/lib/types/admin/notifications/notifications.types'

type SchoolRow = { school_id: string | null }
type ScopedUserRow = { id?: string | null; user_id?: string | null; school_id: string | null }
type ScopedStudentRow = {
  id: string
  user_id: string | null
  program_id: string | null
}
type ProfileRow = { id: string; full_name: string | null; email: string }
type ProgramRow = { id: string; school_id: string | null }

function getServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Missing Supabase service role env vars.')
  }
  return createServiceClient<Database>(url, key, { auth: { persistSession: false } })
}

async function getLoggedInUserId() {
  const supabaseSession = await createServerClient()
  const { data: { user }, error } = await supabaseSession.auth.getUser()
  if (error || !user) {
    return null
  }
  return user.id
}

/**
 * Returns the set of program IDs that belong to a given school.
 * Students are enrolled via program_id, not a direct school_id column,
 * so any student scoping needs to go through this join
 * (mirrors questionnaires.service.ts's getScope() / fetchExams()).
 */
async function getSchoolProgramIds(
  supabase: ReturnType<typeof getServiceRoleClient>,
  schoolId: string,
) {
  const { data, error } = await supabase
    .from('programs')
    .select('id,school_id')
    .eq('school_id', schoolId)
    .overrideTypes<ProgramRow[], { merge: false }>()

  if (error) {
    throw new Error(`Failed to load programs for school: ${error.message}`)
  }

  return new Set((data ?? []).map((program) => program.id))
}

async function getUserSchoolId(
  supabase: ReturnType<typeof getServiceRoleClient>,
  userId: string,
) {
  const [adminResult, facultyResult, studentResult] = await Promise.all([
    supabase
      .from('admins')
      .select('school_id')
      .eq('user_id', userId)
      .maybeSingle()
      .overrideTypes<SchoolRow, { merge: false }>(),
    supabase
      .from('faculty')
      .select('school_id')
      .eq('user_id', userId)
      .maybeSingle()
      .overrideTypes<SchoolRow, { merge: false }>(),
    // Students don't reliably have school_id populated directly; resolve
    // their school through program_id -> programs.school_id instead.
    supabase
      .from('students')
      .select('program_id')
      .or(`id.eq.${userId},user_id.eq.${userId}`)
      .maybeSingle()
      .overrideTypes<{ program_id: string | null }, { merge: false }>(),
  ])

  if (adminResult.error) {
    throw new Error(`Failed to resolve admin school: ${adminResult.error.message}`)
  }
  if (facultyResult.error) {
    throw new Error(`Failed to resolve faculty school: ${facultyResult.error.message}`)
  }
  if (studentResult.error) {
    throw new Error(`Failed to resolve student program: ${studentResult.error.message}`)
  }

  if (adminResult.data?.school_id) {
    return adminResult.data.school_id
  }
  if (facultyResult.data?.school_id) {
    return facultyResult.data.school_id
  }

  const programId = studentResult.data?.program_id
  if (!programId) {
    return null
  }

  const { data: program, error: programError } = await supabase
    .from('programs')
    .select('school_id')
    .eq('id', programId)
    .maybeSingle()
    .overrideTypes<SchoolRow, { merge: false }>()

  if (programError) {
    throw new Error(`Failed to resolve program school: ${programError.message}`)
  }

  return program?.school_id ?? null
}

async function getScopedUserIds(
  supabase: ReturnType<typeof getServiceRoleClient>,
  schoolId: string,
) {
  const schoolProgramIds = await getSchoolProgramIds(supabase, schoolId)

  const [studentsResult, facultyResult, adminsResult] = await Promise.all([
    supabase
      .from('students')
      .select('id,user_id,program_id')
      .overrideTypes<(ScopedUserRow & { program_id: string | null })[], { merge: false }>(),
    supabase
      .from('faculty')
      .select('user_id,school_id')
      .eq('school_id', schoolId)
      .overrideTypes<ScopedUserRow[], { merge: false }>(),
    supabase
      .from('admins')
      .select('user_id,school_id')
      .eq('school_id', schoolId)
      .overrideTypes<ScopedUserRow[], { merge: false }>(),
  ])

  if (studentsResult.error) {
    throw new Error(`Failed to load students: ${studentsResult.error.message}`)
  }
  if (facultyResult.error) {
    throw new Error(`Failed to load faculty: ${facultyResult.error.message}`)
  }
  if (adminsResult.error) {
    throw new Error(`Failed to load admins: ${adminsResult.error.message}`)
  }

  const ids = new Set<string>()

  for (const row of studentsResult.data ?? []) {
    if (!row.program_id || !schoolProgramIds.has(row.program_id)) {
      continue
    }
    if (row.id) {
      ids.add(row.id)
    }
    if (row.user_id) {
      ids.add(row.user_id)
    }
  }

  for (const row of [...(facultyResult.data ?? []), ...(adminsResult.data ?? [])]) {
    if (row.user_id) {
      ids.add(row.user_id)
    }
  }

  return ids
}

async function getScopedStudentRecipients(
  supabase: ReturnType<typeof getServiceRoleClient>,
  schoolId: string,
) {
  const schoolProgramIds = await getSchoolProgramIds(supabase, schoolId)

  if (schoolProgramIds.size === 0) {
    return []
  }

  const { data: students, error: studentsError } = await supabase
    .from('students')
    .select('id,user_id,program_id')
    .in('program_id', Array.from(schoolProgramIds))
    .overrideTypes<ScopedStudentRow[], { merge: false }>()

  if (studentsError) {
    throw new Error(`Failed to load scoped students: ${studentsError.message}`)
  }

  const profileIds = Array.from(
    new Set(
      (students ?? [])
        .flatMap((student) => [student.id, student.user_id])
        .filter((id): id is string => Boolean(id)),
    ),
  )

  const { data: profiles, error: profilesError } = profileIds.length > 0
    ? await supabase
        .from('profiles')
        .select('id,full_name,email')
        .in('id', profileIds)
        .overrideTypes<ProfileRow[], { merge: false }>()
    : { data: [] as ProfileRow[], error: null }

  if (profilesError) {
    throw new Error(`Failed to load student profiles: ${profilesError.message}`)
  }

  const profilesById = new Map((profiles ?? []).map((profile) => [profile.id, profile]))

  return (students ?? [])
    .map((student) => {
      // profiles.id is the auth user id, so it's keyed off user_id first,
      // falling back to students.id only for legacy rows where id === user_id.
      const profile = profilesById.get(student.user_id ?? '') ?? profilesById.get(student.id)
      if (!profile) {
        // No matching profile means we have nothing to notify/display —
        // skip rather than emitting a recipient with blank name/email.
        return null
      }
      return {
        id: student.user_id ?? student.id,
        full_name: profile.full_name,
        email: profile.email,
        students: { id: student.id },
      }
    })
    .filter((recipient): recipient is NonNullable<typeof recipient> => recipient !== null)
}

export async function GET() {
  try {
    const userId = await getLoggedInUserId()
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 })
    }

    const supabase = getServiceRoleClient()
    const schoolId = await getUserSchoolId(supabase, userId)
    if (!schoolId) {
      return NextResponse.json({ success: true, notifications: [], students: [] })
    }

    const scopedUserIds = await getScopedUserIds(supabase, schoolId)
    if (scopedUserIds.size === 0) {
      return NextResponse.json({ success: true, notifications: [], students: [] })
    }

    const [notificationsResult, students] = await Promise.all([
      supabase
        .from('notifications')
        .select('*')
        .in('user_id', Array.from(scopedUserIds))
        .order('created_at', { ascending: false }),
      getScopedStudentRecipients(supabase, schoolId),
    ])

    if (notificationsResult.error) {
      return NextResponse.json({ success: false, error: notificationsResult.error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, notifications: notificationsResult.data ?? [], students })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getLoggedInUserId()
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 })
    }

    const payload = (await req.json()) as SendNotificationPayload
    const title = payload.title?.trim() ?? ''
    const message = payload.message?.trim() ?? ''
    const recipientIds = Array.from(new Set(payload.recipientIds ?? []))

    if (!title || !message) {
      return NextResponse.json({ success: false, error: 'Title and message are required.' }, { status: 400 })
    }
    if (recipientIds.length === 0) {
      return NextResponse.json({ success: false, error: 'At least one recipient is required.' }, { status: 400 })
    }

    const supabase = getServiceRoleClient()
    const schoolId = await getUserSchoolId(supabase, userId)
    if (!schoolId) {
      return NextResponse.json({ success: false, error: 'Forbidden.' }, { status: 403 })
    }

    const scopedUserIds = await getScopedUserIds(supabase, schoolId)
    const hasOutOfScopeRecipient = recipientIds.some((id) => !scopedUserIds.has(id))
    if (hasOutOfScopeRecipient) {
      return NextResponse.json({ success: false, error: 'Forbidden.' }, { status: 403 })
    }

    const rows = recipientIds.map((uid) => ({
      user_id: uid,
      title,
      message,
      type: payload.type,
      is_read: false,
    }))

    const { error } = await supabase.from('notifications').insert(rows)
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}