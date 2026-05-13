// app/api/auth/send-otp/route.ts
import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { SendOtpResult } from '@/lib/types/auth/'

const DEV_BYPASS_RATE_LIMIT =
  process.env.NODE_ENV !== 'production' &&
  process.env.DEV_BYPASS_RATE_LIMIT === 'true'

async function getSupabaseServer() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {}, // no-op
      },
    },
  )
}

export async function POST(req: NextRequest): Promise<NextResponse<SendOtpResult>> {
  if (DEV_BYPASS_RATE_LIMIT) {
    return NextResponse.json({ sent: true })
  }

  try {
    const body = await req.json()

    if (typeof body.email !== 'string' || !body.email.trim()) {
      return NextResponse.json(
        { sent: false, error: 'Email is required.' },
        { status: 400 }
      )
    }

    const email = body.email.trim().toLowerCase()
    const supabase = await getSupabaseServer()

    const { error } = await supabase.auth.signInWithOtp({
      email,
    })

    if (error) {
      const lower = error.message.toLowerCase()
      if (
        process.env.NODE_ENV !== 'production' &&
        (lower.includes('rate limit') || lower.includes('too many'))
      ) {
        // Dev convenience: don't block iteration when auth provider throttles OTP sends.
        return NextResponse.json({ sent: true })
      }
      console.error('[send-otp] error:', error.message)
      return NextResponse.json(
        { sent: false, error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ sent: true })

  } catch (err) {
    console.error('[send-otp] unexpected:', err)
    return NextResponse.json(
      { sent: false, error: 'Server error.' },
      { status: 500 }
    )
  }
}


