import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/types/database'
import type { NextRequest } from 'next/server'

type StudentInsert = Database['public']['Tables']['students']['Insert']
type ProfileInsert = Database['public']['Tables']['profiles']['Insert']

type CreateProfileBody = {
  userId: string
  userEmail?: string
  studentId: string
  fullName: string
  programId: string
  programCode?: string
  schoolId?: string | null
  yearLevel: number
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body.' }, { status: 400 })
  }

  if (
    typeof body !== 'object' ||
    body === null ||
    typeof (body as Record<string, unknown>).userId !== 'string' ||
    typeof (body as Record<string, unknown>).studentId !== 'string' ||
    typeof (body as Record<string, unknown>).fullName !== 'string' ||
    typeof (body as Record<string, unknown>).programId !== 'string' ||
    typeof (body as Record<string, unknown>).yearLevel !== 'number'
  ) {
    return NextResponse.json(
      { success: false, error: 'Missing or invalid required fields.' },
      { status: 422 },
    )
  }

  const {
    userId,
    userEmail,
    studentId,
    fullName,
    programId,
    schoolId,
    yearLevel,
  } = body as CreateProfileBody

  if (!Number.isInteger(yearLevel) || yearLevel < 1 || yearLevel > 5) {
    return NextResponse.json(
      { success: false, error: 'Invalid year level.' },
      { status: 422 },
    )
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY
  if (!serviceKey) {
    console.error('[create-profile] SUPABASE_SERVICE_ROLE_KEY is not set.')
    return NextResponse.json(
      { success: false, error: 'Server configuration error.' },
      { status: 500 },
    )
  }

  const cookieStore = await cookies()
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '',
    serviceKey,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    },
  )

  const { data: authUserData, error: authUserErr } = await supabase.auth.admin.getUserById(userId)
  if (authUserErr || !authUserData.user) {
    console.error('[create-profile] getUserById error:', authUserErr?.message)
    return NextResponse.json({ success: false, error: 'Could not fetch user.' }, { status: 500 })
  }

  const { data: programRow, error: programErr } = await supabase
    .from('programs')
    .select('id, school_id')
    .eq('id', programId)
    .maybeSingle()

  if (programErr || !programRow?.id) {
    return NextResponse.json(
      { success: false, error: 'Selected program is invalid.' },
      { status: 422 },
    )
  }

  const profileInsert: ProfileInsert = {
    id: userId,
    email: authUserData.user.email ?? userEmail ?? '',
    full_name: fullName.trim(),
    role: 'student',
  }

  try {
    const { data: existingProfile, error: profileCheckErr } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle()

    if (profileCheckErr) { throw profileCheckErr }

    if (!existingProfile) {
      const { error: profileInsertErr } = await supabase
        .from('profiles')
        .insert(profileInsert)

      if (profileInsertErr) { throw profileInsertErr }
    }
  } catch (profileErr) {
    const err = profileErr as { code?: string; message?: string }
    console.error('[create-profile] profile insert error:', err.code, err.message)
    return NextResponse.json(
      { success: false, error: err.message ?? 'Profile setup failed.' },
      { status: 500 },
    )
  }

  const studentInsert: StudentInsert = {
    id: userId,
    user_id: userId,
    student_id: studentId,
    year_level: Number(yearLevel),
    program_id: programRow.id,
    school_id: schoolId ?? programRow.school_id ?? null,
  }

  try {
    const { error: insertErr } = await supabase
      .from('students')
      .insert(studentInsert)

    if (insertErr) { throw insertErr }
  } catch (studentErr) {
    const err = studentErr as { code?: string; message?: string }
    console.error('[create-profile] students upsert error:', err.code, err.message)
    return NextResponse.json(
      { success: false, error: 'Account created but profile setup failed. Please contact support.' },
      { status: 500 },
    )
  }

  return NextResponse.json({ success: true })
}
