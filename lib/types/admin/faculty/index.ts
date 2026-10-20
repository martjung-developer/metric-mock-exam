// lib/types/admin/faculty/index.ts

export type FacultyRoleType = 'professional' | 'major' | 'minor'
export type FacultyAssignmentRole = 'full_time' | 'part_time' | 'adjunct' | 'emeritus'

export type FacultyDepartment = 'SBIT' | 'SSLATE' | 'SARFAID'

export type FacultyProgram =
  | 'BLIS'
  | 'BS-PSYCH'
  | 'BEEd'
  | 'BSEd-FIL'
  | 'BSEd-ENG'
  | 'BSEd-MATH'
  | 'BSEd-SCI'
  | 'BSARCH'
  | 'BSID'

export interface DepartmentPrograms {
  department: FacultyDepartment
  programs:   FacultyProgram[]
}

export const DEPARTMENT_PROGRAMS: DepartmentPrograms[] = [
  { department: 'SBIT',    programs: ['BLIS'] },
  { department: 'SSLATE',  programs: ['BS-PSYCH', 'BEEd', 'BSEd-FIL', 'BSEd-ENG', 'BSEd-MATH', 'BSEd-SCI'] },
  { department: 'SARFAID', programs: ['BSARCH', 'BSID'] },
]

export const ROLE_TYPE_OPTIONS: FacultyRoleType[] = ['professional', 'major', 'minor']

export const ROLE_TYPE_LABELS: Record<FacultyRoleType, string> = {
  professional: 'Professional Education',
  major:        'Major Education',
  minor:        'Minor Education',
}

export const ROLE_TYPE_SHORT_LABELS: Record<FacultyRoleType, string> = {
  professional: 'Prof Ed',
  major:        'Major Ed',
  minor:        'Minor Ed',
}

export const FACULTY_ASSIGNMENT_ROLE_LABELS: Record<FacultyAssignmentRole, string> = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  adjunct:   'Adjunct',
  emeritus:  'Emeritus',
}

export function sortRoleTypes(roles: FacultyRoleType[]): FacultyRoleType[] {
  return ROLE_TYPE_OPTIONS.filter((r) => roles.includes(r))
}

// ── NEW: one row per faculty↔program link ──────────────────────────────────

export interface FacultyProgramLink {
  program_id:      string
  program_code:    string | null
  program_name:    string | null
  school_id:       string | null
  school_code:     string | null
  school_name:     string | null
  is_program_head: boolean
}

// ── Row returned from the faculty table ──────────────────────────────────────

export interface FacultyRow {
  id:              string
  faculty_id:      string
  full_name:       string
  email:           string
  role_types:      FacultyRoleType[]
  is_active:       boolean
  created_at:      string

  // Legacy mirrored fields (primary program) — kept as fallback
  program_id:      string | null
  is_program_head: boolean
  program_code:    string | null
  program_name:    string | null
  school_code:     string | null
  school_name:     string | null

  // Full multi-program list
  programs:        FacultyProgramLink[]
}

// ── Payload sent from the admin UI ──────────────────────────────────────────

export interface FacultyProgramSelection {
  programId:     string
  code:          FacultyProgram
  isProgramHead: boolean
}

export interface FacultyProgramUpdateSelection {
  program_id:      string
  is_program_head: boolean
}

export interface CreateFacultyPayload {
  fullName:   string
  email:      string
  facultyId:  string
  password:   string
  department: FacultyDepartment
  programs:   FacultyProgramSelection[]
  roleTypes:  FacultyRoleType[]
}

// ── API response shape ────────────────────────────────────────────────────────

export interface CreateFacultyResponse {
  success:      boolean
  faculty_id?:  string
  programs?:    { code: string; name: string; is_program_head: boolean }[]
  school_code?: string
  role_types?:  FacultyRoleType[]
  email?:       string
  full_name?:   string
  role?:        'faculty'
  error?:       string
}

export interface FacultyListResponse {
  success:  boolean
  faculty?: FacultyRow[]
  error?:   string
}

export interface ProgramOption {
  id:          string
  code:        string
  name:        string
  school_code: string
  school_name: string
}