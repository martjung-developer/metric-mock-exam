// lib/context/AuthContext.tsx
'use client'
// ─────────────────────────────────────────────────────────────────────────────
// AuthContext — single source of truth for client-side auth state.
//
// Design decisions:
//   • Uses getUser() directly (preferred over the deprecated getSession pattern).
//   • Recovers gracefully from stale / invalid refresh tokens.
//   • fetchingRef prevents concurrent loadSession() calls.
//   • onAuthStateChange re-fetches the profile on every auth event.
// ─────────────────────────────────────────────────────────────────────────────

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useRouter }     from 'next/navigation'
import type { User }     from '@supabase/supabase-js'
import { createClient }  from '@/lib/supabase/client'
import { fetchProfileForUser } from '@/lib/auth/profile'

type AuthProfile = Awaited<ReturnType<typeof fetchProfileForUser>>

// ── Types ──────────────────────────────────────────────────────────────────

interface AuthState {
  user:    User        | null
  profile: AuthProfile | null
  loading: boolean
  error:   string      | null
}

interface AuthContextValue extends AuthState {
  /** Force a manual session refresh (use sparingly). */
  refresh: () => Promise<void>
}

// ── Context ────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null)

// ── Stale-token detection helper ───────────────────────────────────────────

function isStaleTokenError(error: unknown): boolean {
  if (!(error instanceof Error)) { return false }
  const msg = error.message.toLowerCase()
  return msg.includes('invalid refresh token') || msg.includes('refresh token not found')
}

// ── Provider ───────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const router       = useRouter()
  const fetchingRef  = useRef(false)
  const supabase     = createClient()

  const [state, setState] = useState<AuthState>({
    user:    null,
    profile: null,
    loading: true,
    error:   null,
  })

  const clearAuth = useCallback(
    (err: string | null = null) => {
      setState({ user: null, profile: null, loading: false, error: err })
    },
    [],
  )

  const recoverFromStaleToken = useCallback(async () => {
    await supabase.auth.signOut()
    clearAuth()
    router.replace('/login')
  }, [supabase, clearAuth, router])

  const loadSession = useCallback(async () => {
    if (fetchingRef.current) { return }
    fetchingRef.current = true

    try {
      const { data: { user }, error } = await supabase.auth.getUser()

      if (error) {
        if (isStaleTokenError(error)) {
          await recoverFromStaleToken()
          return
        }
        clearAuth(error.message)
        return
      }

      if (!user) {
        clearAuth()
        return
      }

      const profile = await fetchProfileForUser(supabase, user)

      setState({ user, profile, loading: false, error: null })
    } catch (err) {
      if (isStaleTokenError(err)) {
        await recoverFromStaleToken()
        return
      }
      clearAuth(err instanceof Error ? err.message : 'Unknown auth error')
    } finally {
      fetchingRef.current = false
    }
  }, [supabase, clearAuth, recoverFromStaleToken])

  useEffect(() => {
    void loadSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        void (async () => {
          try {
            const profile = await fetchProfileForUser(supabase, session?.user ?? null)
            setState({
              user:    session?.user ?? null,
              profile,
              loading: false,
              error:   null,
            })
          } catch (err) {
            if (isStaleTokenError(err)) {
              await recoverFromStaleToken()
              return
            }
            clearAuth(err instanceof Error ? err.message : 'Unknown auth error')
          }
        })()
      },
    )

    return () => subscription.unsubscribe()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <AuthContext.Provider value={{ ...state, refresh: loadSession }}>
      {children}
    </AuthContext.Provider>
  )
}

// ── Hook ───────────────────────────────────────────────────────────────────

export function useUser(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useUser() must be used inside <AuthProvider>.')
  }
  return ctx
}