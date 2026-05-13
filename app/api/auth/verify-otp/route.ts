// app/api/auth/verify-otp/route.ts
import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { ROLE_DASHBOARDS } from '@/lib/types/auth/'
import type { VerifyOtpResult, UserRole } from '@/lib/types/auth/'

async function getSupabaseServer() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => {
          try {
            toSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    },
  )
}

function resolveRole(rawRole: unknown): UserRole {
  if (rawRole === 'admin') {return 'admin'}
  if (rawRole === 'faculty') {return 'faculty'}
  return 'student'
}

export async function POST(req: NextRequest): Promise<NextResponse<VerifyOtpResult>> {
  try {
    const body = await req.json()

    if (typeof body.email !== 'string' || typeof body.token !== 'string') {
      return NextResponse.json(
        { verified: false, error: 'Email and code are required.' },
        { status: 400 }
      )
    }

    const email = body.email.trim().toLowerCase()
    const token = body.token.trim()

    const supabase = await getSupabaseServer()

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    })

    if (error) {
      console.error('[verify-otp] error:', error.message)
      return NextResponse.json(
        { verified: false, error: mapOtpError(error.message) },
        { status: 400 }
      )
    }

    const role = resolveRole(data.user?.user_metadata?.role)

    return NextResponse.json({
      verified: true,
      redirectTo: ROLE_DASHBOARDS[role],
    })

  } catch (err) {
    console.error('[verify-otp] unexpected:', err)
    return NextResponse.json(
      { verified: false, error: 'Server error.' },
      { status: 500 }
    )
  }
}

function mapOtpError(message: string): string {
  const lower = message.toLowerCase()
  if (lower.includes('expired')) {return 'Code expired. Please request a new one.'}
  if (lower.includes('invalid') || lower.includes('not found')) {return 'Invalid code.'}
  if (lower.includes('too many')) {return 'Too many attempts. Try again later.'}
  return 'Verification failed.'
}

