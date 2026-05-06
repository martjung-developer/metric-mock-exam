// lib/hooks/admin/students/create/useAuthGuard.ts
//
// Redirects unauthenticated users to /login.
// Extracted so any admin page can reuse it without touching AuthContext directly.

import { useRouteGuard } from '@/lib/hooks/auth/useRouteGuard'

/**
 * Redirects to /login when auth loading is complete and no user is found.
 * Safe to call at the top of any 'use client' admin page.
 */
export function useAuthGuard(): void {
  useRouteGuard({ allowedRoles: ['admin', 'faculty'] })
}
