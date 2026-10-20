// proxy.ts
import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient }            from '@supabase/ssr'
import type { CookieOptions }            from '@supabase/ssr'
import type { Database }                 from '@/lib/types/database'

type Role = Database['public']['Enums']['user_role']

type Scope = {
  role:      Role
  schoolId:  string | null
  programId: string | null
}

type ScopeCachePayload = {
  u:   string
  r:   Role
  s:   string | null
  p:   string | null
  exp: number
}

type SupabaseCookie = {
  name: string
  value: string
  options: CookieOptions
}

const SCOPE_REQUIRED_PREFIXES = ['/student', '/faculty']
const SCOPE_COOKIE            = 'vp_scope'
const SCOPE_TTL_SECONDS       = process.env.NODE_ENV === 'production' ? 60 : 600
const DEV_BYPASS_AUTH         = process.env.NODE_ENV !== 'production' && process.env.DEV_BYPASS_AUTH === 'true'
const DISABLE_PROXY           = process.env.DISABLE_PROXY === 'true'

const STATIC_PREFIXES    = ['/_next/static', '/_next/image', '/_next/webpack', '/icons/']
const STATIC_EXTENSIONS  = ['.png', '.jpg', '.jpeg', '.svg', '.ico', '.webp', '.woff', '.woff2']

function shouldSkip(pathname: string): boolean {
  if (pathname === '/favicon.ico') { return true }
  if (STATIC_PREFIXES.some((p) => pathname.startsWith(p))) { return true }
  const lower = pathname.toLowerCase()
  return STATIC_EXTENSIONS.some((ext) => lower.endsWith(ext))
}

// ── Crypto helpers (unchanged) ────────────────────────────────────────────────

function getSecret(): string {
  return (
    process.env.SCOPE_CACHE_SECRET ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    'fallback-secret'
  )
}

function b64url(s: string): string {
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromb64url(s: string): string {
  const b = s.replace(/-/g, '+').replace(/_/g, '/')
  return atob(b + '='.repeat((4 - (b.length % 4)) % 4))
}

async function hmac(data: string, secret: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data))
  return b64url(String.fromCharCode(...new Uint8Array(sig)))
}

async function encodeCache(payload: ScopeCachePayload): Promise<string> {
  const data = b64url(JSON.stringify(payload))
  const sig  = await hmac(data, getSecret())
  return `${data}.${sig}`
}

async function decodeCache(raw: string, userId: string): Promise<Scope | null> {
  const parts = raw.split('.')
  if (parts.length !== 2) { return null }
  const [data, sig] = parts
  if (sig !== await hmac(data, getSecret())) { return null }

  let p: ScopeCachePayload
  try {
    p = JSON.parse(fromb64url(data)) as ScopeCachePayload
  } catch {
    return null
  }

  if (p.u !== userId)                        { return null }
  if (p.exp <= Math.floor(Date.now() / 1000)) { return null }

  return { role: p.r, schoolId: p.s, programId: p.p }
}

// ── Scope resolution (unchanged) ─────────────────────────────────────────────

async function resolveScope(
  request: NextRequest,
): Promise<{ scope: Scope | null; userId: string | null; fresh: boolean; cookiesToSet: SupabaseCookie[] }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const cookiesToSet: SupabaseCookie[] = []
  if (!url || !key) { return { scope: null, userId: null, fresh: false, cookiesToSet } }

  const supabase = createServerClient<Database>(url, key, {
    cookieOptions: {
      name: 'metric-auth',
    },
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToRefresh: SupabaseCookie[]) => {
        cookiesToRefresh.forEach(({ name, value }) => {
          request.cookies.set(name, value)
        })
        cookiesToSet.push(...cookiesToRefresh)
      },
    },
  })

  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) {
      return { scope: null, userId: null, fresh: false, cookiesToSet }
    }

    const cachedRaw = request.cookies.get(SCOPE_COOKIE)?.value
    if (cachedRaw) {
      const cached = await decodeCache(cachedRaw, user.id)
      if (cached) { return { scope: cached, userId: user.id, fresh: false, cookiesToSet } }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single() as { data: { role: Role } | null }

    if (!profile) { return { scope: null, userId: user.id, fresh: true, cookiesToSet } }

    let schoolId:  string | null = null
    let programId: string | null = null

    if (profile.role === 'student') {
      const { data } = await supabase
        .from('students')
        .select('school_id, program_id')
        .eq('id', user.id)
        .maybeSingle() as { data: { school_id: string | null; program_id: string | null } | null }
      schoolId  = data?.school_id  ?? null
      programId = data?.program_id ?? null
    } else if (profile.role === 'faculty') {
      const { data } = await supabase
        .from('faculty')
        .select('school_id, program_id')
        .eq('user_id', user.id)
        .maybeSingle() as { data: { school_id: string | null; program_id: string | null } | null }
      schoolId  = data?.school_id  ?? null
      programId = data?.program_id ?? null
    } else {
      const { data } = await supabase
        .from('admins')
        .select('school_id')
        .eq('user_id', user.id)
        .maybeSingle() as { data: { school_id: string | null } | null }
      schoolId = data?.school_id ?? null
    }

    return { scope: { role: profile.role, schoolId, programId }, userId: user.id, fresh: true, cookiesToSet }
  } catch {
    return { scope: null, userId: null, fresh: false, cookiesToSet }
  }
}

