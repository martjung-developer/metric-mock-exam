// lib/types/admin/students/[examId]/student.types.ts
import type { Database } from '@/lib/types/database'

// ── Raw DB row aliases ────────────────────────────────────────────────────────
type ProfileRow  = Database['public']['Tables']['profiles']['Row']
type StudentRow  = Database['public']['Tables']['students']['Row']
type ProgramRow  = Database['public']['Tables']['programs']['Row']

// ── Supabase join shape returned by getStudentProfile() ──────────────────────
// Supabase returns inner-joined relations as a single object (not array) when
// using !inner. We model both possibilities and unwrap safely in the mapper.
export type JoinedProgram = Pick<ProgramRow, 'id' | 'code' | 'name'>

export type JoinedStudent = Pick<StudentRow, 'student_id' | 'year_level' | 'program_id' | 'school' | 'target_exam'> & {
  programs: JoinedProgram | JoinedProgram[] | null
}

export type StudentProfileRow = Pick<ProfileRow, 'id' | 'full_name' | 'email' | 'avatar_url' | 'created_at'> & {
  students: JoinedStudent | JoinedStudent[] | null
}

// ── App-level domain type ─────────────────────────────────────────────────────
export interface StudentProfile {
  id:           string
  full_name:    string | null
  email:        string
  avatar_url:   string | null
  student_id:   string | null
  year_level:   number | null
  program_id:   string | null
  program_code: string | null
  program_name: string | null
  school:       string | null
  target_exam:  string | null
  created_at:   string
}