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

function isNetworkConnectionError(error: unknown): boolean {
  if (!(error instanceof Error)) { return false }
  const msg = error.message.toLowerCase()
  return (
    msg.includes('failed to fetch') ||
    msg.includes('networkerror') ||
    msg.includes('aborterror') ||
    msg.includes('timeout')
  )
}

type NetworkBannerState = 'issue' | 'reconnected' | null

// ── Provider ───────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const router       = useRouter()
  const fetchingRef  = useRef(false)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const supabase     = createClient()

  const [state, setState] = useState<AuthState>({
    user:    null,
    profile: null,
    loading: true,
    error:   null,
  })
  const [networkBanner, setNetworkBanner] = useState<NetworkBannerState>(null)

  const clearAuth = useCallback(
    (err: string | null = null) => {
      setState({ user: null, profile: null, loading: false, error: err })
    },
    [],
  )

  const showConnectionIssue = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current)
      reconnectTimerRef.current = null
    }
    setNetworkBanner('issue')
  }, [])

  const showReconnected = useCallback(() => {
    setNetworkBanner('reconnected')
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current)
    }
    reconnectTimerRef.current = setTimeout(() => {
      setNetworkBanner(null)
      reconnectTimerRef.current = null
    }, 3_000)
  }, [])

  const preserveAuthOnNetworkError = useCallback(() => {
    showConnectionIssue()
    setState((prev) => ({ ...prev, loading: false, error: null }))
  }, [showConnectionIssue])

  const recoverFromStaleToken = useCallback(async () => {
    clearAuth()
    window.location.href = '/api/auth/signout'
  }, [clearAuth])

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
        if (isNetworkConnectionError(error)) {
          preserveAuthOnNetworkError()
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
      if (isNetworkConnectionError(err)) {
        preserveAuthOnNetworkError()
        return
      }
      clearAuth(err instanceof Error ? err.message : 'Unknown auth error')
    } finally {
      fetchingRef.current = false
    }
  }, [supabase, clearAuth, recoverFromStaleToken, preserveAuthOnNetworkError])

  useEffect(() => {
    // Initialize auth state and subscribe to subsequent auth changes together.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        void (async () => {
          if (event === 'SIGNED_OUT') {
            if (typeof navigator !== 'undefined' && !navigator.onLine) {
              showConnectionIssue()
              return
            }

            if (typeof navigator !== 'undefined' && navigator.onLine) {
              try {
                const { data } = await supabase.auth.getSession()
                if (data.session) {
                  return
                }
                router.push('/login')
                return
              } catch (err) {
                if (isNetworkConnectionError(err)) {
                  preserveAuthOnNetworkError()
                  return
                }
                clearAuth(err instanceof Error ? err.message : 'Unknown auth error')
                return
              }
            }
          }

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
            if (isNetworkConnectionError(err)) {
              preserveAuthOnNetworkError()
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

  useEffect(() => {
    function handleOnline() {
      showReconnected()
      void loadSession()
    }

    function handleOffline() {
      showConnectionIssue()
    }

    function handleSupabaseNetworkError() {
      showConnectionIssue()
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('metric:supabase-network-error', handleSupabaseNetworkError)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('metric:supabase-network-error', handleSupabaseNetworkError)
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current)
      }
    }
  }, [loadSession, showConnectionIssue, showReconnected])

  return (
    <AuthContext.Provider value={{ ...state, refresh: loadSession }}>
      {networkBanner && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 10_000,
            padding: '0.55rem 1rem',
            textAlign: 'center',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: networkBanner === 'issue' ? '#92400e' : '#166534',
            background: networkBanner === 'issue' ? '#fef3c7' : '#dcfce7',
            borderBottom: `1px solid ${networkBanner === 'issue' ? '#f59e0b' : '#22c55e'}`,
          }}
        >
          {networkBanner === 'issue'
            ? '⚠ Connection issue — retrying...'
            : '✓ Reconnected'}
        </div>
      )}
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
