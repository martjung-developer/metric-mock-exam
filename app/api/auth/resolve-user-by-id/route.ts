import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'
import { normaliseId } from '@/lib/utils/auth'
import type { ResolveUserResult } from '@/lib/types/auth/'

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY
  if (!url || !key) {
    throw new Error('Missing Supabase service role env vars.')
  }
  return createClient<Database>(url, key, { auth: { persistSession: false } })
}

interface StudentLookup { id: string }
interface FacultyLookup { user_id: string | null; is_active: boolean }
interface AdminLookup { user_id: string | null }

export async function POST(req: NextRequest): Promise<NextResponse<ResolveUserResult>> {
  try {
    const body = (await req.json()) as Record<string, unknown>
    const rawId = typeof body.id === 'string' ? body.id : ''

    if (!rawId) {
      return NextResponse.json({ found: false, error: 'ID is required.' }, { status: 400 })
    }

    const id = normaliseId(rawId)
    const supabase = getServiceClient()

    const [studentResult, facultyResult, adminResult] = await Promise.all([
      supabase
        .from('students')
        .select('id')
        .eq('student_id', id)
        .maybeSingle()
        .overrideTypes<StudentLookup, { merge: false }>(),
      supabase
        .from('faculty')
        .select('user_id, is_active')
        .eq('faculty_id', id)
        .maybeSingle()
        .overrideTypes<FacultyLookup, { merge: false }>(),
      supabase
        .from('admins')
        .select('user_id')
        .eq('admin_id', id)
        .maybeSingle()
        .overrideTypes<AdminLookup, { merge: false }>(),
    ])

    const student = studentResult.data
    const faculty = facultyResult.data
    const admin = adminResult.data

    let userId: string | null = null
    if (student?.id) {
      userId = student.id
    } else if (faculty?.user_id && faculty.is_active) {
      userId = faculty.user_id
    } else if (admin?.user_id) {
      userId = admin.user_id
    }

    // Fallback path for student IDs:
    // If the students row is missing (e.g., profile-sync race/non-fatal signup insert),
    // resolve directly from auth user metadata so login can still proceed.
    if (!userId) {
      const isStudentId = /^\d{2}-\d{4}-\d{3}$/.test(id)
      if (isStudentId) {
        const { data: usersPage, error: listErr } = await supabase.auth.admin.listUsers()
        if (!listErr) {
          const authUser = usersPage.users.find((u) => {
            const meta = (u.user_metadata ?? {}) as Record<string, unknown>
            return typeof meta.student_id === 'string' && normaliseId(meta.student_id) === id
          })
          if (authUser?.id) {
            userId = authUser.id
          }
        } else {
          console.error('[resolve-user-by-id] listUsers fallback error:', listErr.message)
        }
      }
    }

    if (!userId) {
      return NextResponse.json({ found: false, error: 'ID not found.' }, { status: 404 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email, role')
      .eq('id', userId)
      .single()

    if (profileError || !profile?.email) {
      return NextResponse.json(
        { found: false, error: 'Account profile not found for this ID.' },
        { status: 404 },
      )
    }

    return NextResponse.json({ found: true, email: profile.email, role: profile.role })
  } catch (err) {
    console.error('[resolve-user-by-id] Unexpected error:', err)
    return NextResponse.json(
      { found: false, error: 'Server error. Please try again.' },
      { status: 500 },
    )
  }
}
