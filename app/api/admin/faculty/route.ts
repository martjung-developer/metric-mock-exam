// app/api/admin/faculty/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// GET — returns the full faculty list joined with programs.
// Accessible by both 'admin' and 'faculty' roles (faculty can view peers).
// Write operations (create, toggle status) remain admin-only.
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient as createServerClient }  from '@/lib/supabase/server'
import type { Database }                        from '@/lib/types/database'
import { getProfile }                           from '@/lib/auth/helpers'
import type { FacultyRoleType, FacultyRow }     from '@/lib/types/admin/faculty'

function getServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Missing Supabase service role env vars.')
  }
  return createServiceClient<Database>(url, key, { auth: { persistSession: false } })
}

export async function GET() {
  try {
    // ── Auth check ────────────────────────────────────────────────────────
    const supabaseSession = await createServerClient()
    const { data: { user }, error: sessionError } = await supabaseSession.auth.getUser()

    if (sessionError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 })
    }

    const profile = await getProfile(user.id)

    if (!profile || (profile.role !== 'admin' && profile.role !== 'faculty')) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: admin or faculty role required.' },
        { status: 403 },
      )
    }

    // ── Query ─────────────────────────────────────────────────────────────
    const serviceClient = getServiceRoleClient()

    type FacultyListDbRow = {
      id: string
      faculty_id: string
      full_name: string
      email: string
      role_type: FacultyRoleType | null
      is_active: boolean
      created_at: string
      program_id: string | null
      programs: {
        code: string | null
        name: string | null
        schools: {
          code: string | null
          name: string | null
        } | null
      } | null
    }

    const { data, error } = await serviceClient
      .from('faculty')
      .select(`
        id,
        faculty_id,
        full_name,
        email,
        role_type,
        is_active,
        created_at,
        program_id,
        programs (
          id,
          code,
          name,
          full_name,
          school_id,
          schools (
            code,
            name
          )
        )
      `)
      .returns<FacultyListDbRow[]>()
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[faculty/GET] query error:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    const faculty: FacultyRow[] = (data ?? []).map((row) => ({
      id: row.id,
      faculty_id: row.faculty_id,
      full_name: row.full_name,
      email: row.email,
      role_type: row.role_type,
      is_active: row.is_active,
      created_at: row.created_at,
      program_id: row.program_id,
      program_code: row.programs?.code ?? null,
      program_name: row.programs?.name ?? null,
      school_code: row.programs?.schools?.code ?? null,
      school_name: row.programs?.schools?.name ?? null,
    }))

    return NextResponse.json({ success: true, faculty })
  } catch (err) {
    console.error('[faculty/GET] unexpected error:', err)
    return NextResponse.json(
      { success: false, error: 'Server error. Please try again.' },
      { status: 500 },
    )
  }
}
