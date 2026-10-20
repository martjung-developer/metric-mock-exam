// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/types/database'
import type { SupabaseClient } from '@supabase/supabase-js'

const NETWORK_ERROR_PATTERNS = [
  'failed to fetch',
  'networkerror',
  'aborterror',
  'timeout',
]

function isNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) { return false }
  const message = error.message.toLowerCase()
  return NETWORK_ERROR_PATTERNS.some((pattern) => message.includes(pattern))
}

function notifyNetworkIssue(error: unknown) {
  if (typeof window === 'undefined' || !isNetworkError(error)) { return }
  window.dispatchEvent(new CustomEvent('metric:supabase-network-error'))
}

async function fetchWithTimeout(
  url: Parameters<typeof fetch>[0],
  options: Parameters<typeof fetch>[1] = {},
): Promise<Response> {
  const maxAttempts = 2

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15_000)

    try {
      return await fetch(url, {
        ...options,
        signal: controller.signal,
      })
    } catch (error) {
      notifyNetworkIssue(error)
      if (attempt === maxAttempts || !isNetworkError(error)) {
        throw error
      }
    } finally {
      clearTimeout(timeout)
    }
  }

  throw new Error('Network request failed.')
}

export function createClient(): SupabaseClient<Database> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_PUBLISHABLE_KEY

  if (!url || !key) {
    throw new Error('Missing Supabase environment variables')
  }

  return createBrowserClient<Database>(url, key, {
    cookieOptions: {
      name: 'metric-auth',
    },
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    global: {
      fetch: fetchWithTimeout,
    },
  })
}