// ── Cache writer (unchanged) ──────────────────────────────────────────────────

async function withScopeCache(
  response:   NextResponse,
  userId:     string | null,
  scope:      Scope | null,
  fresh:      boolean,
  clearCache: boolean,
  cookiesToSet: SupabaseCookie[],
): Promise<NextResponse> {
  const secure = process.env.NODE_ENV === 'production'
  const base   = { path: '/', httpOnly: true, sameSite: 'lax' as const, secure }

  if (clearCache || !scope || !userId) {
    response.cookies.set({ name: SCOPE_COOKIE, value: '', maxAge: 0, ...base })
    cookiesToSet.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options)
    })
    return response
  }

  if (fresh) {
    const payload: ScopeCachePayload = {
      u:   userId,
      r:   scope.role,
      s:   scope.schoolId,
      p:   scope.programId,
      exp: Math.floor(Date.now() / 1000) + SCOPE_TTL_SECONDS,
    }
    const encoded = await encodeCache(payload)
    response.cookies.set({ name: SCOPE_COOKIE, value: encoded, maxAge: SCOPE_TTL_SECONDS, ...base })
  }

  cookiesToSet.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options)
  })

  return response
}

// ── Redirect helper — FIX: preserve `next` param on role mismatch ─────────────

function redirectToLogin(request: NextRequest, next?: string): NextResponse {
  const loginUrl = new URL('/login', request.url)
  const dest     = next ?? `${request.nextUrl.pathname}${request.nextUrl.search}`
  loginUrl.searchParams.set('next', dest)
  return NextResponse.redirect(loginUrl)
}

// ── Main proxy ────────────────────────────────────────────────────────────────

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname, search } = request.nextUrl

  if (DISABLE_PROXY)    { return NextResponse.next() }
  if (DEV_BYPASS_AUTH)  { return NextResponse.next() }
  if (shouldSkip(pathname)) { return NextResponse.next() }

  const { scope, userId, fresh, cookiesToSet } = await resolveScope(request)

  // ── Not authenticated ─────────────────────────────────────────────────────
  if (!scope) {
    const res = redirectToLogin(request, `${pathname}${search}`)
    return withScopeCache(res, userId, null, false, true, cookiesToSet)
  }

  // ── Role guards — now preserve ?next= ─────────────────────────────────────
  if (pathname.startsWith('/student') && scope.role !== 'student') {
    const res = redirectToLogin(request)
    return withScopeCache(res, userId, scope, fresh, false, cookiesToSet)
  }

  if (pathname.startsWith('/faculty') && scope.role !== 'faculty') {
    const res = redirectToLogin(request)
    return withScopeCache(res, userId, scope, fresh, false, cookiesToSet)
  }

  if (pathname.startsWith('/admin') && scope.role === 'student') {
    const res = redirectToLogin(request)
    return withScopeCache(res, userId, scope, fresh, false, cookiesToSet)
  }

  if (scope.role === 'faculty' && pathname.startsWith('/admin')) {
    const blocked = ['/admin/programs', '/admin/analytics', '/admin/faculty']
    if (blocked.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
      const res = redirectToLogin(request)
      return withScopeCache(res, userId, scope, fresh, false, cookiesToSet)
    }
  }

  // ── Scope completeness ────────────────────────────────────────────────────
  const requiresScope = SCOPE_REQUIRED_PREFIXES.some((p) => pathname.startsWith(p))
  if (requiresScope && (!scope.schoolId || !scope.programId)) {
    // Send to onboarding rather than login — user is authenticated, just incomplete
    const onboardUrl = new URL('/onboarding', request.url)
    onboardUrl.searchParams.set('next', `${pathname}${search}`)
    const res = NextResponse.redirect(onboardUrl)
    return withScopeCache(res, userId, scope, fresh, false, cookiesToSet)
  }

  return withScopeCache(NextResponse.next(), userId, scope, fresh, false, cookiesToSet)
}

export const config = {
  matcher: ['/admin/:path*', '/student/:path*', '/faculty/:path*'],
}
