// proxy.ts
import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/lib/types/database'

type Role = Database['public']['Enums']['user_role']

type Scope = {
  role: Role
  schoolId: string | null
  programId: string | null
}

// ── Cache payload stored in the signed cookie ─────────────────────────────────
type ScopeCachePayload = {
  u: string        // user id
  r: Role          // role
  s: string | null // school_id
  p: string | null // program_id
  exp: number      // unix expiry
}

const SCOPE_REQUIRED_PREFIXES = ['/student', '/faculty']
const SCOPE_COOKIE            = 'vp_scope'
const SCOPE_TTL_SECONDS       = process.env.NODE_ENV === 'production' ? 60 : 600
const DEV_BYPASS_AUTH         = process.env.NODE_ENV !== 'production' && process.env.DEV_BYPASS_AUTH === 'true'

// ── Symposium bypass: set DISABLE_PROXY=true in your .env to skip all auth ───
const DISABLE_PROXY = process.env.DISABLE_PROXY === 'true'

// ── Static asset fast-path ────────────────────────────────────────────────────
const STATIC_PREFIXES = [
  '/_next/static',
  '/_next/image',
  '/_next/webpack',
  '/icons/',
]

const STATIC_EXTENSIONS = [
  '.png', '.jpg', '.jpeg', '.svg',
  '.ico', '.webp', '.woff', '.woff2',
]

function shouldSkip(pathname: string): boolean {
  if (pathname === '/favicon.ico') {
    return true
  }
  if (STATIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return true
  }
  const lower = pathname.toLowerCase()
  return STATIC_EXTENSIONS.some((ext) => lower.endsWith(ext))
}

// ── Signed cookie helpers (Web Crypto — edge-compatible) ──────────────────────
function getSecret(): string {
  return (
    process.env.SCOPE_CACHE_SECRET ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    'fallback-secret'
  )
}

function b64url(s: string) { return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') }
function fromb64url(s: string) {
  const b = s.replace(/-/g, '+').replace(/_/g, '/')
  return atob(b + '='.repeat((4 - b.length % 4) % 4))
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
  if (parts.length !== 2) {
    return null
  }
  const [data, sig] = parts
  if (sig !== await hmac(data, getSecret())) {
    return null // tampered
  }

  let p: ScopeCachePayload
  try {
    p = JSON.parse(fromb64url(data))
  } catch {
    return null
  }

  if (p.u !== userId) {
    return null // wrong user
  }
  if (p.exp <= Math.floor(Date.now() / 1000)) {
    return null // expired
  }

  return { role: p.r, schoolId: p.s, programId: p.p }
}

// ── Role-aware single-round-trip DB lookup ────────────────────────────────────
async function resolveScope(
  request: NextRequest,
): Promise<{ scope: Scope | null; userId: string | null; fresh: boolean }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    return { scope: null, userId: null, fresh: false }
  }

  const supabase = createServerClient<Database>(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: () => {},
    },
  })

  // ── 1. Verify session ──────────────────────────────────────────────────────
  let session: { user: { id: string } } | null = null
  try {
    const { data } = await supabase.auth.getSession()
    session = data.session
  } catch {
    return { scope: null, userId: null, fresh: false }
  }
  const user = session?.user ?? null
  if (!user) {
    return { scope: null, userId: null, fresh: false }
  }

  // ── 2. Try cache ───────────────────────────────────────────────────────────
  const cachedRaw = request.cookies.get(SCOPE_COOKIE)?.value
  if (cachedRaw) {
    const cached = await decodeCache(cachedRaw, user.id)
    if (cached) {
      return { scope: cached, userId: user.id, fresh: false }
    }
  }

  // ── 3. Fetch profile role ──────────────────────────────────────────────────
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single() as { data: { role: Role } | null }

  if (!profile) {
    return { scope: null, userId: user.id, fresh: true }
  }

  // ── 4. Fetch scope columns for THIS role only ──────────────────────────────
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

  const scope: Scope = { role: profile.role, schoolId, programId }
  return { scope, userId: user.id, fresh: true }
}

// ── Cookie writer helper ───────────────────────────────────────────────────────
async function withScopeCache(
  response: NextResponse,
  userId: string | null,
  scope: Scope | null,
  fresh: boolean,
  clearCache: boolean,
): Promise<NextResponse> {
  const secure = process.env.NODE_ENV === 'production'
  const base   = { path: '/', httpOnly: true, sameSite: 'lax' as const, secure }

  if (clearCache || !scope || !userId) {
    response.cookies.set({ name: SCOPE_COOKIE, value: '', maxAge: 0, ...base })
    return response
  }

  if (fresh) {
    const payload: ScopeCachePayload = {
      u: userId,
      r: scope.role,
      s: scope.schoolId,
      p: scope.programId,
      exp: Math.floor(Date.now() / 1000) + SCOPE_TTL_SECONDS,
    }
    const encoded = await encodeCache(payload)
    response.cookies.set({ name: SCOPE_COOKIE, value: encoded, maxAge: SCOPE_TTL_SECONDS, ...base })
  }

  return response
}

// ── Main proxy function ────────────────────────────────────────────────────────
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  // ── Symposium mode: bypass all auth and scope checks ──────────────────────
  if (DISABLE_PROXY) {
    return NextResponse.next()
  }

  // Development-only full bypass for rapid UI iteration/refactors.
  if (DEV_BYPASS_AUTH) {
    return NextResponse.next()
  }

  // Fast-path: never hit the DB for static assets
  if (shouldSkip(pathname)) {
    return NextResponse.next()
  }

  const { scope, userId, fresh } = await resolveScope(request)

  // ── Not authenticated ──────────────────────────────────────────────────────
  if (!scope) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', `${pathname}${search}`)
    const res = NextResponse.redirect(loginUrl)
    return withScopeCache(res, userId, null, false, true)
  }

  // ── Role-to-path guards ────────────────────────────────────────────────────
  if (pathname.startsWith('/student') && scope.role !== 'student') {
    return withScopeCache(redirectLogin(request), userId, scope, fresh, false)
  }

  if (pathname.startsWith('/faculty') && scope.role !== 'faculty') {
    return withScopeCache(redirectLogin(request), userId, scope, fresh, false)
  }

  if (pathname.startsWith('/admin') && scope.role === 'student') {
    return withScopeCache(redirectLogin(request), userId, scope, fresh, false)
  }

  // Faculty blocked from specific admin sub-routes
  if (scope.role === 'faculty' && pathname.startsWith('/admin')) {
    const blocked = ['/admin/programs', '/admin/analytics', '/admin/faculty']
    if (blocked.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
      return withScopeCache(redirectLogin(request), userId, scope, fresh, false)
    }
  }

  // ── Scope completeness check (students + faculty only) ────────────────────
  const requiresScope = SCOPE_REQUIRED_PREFIXES.some((p) => pathname.startsWith(p))
  if (requiresScope) {
    if (!scope.schoolId || !scope.programId) {
      return withScopeCache(redirectLogin(request), userId, scope, fresh, false)
    }
  }

  // ── Allow through, write cache if freshly resolved ────────────────────────
  return withScopeCache(NextResponse.next(), userId, scope, fresh, false)
}

function redirectLogin(request: NextRequest): NextResponse {
  return NextResponse.redirect(new URL('/login', request.url))
}

export const config = {
  matcher: ['/admin/:path*', '/student/:path*', '/faculty/:path*'],
}