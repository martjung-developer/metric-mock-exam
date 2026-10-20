// lib/types/auth/index.ts

// ── Roles ─────────────────────────────────────────────────────────────────────────
export type UserRole   = 'student' | 'faculty' | 'admin'
export type SignupRole = 'student' // signup is student-only

// ── ID format aliases (documentation only — runtime is regex-validated) ─────────
export type StudentId = `${string}-${string}-${string}`
export type FacultyId = `${Uppercase<string>}-${string}`
export type AdminId   = `${Uppercase<string>}-${string}`
export type AnyUserId = StudentId | FacultyId | AdminId

// ── Program codes come from database at runtime (no hardcoded list) ────────────
export const PROGRAMS: ReadonlyArray<{ value: string; label: string }> = []

export type ProgramCode = string

// ── Year levels ───────────────────────────────────────────────────────────────
export const YEAR_LEVEL_OPTIONS = [
  { value: 1, label: '1st' },
  { value: 2, label: '2nd' },
  { value: 3, label: '3rd' },
  { value: 4, label: '4th' },
  { value: 5, label: '5th' },
] as const

export type YearLevel = typeof YEAR_LEVEL_OPTIONS[number]['value'] // 1|2|3|4|5

// ── Signup steps (student only) ───────────────────────────────────────────────
export type SignupStep = 'id' | 'credentials' | 'program' | 'review'

export interface SignupState {
  step:        SignupStep
  studentId:   string
  fullName:    string
  email:       string
  phone:       string
  password:    string
  programCode: ProgramCode | ''
  yearLevel:   YearLevel   | null
}

export const INITIAL_SIGNUP_STATE: SignupState = {
  step:        'id',
  studentId:   '',
  fullName:    '',
  email:       '',
  phone:       '',
  password:    '',
  programCode: '',
  yearLevel:   null,
}

// ── Login form ────────────────────────────────────────────────────────────────
export interface LoginForm {
  userId:   string
  password: string
}

// ── API response shapes ───────────────────────────────────────────────────────
export interface AuthSuccess {
  success:    true
  redirectTo: string
}

export interface AuthFailure {
  success: false
  error:   string
}

export type AuthResult = AuthSuccess | AuthFailure

// resolve-user-by-id response
export interface ResolveUserSuccess {
  found: true
  email: string
  role:  UserRole
}
export interface ResolveUserFailure {
  found:  false
  error:  string
}
export type ResolveUserResult = ResolveUserSuccess | ResolveUserFailure

// send-otp response
export interface SendOtpSuccess { sent: true }
export interface SendOtpFailure { sent: false; error: string }
export type SendOtpResult = SendOtpSuccess | SendOtpFailure

// verify-otp response
export interface VerifyOtpSuccess { verified: true;  redirectTo: string }
export interface VerifyOtpFailure { verified: false; error: string }
export type VerifyOtpResult = VerifyOtpSuccess | VerifyOtpFailure

// ── Role → dashboard ──────────────────────────────────────────────────────────
export const ROLE_DASHBOARDS: Record<UserRole, string> = {
  student: '/student/dashboard',
  faculty: '/faculty/dashboard',
  admin:   '/admin/dashboard',
}

export function getDashboardByRole(role: UserRole | string): string {
  return ROLE_DASHBOARDS[role as UserRole] ?? '/student/dashboard'
}

// ── Content management access ─────────────────────────────────────────────────
export function canManageContent(role: UserRole): boolean {
  return role === 'faculty' || role === 'admin'
}

// ── Profile shapes ────────────────────────────────────────────────────────────
export interface Profile {
  id:         string
  email:      string
  full_name:  string | null
  role:       UserRole
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface StudentProfile extends Profile {
  student_id:  string | null
  school:      string | null
  year_level:  number | null
  target_exam: string | null
  program_id:  string | null
  school_id:   string | null
}

export interface FacultyProfile extends Profile {
  faculty_id: string | null
  school:     string | null
  program_id: string | null
  school_id:  string | null
}

export type AuthProfile = Profile

// ── Program utilities ─────────────────────────────────────────────────────────
export function isProgramCode(value: unknown): value is ProgramCode {
  return typeof value === 'string' && value.trim().length > 0
}

export function getProgramLabel(code: ProgramCode | '' | null | undefined): string {
  if (!code) { return '—' }
  const match = PROGRAMS.find((p) => p.value === code)
  return match?.label ?? code
}
