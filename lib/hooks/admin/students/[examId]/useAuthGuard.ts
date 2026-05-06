// lib/hooks/admin/students/[examId]/useAuthGuard.ts
import { useRouteGuard } from '@/lib/hooks/auth/useRouteGuard'

export function useAuthGuard(): { authLoading: boolean } {
  return useRouteGuard({ allowedRoles: ['admin', 'faculty'] })
}
