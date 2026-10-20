// app/api/admin/faculty/route.ts
import { NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient as createServerClient }  from '@/lib/supabase/server'
import type { Database }                        from '@/lib/types/database'
import { getProfile }                           from '@/lib/auth/helpers'
import type { FacultyRoleType, FacultyRow, FacultyProgramLink } from '@/lib/types/admin/faculty'

function getServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) { throw new Error('Missing Supabase service role env vars.') }
  return createServiceClient<Database>(url, key, { auth: { persistSession: false } })
}

export async function GET() {
  try {
    const supabaseSession = await createServerClient()
    const { data: { user }, error: sessionError } = await supabaseSession.auth.getUser()
    if (sessionError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 })
    }

    const profile = await getProfile(user.id)
    if (!profile || (profile.role !== 'admin' && profile.role !== 'faculty')) {
      return NextResponse.json({ success: false, error: 'Forbidden: admin or faculty role required.' }, { status: 403 })
    }

    const serviceClient = getServiceRoleClient()
    let adminSchoolId: string | null = null
    // NEW: program heads can now be scoped to MULTIPLE programs
    let programHeadProgramIds: string[] | null = null

    if (profile.role === 'admin') {
      const { data: adminRow } = await serviceClient
        .from('admins').select('school_id').eq('user_id', user.id).maybeSingle()
      adminSchoolId = adminRow?.school_id ?? null
      if (!adminSchoolId) {
        return NextResponse.json({ success: true, faculty: [] })
      }
    } else {
      const { data: facultyRow } = await serviceClient
        .from('faculty').select('id').eq('user_id', user.id).maybeSingle()

      if (!facultyRow) {
        return NextResponse.json({ success: false, error: 'Forbidden: program head role required.' }, { status: 403 })
      }

      const { data: headRows } = await serviceClient
        .from('faculty_programs')
        .select('program_id')
        .eq('faculty_id', facultyRow.id)
        .eq('is_program_head', true)

      const ids = (headRows ?? []).map((r) => r.program_id)
      if (ids.length === 0) {
        return NextResponse.json({ success: false, error: 'Forbidden: program head role required.' }, { status: 403 })
      }
      programHeadProgramIds = ids
    }

    type FacultyListDbRow = {
      id: string
      faculty_id: string
      full_name: string
      email: string
      role_types: FacultyRoleType[] | null
      is_active: boolean
      created_at: string
      program_id: string | null           // legacy mirror
      is_program_head: boolean            // legacy mirror
      school_id: string | null
      programs: {
        code: string | null
        name: string | null
        schools: { code: string | null; name: string | null } | null
      } | null
      faculty_programs: {
        program_id: string
        is_program_head: boolean
        programs: {
          code: string | null
          name: string | null
          school_id: string | null
          schools: { code: string | null; name: string | null } | null
        } | null
      }[]
    }

    let query = serviceClient
      .from('faculty')
      .select(`
        id, faculty_id, full_name, email, role_types, is_active, created_at,
        program_id, is_program_head, school_id,
        programs ( code, name, schools ( code, name ) ),
        faculty_programs (
          program_id,
          is_program_head,
          programs ( code, name, school_id, schools ( code, name ) )
        )
      `)
      .returns<FacultyListDbRow[]>()

    if (adminSchoolId) {
      query = query.eq('school_id', adminSchoolId)
    }
    if (programHeadProgramIds) {
      // A program-head faculty user should see faculty who share ANY of their headed programs.
      const { data: peerLinks } = await serviceClient
        .from('faculty_programs')
        .select('faculty_id')
        .in('program_id', programHeadProgramIds)
      const peerFacultyIds = [...new Set((peerLinks ?? []).map((r) => r.faculty_id))]
      if (peerFacultyIds.length === 0) {
        return NextResponse.json({ success: true, faculty: [] })
      }
      query = query.in('id', peerFacultyIds)
    }

    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) {
      console.error('[faculty/GET] query error:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    const faculty: FacultyRow[] = (data ?? []).map((row) => {
      const programs: FacultyProgramLink[] = (row.faculty_programs ?? []).map((fp) => ({
        program_id: fp.program_id,
        program_code: fp.programs?.code ?? null,
        program_name: fp.programs?.name ?? null,
        school_id: fp.programs?.school_id ?? null,
        school_code: fp.programs?.schools?.code ?? null,
        school_name: fp.programs?.schools?.name ?? null,
        is_program_head: fp.is_program_head,
      }))

      return {
        id: row.id,
        faculty_id: row.faculty_id,
        full_name: row.full_name,
        email: row.email,
        role_types: row.role_types ?? [],
        is_active: row.is_active,
        created_at: row.created_at,
        // legacy mirrored fields
        program_id: row.program_id,
        is_program_head: row.is_program_head,
        program_code: row.programs?.code ?? null,
        program_name: row.programs?.name ?? null,
        school_code: row.programs?.schools?.code ?? null,
        school_name: row.programs?.schools?.name ?? null,
        programs,
      }
    })

    return NextResponse.json({ success: true, faculty })
  } catch (err) {
    console.error('[faculty/GET] unexpected error:', err)
    return NextResponse.json({ success: false, error: 'Server error. Please try again.' }, { status: 500 })
  }
}