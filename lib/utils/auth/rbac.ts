// lib/utils/auth/rbac.ts
import type { UserRole } from '@/lib/types/auth'

export type StaffRole = Extract<UserRole, 'admin' | 'faculty'>

type StaffNavKey =
  | 'dashboard'
  | 'notifications'
  | 'students'
  | 'faculty'
  | 'exams'
  | 'questionnaires'
  | 'programs'
  | 'study-materials'
  | 'analytics'
  | 'approvals'
  | 'submissions'
  | 'settings'

type StaffRouteRules = {
  home: string
  allowedPaths: readonly string[]
  nav: readonly StaffNavKey[]
}

const STAFF_ROUTE_RULES: Record<StaffRole, StaffRouteRules> = {
  admin: {
    home: '/admin/dashboard',
    allowedPaths: ['/admin'],
    nav: [
      'dashboard',
      'notifications',
      'approvals',
      'students',
      'faculty',
      'exams',
      'questionnaires',
      'programs',
      'study-materials',
      'analytics',
      'settings',
    ],
  },
  faculty: {
    home: '/faculty/dashboard',
    allowedPaths: [
      '/faculty',
      '/admin/dashboard',
      '/admin/exams',
      '/admin/questionnaires',
      '/admin/students',
      '/admin/study-materials',
      '/admin/notifications',
      '/admin/analytics',
      '/admin/settings',
    ],
    nav: [
      'dashboard',
      'notifications',
      'students',
      'exams',
      'questionnaires',
      'questionnaires',
      'study-materials',
      'analytics',
      'settings',
    ],
  },
}

export const STAFF_NAV_HREF: Record<StaffRole, Record<StaffNavKey, string>> = {
  admin: {
    dashboard: '/admin/dashboard',
    notifications: '/admin/notifications',
    students: '/admin/students',
    faculty: '/admin/faculty',
    exams: '/admin/exams',
    questionnaires: '/admin/questionnaires',
    programs: '/admin/programs',
    'study-materials': '/admin/study-materials',
    analytics: '/admin/analytics',
    approvals: '/admin/approvals',
    submissions: '/admin/approvals',
    settings: '/admin/settings',
  },
  faculty: {
    dashboard: '/faculty/dashboard',
    notifications: '/faculty/notifications',
    students: '/faculty/students',
    faculty: '/faculty/dashboard',
    exams: '/faculty/exams',
    questionnaires: '/faculty/questionnaires',
    programs: '/faculty/dashboard',
    'study-materials': '/faculty/study-materials',
    analytics: '/faculty/dashboard',
    approvals: '/faculty/submissions',
    submissions: '/faculty/submissions',
    settings: '/faculty/settings',
  },
}

export function isStaffRole(role: UserRole | null | undefined): role is StaffRole {
  return role === 'admin' || role === 'faculty'
}

export function getStaffHomePath(role: StaffRole): string {
  return STAFF_ROUTE_RULES[role].home
}

export function canAccessStaffPath(role: StaffRole, pathname: string): boolean {
  return STAFF_ROUTE_RULES[role].allowedPaths.some((prefix) => pathname.startsWith(prefix))
}

export function getStaffAllowedNav(role: StaffRole): readonly StaffNavKey[] {
  return STAFF_ROUTE_RULES[role].nav
}
