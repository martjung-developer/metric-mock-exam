/**
 * lib/hooks/admin/students/useAuthGuard.ts
 *
 * Redirects to /login if the user is not authenticated.
 * Returns `isReady` so the caller can gate rendering until auth resolves.
 */

'use client'

import { useRouteGuard } from '@/lib/hooks/auth/useRouteGuard'

export interface UseAuthGuardReturn {
  /** True once auth has resolved AND the user is authenticated. */
  isReady: boolean
}

export function useAuthGuard(): UseAuthGuardReturn {
  const { isReady } = useRouteGuard({ allowedRoles: ['admin', 'faculty'] })
  return { isReady }
}
