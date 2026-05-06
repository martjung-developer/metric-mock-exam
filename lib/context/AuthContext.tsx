// lib/context/AuthContext.tsx
'use client'

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useRouter } from 'next/navigation'
import type { User, Session } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import type { AuthProfile } from '@/lib/auth/profile'
import { fetchProfileForUser } from '@/lib/auth/profile'

// ── Types ──────────────────────────────────────────────────────────────────

interface AuthState {
  user:    User    | null
  session: Session | null
  profile: AuthProfile | null
  loading: boolean
  error:   string  | null
}

interface AuthContextValue extends AuthState {
  /** Call this to force a manual refresh (rare). */
  refresh: () => Promise<void>
}

// ── Context ────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null)

// ── Provider ───────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [state, setState] = useState<AuthState>({
    user:    null,
    session: null,
    profile: null,
    loading: true,
    error:   null,
  })

  const fetchingRef = useRef(false)

  const supabase = createClient()

  function isInvalidRefreshTokenError(error: unknown): boolean {
    if (!(error instanceof Error)) {
      return false
    }
    const message = error.message.toLowerCase()
    return (
      message.includes('invalid refresh token') &&
      message.includes('refresh token not found')
    )
  }

  async function recoverFromStaleToken() {
    await supabase.auth.signOut()
    setState({ user: null, session: null, profile: null, loading: false, error: null })
    router.replace('/login')
  }

  async function loadSession() {
    if (fetchingRef.current) {
      return
    }
    fetchingRef.current = true

    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) {
        if (isInvalidRefreshTokenError(sessionError)) {
          await recoverFromStaleToken()
          return
        }
        setState({ user: null, session: null, profile: null, loading: false, error: sessionError.message })
        return
      }

      if (!sessionData.session) {
        setState({ user: null, session: null, profile: null, loading: false, error: null })
        return
      }

      const { data: { user }, error } = await supabase.auth.getUser()

      if (error) {
        setState({ user: null, session: null, profile: null, loading: false, error: error.message })
        return
      }

      const profile = await fetchProfileForUser(supabase, user)

      setState({
        user,
        session: sessionData.session,
        profile,
        loading: false,
        error:   null,
      })
    } catch (err) {
      if (isInvalidRefreshTokenError(err)) {
        await recoverFromStaleToken()
        return
      }
      const message = err instanceof Error ? err.message : 'Unknown auth error'
      setState({ user: null, session: null, profile: null, loading: false, error: message })
    } finally {
      fetchingRef.current = false
    }
  }

  useEffect(() => {
    loadSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        try {
          const profile = await fetchProfileForUser(supabase, session?.user ?? null)
          setState(prev => ({
            ...prev,
            user:    session?.user ?? null,
            session: session ?? null,
            profile,
            loading: false,
            error:   null,
          }))
        } catch (err) {
          if (isInvalidRefreshTokenError(err)) {
            await recoverFromStaleToken()
            return
          }
          const message = err instanceof Error ? err.message : 'Unknown auth error'
          setState(prev => ({
            ...prev,
            user: null,
            session: null,
            profile: null,
            loading: false,
            error: message,
          }))
        }
      },
    )

    return () => subscription.unsubscribe()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
