import { NextResponse, type NextRequest } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/types/database'
import { getProfile } from '@/lib/auth/helpers'
import { validateFacultyId } from '@/lib/utils/auth'
import type { FacultyRoleType } from '@/lib/types/admin/faculty'

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
  fullName: string
  email: string
  facultyId: string
  password: string
  programId: string
  roleType: FacultyRoleType
}

export async function POST(req: NextRequest) {
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

    const body = (await req.json()) as Partial<CreateFacultyBody>

    if (!body.fullName?.trim() || !body.email?.trim()) {
      return NextResponse.json(
        { success: false, error: 'fullName and email are required.' },
        { status: 400 },
      )
    }

    if (!body.facultyId?.trim()) {
      return NextResponse.json(
        { success: false, error: 'facultyId is required.' },
        { status: 400 },
      )
    }

    if (!body.password?.trim() || body.password.trim().length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters.' },
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

    const email = body.email.trim().toLowerCase()
    const fullName = body.fullName.trim()
    const facultyId = body.facultyId.trim().toUpperCase()
    const password = body.password.trim()
    const roleType = body.roleType
    const programId = body.programId

    const idValidationError = validateFacultyId(facultyId)
    if (idValidationError) {
      return NextResponse.json(
        { success: false, error: idValidationError },
        { status: 400 },
      )
    }

    const serviceClient = getServiceRoleClient()

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

    const { data: existingFaculty } = await serviceClient
      .from('faculty')
      .select('id')
      .or(`email.eq.${email},faculty_id.eq.${facultyId}`)
      .maybeSingle()

    if (existingFaculty) {
      return NextResponse.json(
        { success: false, error: 'A faculty account with this email or faculty ID already exists.' },
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

    const { data: authData, error: authError } = await serviceClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, role: 'faculty' },
    })

    if (authError || !authData.user) {
      return NextResponse.json(
        { success: false, error: authError?.message ?? 'Failed to create auth user.' },
        { status: 500 },
      )
    }

    const newUserId = authData.user.id

    const { error: profileError } = await serviceClient
      .from('profiles')
      .upsert({ id: newUserId, email, full_name: fullName, role: 'faculty' })

    if (profileError) {
      await serviceClient.auth.admin.deleteUser(newUserId)
      return NextResponse.json(
        { success: false, error: profileError.message },
        { status: 500 },
      )
    }

    const { error: insertError } = await serviceClient
      .from('faculty')
      .insert({
        faculty_id: facultyId,
        user_id: newUserId,
        email,
        full_name: fullName,
        role_type: roleType,
        program_id: programId,
        school_id: programRow.school_id ?? null,
        is_active: true,
        created_by: user.id,
      })

    if (insertError) {
      await serviceClient.auth.admin.deleteUser(newUserId)
      return NextResponse.json(
        { success: false, error: insertError.message },
        { status: 500 },
      )
    }

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
      success: true,
      faculty_id: facultyId,
      program_code: programRow.code,
      program_name: programRow.name,
      school_code: schoolCode,
      role_type: roleType,
      email,
      full_name: fullName,
      role: 'faculty',
    })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Server error. Please try again.' },
      { status: 500 },
    )
  }
}
