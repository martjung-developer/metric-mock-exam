// app/api/admin/create-faculty/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// POST {
//   fullName:  string
//   email:     string
//   programId: string   ← UUID from programs table
//   roleType:  'professional' | 'major' | 'minor'
// }
//
// Actual faculty schema (verified against DB):
//   faculty.program_id → programs.id  (FK, no `department` text column)
//   faculty.role_type  → text CHECK constraint
//
// Flow: verify admin → validate body → check email uniqueness →
//       build faculty_id → create auth user → upsert profile → insert faculty
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse, type NextRequest } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient as createServerClient }  from '@/lib/supabase/server'
import type { Database }                        from '@/lib/types/database'
import { getProfile }                           from '@/lib/auth/helpers'
import { buildCreateFacultyPayload }            from '@/lib/utils/auth/generateStaffId'
import { validateFacultyId }                    from '@/lib/utils/auth'
import type { FacultyRoleType }                 from '@/lib/types/admin/faculty'

const VALID_ROLE_TYPES = new Set<FacultyRoleType>(['professional', 'major', 'minor'])

function getServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Missing Supabase service role env vars.')
  }
  return createServiceClient<Database>(url, key, { auth: { persistSession: false } })
}

interface CreateFacultyBody {
  fullName:  string
  email:     string
  programId: string        
  roleType:  FacultyRoleType
}

export async function POST(req: NextRequest) {
  try {
    // ── 1. Auth check ─────────────────────────────────────────────────────
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

    // ── 2. Validate body ──────────────────────────────────────────────────
    const body = (await req.json()) as Partial<CreateFacultyBody>

    if (!body.fullName?.trim() || !body.email?.trim()) {
      return NextResponse.json(
        { success: false, error: 'fullName and email are required.' },
        { status: 400 },
      )
    }

    if (!body.programId) {
      return NextResponse.json(
        { success: false, error: 'programId is required.' },
        { status: 400 },
      )
    }

    if (!body.roleType || !VALID_ROLE_TYPES.has(body.roleType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid roleType. Must be professional | major | minor.' },
        { status: 400 },
      )
    }

    const email    = body.email.trim().toLowerCase()
    const fullName = body.fullName.trim()
    const roleType = body.roleType
    const programId = body.programId

    const serviceClient = getServiceRoleClient()

    // ── 3. Verify programId exists ────────────────────────────────────────
    const { data: programRow, error: programError } = await serviceClient
      .from('programs')
      .select('id, code, name, school_id')
      .eq('id', programId)
      .single()

    if (programError || !programRow) {
      return NextResponse.json(
        { success: false, error: 'Program not found.' },
        { status: 400 },
      )
    }

    // ── 4. Get admin_id for faculty ID prefix generation ──────────────────
    const { data: adminRow, error: adminLookupError } = await serviceClient
      .from('admins')
      .select('admin_id')
      .eq('id', user.id)
      .single()

    if (adminLookupError || !adminRow?.admin_id) {
      console.error('[create-faculty] admin row not found for user', user.id)
      return NextResponse.json(
        { success: false, error: 'Admin record not found.' },
        { status: 404 },
      )
    }

    // ── 5. Email uniqueness checks ────────────────────────────────────────
    const { data: existingFaculty } = await serviceClient
      .from('faculty')
      .select('email')
      .eq('email', email)
      .maybeSingle()

    if (existingFaculty) {
      return NextResponse.json(
        { success: false, error: 'A faculty account with this email already exists.' },
        { status: 409 },
      )
    }

    const { data: existingProfile } = await serviceClient
      .from('profiles')
      .select('email')
      .eq('email', email)
      .maybeSingle()

    if (existingProfile) {
      return NextResponse.json(
        { success: false, error: 'An account with this email already exists.' },
        { status: 409 },
      )
    }

    // ── 6. Generate faculty ID ────────────────────────────────────────────
    const payload = await buildCreateFacultyPayload(
      adminRow.admin_id,
      fullName,
      email,
      serviceClient,
    )

    const idValidationError = validateFacultyId(payload.faculty_id)
    if (idValidationError) {
      console.error('[create-faculty] invalid faculty ID:', payload.faculty_id)
      return NextResponse.json(
        { success: false, error: `ID generation error: ${idValidationError}` },
        { status: 500 },
      )
    }

    // ── 7. Create auth user ───────────────────────────────────────────────
    const tempPassword = `Fac!${Math.random().toString(36).slice(2, 10)}`

    const { data: authData, error: authError } = await serviceClient.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name: fullName, role: 'faculty' },
    })

    if (authError || !authData.user) {
      console.error('[create-faculty] auth user creation failed:', authError)
      return NextResponse.json(
        { success: false, error: authError?.message ?? 'Failed to create auth user.' },
        { status: 500 },
      )
    }

    const newUserId = authData.user.id

    // ── 8. Upsert profile ─────────────────────────────────────────────────
    const { error: profileError } = await serviceClient
      .from('profiles')
      .upsert({ id: newUserId, email, full_name: fullName, role: 'faculty' })

    if (profileError) {
      await serviceClient.auth.admin.deleteUser(newUserId)
      console.error('[create-faculty] profiles upsert failed:', profileError)
      return NextResponse.json(
        { success: false, error: profileError.message },
        { status: 500 },
      )
    }

    // ── 9. Insert faculty row (program_id FK, no department column) ───────
    const { error: insertError } = await serviceClient
      .from('faculty')
      .insert({
        faculty_id: payload.faculty_id,
        user_id:    newUserId,
        email,
        full_name:  fullName,
        role_type:  roleType,
        program_id: programId,       // ← FK to programs.id
        is_active:  true,
        created_by: user.id,
      })

    if (insertError) {
      await serviceClient.auth.admin.deleteUser(newUserId)
      console.error('[create-faculty] faculty insert failed:', insertError)
      return NextResponse.json(
        { success: false, error: insertError.message },
        { status: 500 },
      )
    }

    // ── 10. Return success ────────────────────────────────────────────────
    let schoolCode: string | null = null
    if (programRow.school_id) {
      const { data: schoolRow } = await serviceClient
        .from('schools')
        .select('code')
        .eq('id', programRow.school_id)
        .maybeSingle()
      schoolCode = schoolRow?.code ?? null
    }

    return NextResponse.json({
      success:      true,
      faculty_id:   payload.faculty_id,
      program_code: programRow.code,
      program_name: programRow.name,
      school_code:  schoolCode,
      role_type:    roleType,
      email,
      full_name:    fullName,
      role:         'faculty',
    })

  } catch (err) {
    console.error('[create-faculty] unexpected error:', err)
    return NextResponse.json(
      { success: false, error: 'Server error. Please try again.' },
      { status: 500 },
    )
  }
}
