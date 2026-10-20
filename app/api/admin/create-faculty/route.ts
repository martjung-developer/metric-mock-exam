// app/api/admin/create-faculty/route.ts
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

interface CreateFacultyProgramInput {
  programId: string
  isProgramHead?: boolean
}

interface CreateFacultyBody {
  fullName: string
  email: string
  facultyId: string
  password: string
  programs: CreateFacultyProgramInput[]
  roleTypes: FacultyRoleType[]
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

    // ── Multi-program validation ────────────────────────────────────────
    if (!Array.isArray(body.programs) || body.programs.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one program is required.' },
        { status: 400 },
      )
    }

    const programIds = body.programs.map((p) => p.programId).filter(Boolean)
    if (programIds.length !== body.programs.length) {
      return NextResponse.json(
        { success: false, error: 'Invalid program selection.' },
        { status: 400 },
      )
    }
    const uniqueProgramIds = new Set(programIds)
    if (uniqueProgramIds.size !== programIds.length) {
      return NextResponse.json(
        { success: false, error: 'Duplicate programs selected.' },
        { status: 400 },
      )
    }

    if (
      !Array.isArray(body.roleTypes) ||
      body.roleTypes.length === 0 ||
      !body.roleTypes.every((r) => VALID_ROLE_TYPES.has(r))
    ) {
      return NextResponse.json(
        { success: false, error: 'Invalid roleTypes. Provide at least one of: professional, major, minor.' },
        { status: 400 },
      )
    }

    const email = body.email.trim().toLowerCase()
    const fullName = body.fullName.trim()
    const facultyId = body.facultyId.trim().toUpperCase()
    const password = body.password.trim()
    const roleTypes = body.roleTypes
    const programSelections = body.programs

    const idValidationError = validateFacultyId(facultyId)
    if (idValidationError) {
      return NextResponse.json(
        { success: false, error: idValidationError },
        { status: 400 },
      )
    }

    const serviceClient = getServiceRoleClient()

    // ── Fetch and validate all selected programs ────────────────────────
    const { data: programRows, error: programError } = await serviceClient
      .from('programs')
      .select('id, code, name, school_id')
      .in('id', [...uniqueProgramIds])

    if (programError || !programRows || programRows.length !== uniqueProgramIds.size) {
      return NextResponse.json(
        { success: false, error: 'One or more selected programs were not found.' },
        { status: 400 },
      )
    }

    // Enforce: all selected programs must belong to the same school.
    const schoolIds = new Set(programRows.map((p) => p.school_id).filter(Boolean))
    if (schoolIds.size > 1) {
      return NextResponse.json(
        { success: false, error: 'All selected programs must belong to the same school.' },
        { status: 400 },
      )
    }
    const schoolId = programRows[0]?.school_id ?? null

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

    // "Primary" program = the first one in the submitted list — mirrored
    // onto the legacy faculty.program_id / is_program_head columns.
    const primarySelection = programSelections[0]
    const primaryProgram = programRows.find((p) => p.id === primarySelection.programId)

    const { data: insertedFaculty, error: insertError } = await serviceClient
      .from('faculty')
      .insert({
        faculty_id: facultyId,
        user_id: newUserId,
        email,
        full_name: fullName,
        role_types: roleTypes,
        program_id: primaryProgram?.id ?? null,
        school_id: schoolId,
        is_program_head: Boolean(primarySelection.isProgramHead),
        is_active: true,
        created_by: user.id,
      })
      .select('id')
      .single()

    if (insertError || !insertedFaculty) {
      await serviceClient.auth.admin.deleteUser(newUserId)
      return NextResponse.json(
        { success: false, error: insertError?.message ?? 'Failed to create faculty record.' },
        { status: 500 },
      )
    }

    // ── Insert one faculty_programs row per selected program ────────────
    const { error: linksError } = await serviceClient
      .from('faculty_programs')
      .insert(
        programSelections.map((sel) => ({
          faculty_id: insertedFaculty.id,
          program_id: sel.programId,
          is_program_head: Boolean(sel.isProgramHead),
        })),
      )

    if (linksError) {
      // Roll back: faculty row cascade-deletes faculty_programs via FK,
      // but the row itself and the auth user still need cleanup.
      await serviceClient.from('faculty').delete().eq('id', insertedFaculty.id)
      await serviceClient.auth.admin.deleteUser(newUserId)
      return NextResponse.json(
        { success: false, error: linksError.message },
        { status: 500 },
      )
    }

    let schoolCode: string | null = null
    if (schoolId) {
      const { data: schoolRow } = await serviceClient
        .from('schools')
        .select('code')
        .eq('id', schoolId)
        .maybeSingle()
      schoolCode = schoolRow?.code ?? null
    }

    return NextResponse.json({
      success: true,
      faculty_id: facultyId,
      programs: programRows.map((p) => ({
        code: p.code,
        name: p.name,
        is_program_head: Boolean(
          programSelections.find((sel) => sel.programId === p.id)?.isProgramHead,
        ),
      })),
      school_code: schoolCode,
      role_types: roleTypes,
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