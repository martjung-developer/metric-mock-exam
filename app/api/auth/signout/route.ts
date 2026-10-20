// app/api/auth/signout/route.ts
import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import type { Database } from '@/lib/types/database'

type SupabaseCookie = {
  name: string
  value: string
  options: CookieOptions
}

async function getSupabaseServer() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: SupabaseCookie[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // Route handlers can mutate cookies; ignore if the runtime disallows it.
          }
        },
      },
    },
  )
}

function clearSupabaseCookies(response: NextResponse, cookieNames: string[]): NextResponse {
  const secure = process.env.NODE_ENV === 'production'

  cookieNames.forEach((name) => {
    response.cookies.set({
      name,
      value: '',
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure,
      maxAge: 0,
    })
  })

  return response
}

async function handleSignOut(request: NextRequest): Promise<NextResponse> {
  const cookieStore = await cookies()
  const cookieNames = cookieStore
    .getAll()
    .map(({ name }) => name)
    .filter((name) => name.startsWith('sb-'))

  const supabase = await getSupabaseServer()

  try {
    await supabase.auth.signOut()
  } catch {
    // Best-effort sign-out; cookies still get cleared and the user is redirected.
  }

  const response = NextResponse.redirect(new URL('/login', request.url))
  return clearSupabaseCookies(response, cookieNames)
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  return handleSignOut(request)
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  return handleSignOut(request)
}
