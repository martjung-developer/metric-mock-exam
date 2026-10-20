// api/auth/callback/route.ts
// Handles Google OAuth redirect and email confirmation link.

import { NextResponse }           from 'next/server'
import { createClient }           from '@/lib/supabase/server'
import { getProfile }             from '@/lib/auth/helpers'
import { getDashboardByRole }     from '@/lib/types/auth'

function readPendingSignup(request: Request) {
  const cookie = request.headers.get('cookie') ?? ''
  const match = cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith('pending_signup='))

  if (!match) { return null }

  try {
    return JSON.parse(decodeURIComponent(match.slice('pending_signup='.length))) as Record<string, unknown>
  } catch {
    return null
  }
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      const pendingSignup = readPendingSignup(request)
      if (pendingSignup) {
        const profileRes = await fetch(`${origin}/api/auth/create-profile`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...pendingSignup,
            userId: data.user.id,
            userEmail: data.user.email,
          }),
        })

        if (!profileRes.ok) {
          console.error('[auth/callback] create-profile failed:', await profileRes.text())
          const failed = NextResponse.redirect(`${origin}/login?error=profile_setup_failed`)
          failed.cookies.delete('pending_signup')
          return failed
        }
      }

      const profile = await getProfile(data.user.id)
      const role    = profile?.role ?? 'student'
      const response = NextResponse.redirect(`${origin}${getDashboardByRole(role)}`)
      response.cookies.delete('pending_signup')
      return response
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
