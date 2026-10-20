// app/api/admin/faculty/[facultyid]/route.ts
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'
import { getProfile } from '@/lib/auth/helpers'
import type { FacultyRoleType } from '@/lib/types/admin/faculty'

const VALID_ROLE_TYPES = new Set<FacultyRoleType>(['professional', 'major', 'minor'])

function getServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) { throw new Error('Missing Supabase service role env vars.') }
  return createServiceClient<Database>(url, key, { auth: { persistSession: false } })
}

async function ensureAdmin() {
  const supabaseSession = await createServerClient()
  const { data: { user }, error } = await supabaseSession.auth.getUser()
  if (error || !user) { return { ok: false as const, status: 401, message: 'Unauthorized.' } }
  const profile = await getProfile(user.id)
  if (!profile || profile.role !== 'admin') {
    return { ok: false as const, status: 403, message: 'Forbidden: admin role required.' }
  }
  return { ok: true as const, userId: user.id }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ facultyid: string }> }) {
  const auth = await ensureAdmin()
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.message }, { status: auth.status })
  }

  const { facultyid } = await params
  const body = await req.json().catch(() => null) as {
    full_name?: string
    role_types?: FacultyRoleType[]
    // CHANGED: full desired program set (add/remove + head flag),
    // replacing the old head-only `program_heads` diff.
    programs?: { program_id: string; is_program_head: boolean }[]
  } | null

  if (!body) {
    return NextResponse.json({ success: false, error: 'Invalid request body.' }, { status: 400 })
  }

  const client = getServiceRoleClient()

  const { data: facultyRow, error: lookupError } = await client
    .from('faculty')
    .select('id')
    .eq('faculty_id', facultyid)
    .maybeSingle()

  if (lookupError || !facultyRow) {
    return NextResponse.json({ success: false, error: 'Faculty member not found.' }, { status: 404 })
  }

  const updatePayload: Database['public']['Tables']['faculty']['Update'] = {
    updated_at: new Date().toISOString(),
  }
  if (typeof body.full_name === 'string') {
    if (!body.full_name.trim()) {
      return NextResponse.json({ success: false, error: 'full_name cannot be empty.' }, { status: 400 })
    }
    updatePayload.full_name = body.full_name.trim()
  }
  if (Array.isArray(body.role_types)) {
    const cleaned = body.role_types.filter((r): r is FacultyRoleType => VALID_ROLE_TYPES.has(r))
    if (cleaned.length === 0) {
      return NextResponse.json({ success: false, error: 'At least one valid role type is required.' }, { status: 400 })
    }
    updatePayload.role_types = cleaned
  }

  // ── Full program set replacement (add / remove / head flag) ────────────
  if (Array.isArray(body.programs)) {
    if (body.programs.length === 0) {
      return NextResponse.json({ success: false, error: 'At least one program is required.' }, { status: 400 })
    }

    const programIds = body.programs.map((p) => p.program_id).filter(Boolean)
    if (programIds.length !== body.programs.length) {
      return NextResponse.json({ success: false, error: 'Invalid program selection.' }, { status: 400 })
    }
    const uniqueProgramIds = new Set(programIds)
    if (uniqueProgramIds.size !== programIds.length) {
      return NextResponse.json({ success: false, error: 'Duplicate programs selected.' }, { status: 400 })
    }

    // Validate all selected programs exist and belong to a single school.
    const { data: programRows, error: programError } = await client
      .from('programs')
      .select('id, school_id')
      .in('id', [...uniqueProgramIds])

    if (programError || !programRows || programRows.length !== uniqueProgramIds.size) {
      return NextResponse.json(
        { success: false, error: 'One or more selected programs were not found.' },
        { status: 400 },
      )
    }
    const schoolIds = new Set(programRows.map((p) => p.school_id).filter(Boolean))
    if (schoolIds.size > 1) {
      return NextResponse.json(
        { success: false, error: 'All selected programs must belong to the same school.' },
        { status: 400 },
      )
    }
    const schoolId = programRows[0]?.school_id ?? null

    // Diff against existing links: delete dropped programs, upsert the rest.
    const { data: existingLinks, error: existingError } = await client
      .from('faculty_programs')
      .select('program_id')
      .eq('faculty_id', facultyRow.id)

    if (existingError) {
      return NextResponse.json({ success: false, error: existingError.message }, { status: 500 })
    }

    const existingIds = new Set((existingLinks ?? []).map((l) => l.program_id))
    const nextIds = new Set(programIds)
    const toRemove = [...existingIds].filter((id) => !nextIds.has(id))

    if (toRemove.length > 0) {
      const { error: removeError } = await client
        .from('faculty_programs')
        .delete()
        .eq('faculty_id', facultyRow.id)
        .in('program_id', toRemove)

      if (removeError) {
        return NextResponse.json({ success: false, error: removeError.message }, { status: 500 })
      }
    }

    // Requires a unique constraint on faculty_programs (faculty_id, program_id).
    const { error: upsertError } = await client
      .from('faculty_programs')
      .upsert(
        body.programs.map((p) => ({
          faculty_id: facultyRow.id,
          program_id: p.program_id,
          is_program_head: Boolean(p.is_program_head),
        })),
        { onConflict: 'faculty_id,program_id' },
      )

    if (upsertError) {
      return NextResponse.json({ success: false, error: upsertError.message }, { status: 500 })
    }

    // Sync legacy mirror columns (program_id / is_program_head / school_id)
    // to the first program in the submitted list, matching create-faculty's
    // "primary = first selected" convention.
    const primarySelection = body.programs[0]
    updatePayload.program_id = primarySelection.program_id
    updatePayload.is_program_head = Boolean(primarySelection.is_program_head)
    updatePayload.school_id = schoolId
  }

  const { error } = await client.from('faculty').update(updatePayload).eq('faculty_id', facultyid)
  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ facultyid: string }> }) {
  const auth = await ensureAdmin()
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.message }, { status: auth.status })
  }
  const { facultyid } = await params
  const client = getServiceRoleClient()
  // faculty_programs rows cascade-delete via the FK's `on delete cascade`
  const { error } = await client.from('faculty').delete().eq('faculty_id', facultyid)
  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}