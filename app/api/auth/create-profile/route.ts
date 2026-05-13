// app/api/auth/create-profile/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// Called by signUpStudent (client) after supabase.auth.signUp succeeds.
// Inserts the student row into `students` using the service-role key so it
// bypasses RLS safely. All columns are strictly typed from Database.
// ─────────────────────────────────────────────────────────────────────────────
import { NextResponse }      from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies }            from 'next/headers'
import type { Database }      from '@/lib/types/database'
import type { NextRequest }   from 'next/server'

// Only the columns we write — avoids select("*") and unsafe shapes
type StudentInsert = Database['public']['Tables']['students']['Insert']

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body.' }, { status: 400 })
  }

  // ── Validate payload shape ────────────────────────────────────────────────
  if (
    typeof body !== 'object' ||
    body === null ||
    typeof (body as Record<string, unknown>).studentId   !== 'string' ||
    typeof (body as Record<string, unknown>).fullName    !== 'string' ||
    typeof (body as Record<string, unknown>).programCode !== 'string' ||
    typeof (body as Record<string, unknown>).yearLevel   !== 'string'
  ) {
    return NextResponse.json(
      { success: false, error: 'Missing or invalid required fields.' },
      { status: 422 },
    )
  }

  const {
    studentId,
    fullName,
    programCode,
    yearLevel,
    phone,
  } = body as {
    studentId:   string
    fullName:    string
    programCode: string
    yearLevel:   string
    phone?:      string
  }

  const yearLevelNum = Number(yearLevel)
  if (!Number.isInteger(yearLevelNum) || yearLevelNum < 1 || yearLevelNum > 5) {
    return NextResponse.json(
      { success: false, error: 'Invalid year level.' },
      { status: 422 },
    )
  }

  // ── Service-role client (bypasses RLS) ───────────────────────────────────
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    console.error('[create-profile] SUPABASE_SERVICE_ROLE_KEY is not set.')
    return NextResponse.json(
      { success: false, error: 'Server configuration error.' },
      { status: 500 },
    )
  }

  const cookieStore = await cookies()
  const supabase    = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    serviceKey,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    },
  )

  // ── Fetch the auth user whose metadata contains this student_id ──────────
  // The signup request just completed, so the user exists in auth.users.
  // We find them by student_id stored in raw_user_meta_data.
  const { data: usersPage, error: listErr } = await supabase.auth.admin.listUsers()
  if (listErr) {
    console.error('[create-profile] listUsers error:', listErr.message)
    return NextResponse.json({ success: false, error: 'Could not fetch user.' }, { status: 500 })
  }

  const authUser = usersPage.users.find(
    (u) => (u.user_metadata as Record<string, unknown>)['student_id'] === studentId,
  )

  if (!authUser) {
    return NextResponse.json(
      { success: false, error: 'Auth user not found for given student ID.' },
      { status: 404 },
    )
  }

  // ── Upsert student row ───────────────────────────────────────────────────
  const insert: StudentInsert = {
    id:           authUser.id,
    student_id:   studentId,
    full_name:    fullName.trim(),
    program_code: programCode,
    year_level:   yearLevelNum,
    phone:        phone?.trim() ?? null,
    // school_id and program_id resolved separately during onboarding
  }

  const { error: upsertErr } = await supabase
    .from('students')
    .upsert(insert, { onConflict: 'id' })

  if (upsertErr) {
    console.error('[create-profile] upsert error:', upsertErr.message)
    return NextResponse.json(
      { success: false, error: upsertErr.message },
      { status: 500 },
    )
  }

  return NextResponse.json({ success: true })
}

