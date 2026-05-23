// lib/types/admin/faculty/index.ts

export type FacultyRoleType = 'professional' | 'major' | 'minor'
export type FacultyAssignmentRole = 'full_time' | 'part_time' | 'adjunct' | 'emeritus'

export type FacultyDepartment = 'SBIT' | 'SSLATE' | 'SARFAID'

export type FacultyProgram =
  | 'BLIS'
  | 'BSPSYCH'
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
  { department: 'SSLATE',  programs: ['BSPSYCH', 'BEEd', 'BSEd-FIL', 'BSEd-ENG', 'BSEd-MATH', 'BSEd-SCI'] },
  { department: 'SARFAID', programs: ['BSARCH', 'BSID'] },
]

export const ROLE_TYPE_LABELS: Record<FacultyRoleType, string> = {
  professional: 'Professional Education',
  major:        'Major Education',
  minor:        'Minor Education',
}

export const FACULTY_ASSIGNMENT_ROLE_LABELS: Record<FacultyAssignmentRole, string> = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  adjunct: 'Adjunct',
  emeritus: 'Emeritus',
}

// ── Row returned from the faculty table ──────────────────────────────────────

export interface FacultyRow {
  id:           string
  faculty_id:   string
  full_name:    string
  email:        string
  role_type:    FacultyRoleType | null
  is_active:    boolean
  created_at:   string
  program_id:   string | null
  program_code: string | null  
  program_name: string | null   
  school_code:  string | null   
  school_name:  string | null
}

// ── Payload sent from the admin UI ──────────────────────────────────────────

export interface CreateFacultyPayload {
  fullName:   string
  email:      string
  facultyId:  string
  password:   string
  department: FacultyDepartment
  program:    FacultyProgram
  programId:  string          
  roleType:   FacultyRoleType
}

// ── API response shape ────────────────────────────────────────────────────────

export interface CreateFacultyResponse {
  success:       boolean
  faculty_id?:   string
  program_code?: string
  program_name?: string
  school_code?:  string
  role_type?:    FacultyRoleType
  email?:        string
  full_name?:    string
  role?:         'faculty'
  error?:        string
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
