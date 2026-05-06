// lib/hooks/admin/students/edit/useAuthGuard.ts
'use client'

import { useRouteGuard } from '@/lib/hooks/auth/useRouteGuard'

/**
 * Redirects unauthenticated users to /login.
 * Returns authLoading so callers can defer rendering while session resolves.
 */
export function useAuthGuard(): { authLoading: boolean } {
  return useRouteGuard({ allowedRoles: ['admin', 'faculty'] })
}
