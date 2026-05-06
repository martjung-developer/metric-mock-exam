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

function getServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing Supabase service role env vars.')
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
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[faculty/GET] query error:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const faculty = (data as any[]).map((row) => ({
      id:           row.id          as string,
      faculty_id:   row.faculty_id  as string,
      full_name:    row.full_name   as string,
      email:        row.email       as string,
      role_type:    (row.role_type  as string | null) ?? null,
      is_active:    row.is_active   as boolean,
      created_at:   row.created_at  as string,
      program_id:   (row.program_id as string | null) ?? null,
      program_code: (row.programs?.code         as string | null) ?? null,
      program_name: (row.programs?.name         as string | null) ?? null,
      school_code:  (row.programs?.schools?.code as string | null) ?? null,
      school_name:  (row.programs?.schools?.name as string | null) ?? null,
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