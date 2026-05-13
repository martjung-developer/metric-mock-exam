// app/api/admin/faculty/[facultyId]/status/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// PATCH { is_active: boolean }  — toggle a faculty member's active status.
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse, type NextRequest } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient as createServerClient }  from '@/lib/supabase/server'
import type { Database }                        from '@/lib/types/database'
import { getProfile }                           from '@/lib/auth/helpers'

type FacultyUpdate = Database['public']['Tables']['faculty']['Update']

function getServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Missing Supabase service role env vars.')
  }
  return createServiceClient<Database>(url, key, { auth: { persistSession: false } })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ facultyid: string }> },
) {
  try {
    const supabaseSession = await createServerClient()
    const { data: { user }, error: sessionError } = await supabaseSession.auth.getUser()

    if (sessionError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 })
    }

    const profile = await getProfile(user.id)
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: admin role required.' },
        { status: 403 },
      )
    }

    const body = await req.json()
    const isActive = typeof body?.is_active === 'boolean' ? body.is_active : undefined
    if (typeof isActive !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'is_active (boolean) is required.' },
        { status: 400 },
      )
    }

    const serviceClient = getServiceRoleClient()
    const { facultyid: facultyId } = await params

    const updates: FacultyUpdate = {
      is_active: isActive,
      updated_at: new Date().toISOString(),
    }

    const { error } = await serviceClient
      .from('faculty')
      .update(updates)
      .eq('faculty_id', facultyId)

    if (error) {
      console.error('[faculty/status PATCH]', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[faculty/status PATCH] unexpected error:', err)
    return NextResponse.json(
      { success: false, error: 'Server error. Please try again.' },
      { status: 500 },
    )
  }
}
