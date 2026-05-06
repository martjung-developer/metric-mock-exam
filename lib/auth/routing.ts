import type { UserRole } from '@/lib/types/auth/'

export const ROLE_DASHBOARDS: Record<UserRole, string> = {
  student: '/student/dashboard',
  faculty: '/faculty/dashboard',
  admin: '/admin/dashboard',
}

export function getDashboardByRole(role: UserRole): string {
  return ROLE_DASHBOARDS[role]
}
