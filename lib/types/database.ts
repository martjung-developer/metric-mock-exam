// lib/types/database.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ── Enums ──────────────────────────────────────────────────────────────────────
// Matches: CHECK (role = ANY (ARRAY['student','admin','faculty']))
export type UserRole = 'student' | 'admin' | 'faculty'

// Matches the status column on submissions.
export type SubmissionStatus =
  | 'in_progress'
  | 'submitted'
  | 'graded'
  | 'reviewed'   
  | 'released'   

// ── ADDED: grading_status ─────────────────────────────────────────────────────
// Derived at the application level (not a DB column).
// 'complete'     — all answers have been graded (auto or manual)
// 'needs_review' — one or more manual-type answers are still pending
// 'ungraded'     — no answers recorded yet
export type GradingStatus = 'complete' | 'needs_review' | 'ungraded'

// Matches: CHECK (purpose = ANY (ARRAY['exam_questions','reviewer','profile_image','other']))
export type StoragePurpose = 'exam_questions' | 'reviewer' | 'profile_image' | 'other'

// Matches the USER-DEFINED question_type enum in `questions`
export type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer' | 'essay' | 'matching' | 'fill_blank'

// ── AUTO-GRADED vs MANUAL question types ─────────────────────────────────────
export const AUTO_GRADE_QUESTION_TYPES:   QuestionType[] = ['multiple_choice', 'true_false', 'fill_blank']
export const MANUAL_GRADE_QUESTION_TYPES: QuestionType[] = ['short_answer', 'essay', 'matching']

export function isAutoGradedType(type: QuestionType):   boolean { return AUTO_GRADE_QUESTION_TYPES.includes(type) }
export function isManualGradedType(type: QuestionType): boolean { return MANUAL_GRADE_QUESTION_TYPES.includes(type) }

// Exam type
export type ExamType = 'mock' | 'practice'

export const EXAM_TYPE_META: Record<ExamType, { label: string; description: string }> = {
  mock:     { label: 'Mock Exam',     description: 'Timed, board-style exam that simulates the actual licensure exam.'   },
  practice: { label: 'Reviewer',      description: 'Self-paced reviewer set for studying individual topics or subjects.' },
}

// ── Convenience / App-Level Types ─────────────────────────────────────────────

export type StudentProfile = Database['public']['Tables']['profiles']['Row'] & {
  student: Database['public']['Tables']['students']['Row'] | null
}

export type StaffProfile = Database['public']['Tables']['profiles']['Row'] & {
  role: 'faculty' | 'admin'
}

export type AppUser = StudentProfile | StaffProfile

export interface QuestionOption {
  label: string
  text:  string
}

export interface GradingResult {
  answer_id:     string
  question_id:   string
  question_type: QuestionType
  is_correct:    boolean | null
  points_earned: number
}

// ── Material type ─────────────────────────────────────────────────────────────
export type StudyMaterialType = 'document' | 'video' | 'notes'

// ── Grading mode ──────────────────────────────────────────────────────────────
// Matches: DEFAULT 'auto'::text on exams.grading_mode column.
// Exported here so exam.service.ts and submission.types.ts can both import
// from a single source — no circular dependency.
export type GradingMode = 'auto' | 'manual'

// ── Link type ─────────────────────────────────────────────────────────────────
// Matches: CHECK (link_type IS NULL OR link_type = ANY (ARRAY[...]))
export type LinkType = 'video' | 'meeting' | 'drive' | 'other'

// ── Faculty role type ─────────────────────────────────────────────────────────
// Matches: faculty.role_types text[] — a faculty member may hold more than
// one role type at once (e.g. Professional Education + Major Education).
export type FacultyRoleTypeEnum = 'professional' | 'major' | 'minor'

type TableShape = {
  Row: Record<string, unknown>
  Insert: Record<string, unknown>
  Update: Record<string, unknown>
}

type ViewShape =
  | { Row: Record<string, unknown> }
  | {
      Row: Record<string, unknown>
      Insert: Record<string, unknown>
      Update: Record<string, unknown>
    }

type AddRelationships<T extends Record<string, TableShape>> = {
  [K in keyof T]: T[K] & { Relationships: [] }
}

type AddViewRelationships<T extends Record<string, ViewShape>> = {
  [K in keyof T]: T[K] & { Relationships: [] }
}

export type Database = {
  public: {
    Tables: AddRelationships<{

      profiles: {
        Row: {
          id:         string
          email:      string
          full_name:  string | null
          role:       UserRole
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id:          string
          email:       string
          full_name?:  string | null
          role:        UserRole
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          email?:      string
          full_name?:  string | null
          role?:       UserRole
          avatar_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }

      students: {
        // student_id  → UNIQUE NOT NULL
        // year_level  → NOT NULL      
        // program_id  → NOT NULL FK    
        // user_id     → UNIQUE FK → auth.users  
        Row: {
          id:          string
          user_id:     string | null   
          student_id:  string          
          full_name:   string | null
          school:      string | null
          year_level:  number          
          target_exam: string | null
          program_code: string
          phone:       string | null
          program_id:  string         
          school_id:   string | null
          created_at:  string
        }
        Insert: {
          id:            string
          user_id?:      string | null
          student_id?:   string
          full_name?:   string | null
          school?:       string | null
          year_level?:   number
          target_exam?:  string | null
          program_code?: string
          phone?:       string | null
          program_id?:   string
          school_id?:    string | null
          created_at?:   string
        }
        Update: {
          user_id?:      string | null
          full_name?:   string | null
          student_id?:   string
          school?:       string | null
          year_level?:   number
          target_exam?:  string | null
          program_code?: string
          phone?:       string | null
          program_id?:   string
          school_id?:    string | null
        }
      }

      schools: {
        Row: {
          id:             string
          admin_id:       string | null  // FK to admins.admin_id for schools with assigned admin
          program_id:     string | null
          program_code:   string | null
          program_name:   string | null
          code:           string
          name:           string
          full_name:      string
          description:    string | null
          created_at:      string
        }
        Insert: {
          id?:          string
          admin_id?:       string | null  // FK to admins.admin_id for schools with assigned admin
          program_id?:     string | null
          program_code?:   string | null
          program_name?:   string | null
          code:         string
          name:         string
          full_name:    string
          description?: string | null
          created_at?:  string
        }
        Update: {
          admin_id?:       string | null  // FK to admins.admin_id for schools with assigned admin
          program_id?:     string | null
          program_code?:   string | null
          program_name?:   string | null
          code?:        string
          name?:        string
          full_name?:   string
          description?: string | null
        }
        Relationships: []
      }

      programs: {
        Row: {
          id:          string
          school_id:   string | null
          code:        string
          name:        string
          full_name:   string
          degree_type: string
          major:       string | null
          years:       number | null
          description: string | null
          created_at:  string
        }
        Insert: {
          id?:          string
          school_id?:   string | null
          code:         string
          name:         string
          full_name:    string
          degree_type:  string
          major?:       string | null
          years?:       number | null
          description?: string | null
          created_at?:  string
        }
        Update: {
          school_id?:   string | null
          code?:        string
          name?:        string
          full_name?:   string
          degree_type?: string
          major?:       string | null
          years?:       number | null
          description?: string | null
        }
        Relationships: []
      }

      exam_categories: {
        Row: {
          id:          string
          name:        string
          description: string | null
          icon:        string | null
          program_id:  string | null
          created_at:  string
        }
        Insert: {
          id?:          string
          name:         string
          description?: string | null
          icon?:        string | null
          program_id?:  string | null
          created_at?:  string
        }
        Update: {
          name?:        string
          description?: string | null
          icon?:        string | null
          program_id?:  string | null
        }
      }

      exams: {
        Row: {
          id:               string
          title:            string
          description:      string | null
          category_id:      string | null
          program_id:       string | null
          program:          string | null
          exam_type:        ExamType
          duration_minutes: number
          passing_score:    number
          total_points:     number
          is_published:     boolean
          grading_mode:     GradingMode
          approval_status:  string
          created_by:       string | null
          created_at:       string
          updated_at:       string
          allowed_programs:    string[] | null
          allowed_year_levels: number[] | null
        }
        Insert: {
          id?:              string
          title:            string
          description?:     string | null
          category_id?:     string | null
          program_id?:      string | null
          program?:          string | null
          exam_type?:       ExamType
          duration_minutes: number
          passing_score:    number
          total_points:     number
          is_published?:    boolean
          grading_mode?:    GradingMode
          approval_status?: string
          created_by?:      string | null
          created_at?:      string
          updated_at?:      string
          allowed_programs?:    string[] | null
          allowed_year_levels?: number[] | null
        }
        Update: {
          title?:            string
          description?:      string | null
          category_id?:      string | null
          program_id?:       string | null
          program?:          string | null
          exam_type?:        ExamType
          duration_minutes?: number
          passing_score?:    number
          total_points?:     number
          is_published?:     boolean
          grading_mode?:     GradingMode
          approval_status?:  string
          updated_at?:       string
          allowed_programs?:    string[] | null
          allowed_year_levels?: number[] | null
        }
      }

      exam_tos_areas: {
        Row: {
          id: string
          exam_id: string
          area_title: string
          weight_percent: number
          expected_items: number
          min_percent: number
          is_temporary: boolean
        }
        Insert: {
          id?: string
          exam_id: string
          area_title: string
          weight_percent: number
          expected_items: number
          min_percent: number
          is_temporary?: boolean
        }
        Update: {
          area_title?: string
          weight_percent?: number
          expected_items?: number
          min_percent?: number
          is_temporary?: boolean
        }
        Relationships: []
      }

      question_banks: {
        Row: {
          id: string
          title: string
          description: string | null
          program_id: string | null
          exam_id: string | null
          approval_status: string
          submitted_by: string | null
          submitted_at: string | null
          approved_by: string | null
          approved_at: string | null
          rejected_at: string | null
          published_at: string | null
          review_notes: string | null
          last_modified_by: string | null
          last_modified_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          program_id?: string | null
          exam_id?: string | null
          approval_status?: string
          submitted_by?: string | null
          submitted_at?: string | null
          approved_by?: string | null
          approved_at?: string | null
          rejected_at?: string | null
          published_at?: string | null
          review_notes?: string | null
          last_modified_by?: string | null
          last_modified_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          description?: string | null
          program_id?: string | null
          exam_id?: string | null
          approval_status?: string
          submitted_by?: string | null
          submitted_at?: string | null
          approved_by?: string | null
          approved_at?: string | null
          rejected_at?: string | null
          published_at?: string | null
          review_notes?: string | null
          last_modified_by?: string | null
          last_modified_at?: string | null
          updated_at?: string
        }
      }

      questions: {
        Row: {
          id:             string
          exam_id:        string | null
          question_text:  string
          question_type:  QuestionType
          points:         number
          options:        Json | null
          correct_answer: string | null
          image_url:      string | null
          scenario:       string | null
          section_title:  string | null
          section_number: number | null
          explanation:    string | null
          order_number:   number | null
          created_by:     string | null
          last_modified_by: string | null
          last_modified_at: string | null
          created_at:     string
          approval_status: string
          submitted_by: string | null
          submitted_at: string | null
          approved_by: string | null
          approved_at: string | null
          review_notes: string | null
          question_bank_id: string | null
        }
        Insert: {
          id?:             string
          exam_id?:        string | null
          question_text:   string
          question_type:   QuestionType
          points?:         number
          options?:        Json | null
          correct_answer?: string | null
          image_url?:      string | null
          scenario?:       string | null
          section_title?:  string | null
          section_number?: number | null
          explanation?:    string | null
          order_number?:   number | null
          created_by?:     string | null
          last_modified_by?: string | null
          last_modified_at?: string | null
          created_at?:     string
          approval_status?: string
          submitted_by?: string | null
          submitted_at?: string | null
          approved_by?: string | null
          approved_at?: string | null
          review_notes?: string | null
          question_bank_id?: string | null
        }
        Update: {
          exam_id?:        string | null
          question_text?:  string
          question_type?:  QuestionType
          points?:         number
          options?:        Json | null
          correct_answer?: string | null
          image_url?:      string | null
          scenario?:       string | null
          section_title?:  string | null
          section_number?: number | null
          explanation?:    string | null
          order_number?:   number | null
          created_by?:     string | null
          last_modified_by?: string | null
          last_modified_at?: string | null
          created_at?:     string
          approval_status?: string
          submitted_by?: string | null
          submitted_at?: string | null
          approved_by?: string | null
          approved_at?: string | null
          review_notes?: string | null
          question_bank_id?: string | null
        }
      }

      submissions: {
        Row: {
          id:                 string
          exam_id:            string | null
          student_id:         string | null
          program_id:         string | null
          year_level:         number | null
          started_at:         string
          submitted_at:       string | null
          time_spent_seconds: number | null
          status:             SubmissionStatus
          score:              number | null
          percentage:         number | null
          passed:             boolean | null
          released_at:        string | null
          created_at:         string
        }
        Insert: {
          id?:                 string
          exam_id?:            string | null
          student_id?:         string | null
          program_id?:         string | null
          year_level?:         number | null
          started_at?:         string
          submitted_at?:       string | null
          time_spent_seconds?: number | null
          status?:             SubmissionStatus
          score?:              number | null
          percentage?:         number | null
          passed?:             boolean | null
          released_at?:        string | null
          created_at?:         string
        }
        Update: {
          submitted_at?:       string | null
          time_spent_seconds?: number | null
          status?:             SubmissionStatus
          score?:              number | null
          percentage?:         number | null
          passed?:             boolean | null
          released_at?:        string | null
          program_id?:         string | null
          year_level?:         number | null
        }
      }

      answers: {
        Row: {
          id:            string
          submission_id: string | null
          question_id:   string | null
          answer_text:   string | null
          is_correct:    boolean | null
          points_earned: number | null
          graded_by:     string | null
          feedback:      string | null
          created_at:    string
        }
        Insert: {
          id?:             string
          submission_id?:  string | null
          question_id?:    string | null
          answer_text?:    string | null
          is_correct?:     boolean | null
          points_earned?:  number | null
          graded_by?:      string | null
          feedback?:       string | null
          created_at?:     string
        }
        Update: {
          answer_text?:    string | null
          is_correct?:     boolean | null
          points_earned?:  number | null
          graded_by?:      string | null
          feedback?:       string | null
        }
      }

      analytics: {
        Row: {
          id:                       string
          student_id:               string | null
          exam_id:                  string | null
          category_id:              string | null
          program_id:               string | null
          total_attempts:           number
          average_score:            number | null
          highest_score:            number | null
          lowest_score:             number | null
          total_time_spent_minutes: number
          last_attempt_at:          string | null
          created_at:               string
          updated_at:               string
        }
        Insert: {
          id?:                       string
          student_id?:               string | null
          exam_id?:                  string | null
          category_id?:              string | null
          program_id?:               string | null
          total_attempts?:           number
          average_score?:            number | null
          highest_score?:            number | null
          lowest_score?:             number | null
          total_time_spent_minutes?: number
          last_attempt_at?:          string | null
          created_at?:               string
          updated_at?:               string
        }
        Update: {
          total_attempts?:           number
          average_score?:            number | null
          highest_score?:            number | null
          lowest_score?:             number | null
          total_time_spent_minutes?: number
          last_attempt_at?:          string | null
          updated_at?:               string
        }
      }

      practice_exams: {
        Row: {
          id:           string
          title:        string
          description:  string | null
          category_id:  string | null
          program_id:   string | null
          content:      string | null
          file_url:     string | null
          created_by:   string | null
          is_published: boolean
          view_count:   number
          created_at:   string
          updated_at:   string
        }
        Insert: {
          id?:           string
          title:         string
          description?:  string | null
          category_id?:  string | null
          program_id?:   string | null
          content?:      string | null
          file_url?:     string | null
          created_by?:   string | null
          is_published?: boolean
          view_count?:   number
          created_at?:   string
          updated_at?:   string
        }
        Update: {
          title?:        string
          description?:  string | null
          category_id?:  string | null
          program_id?:   string | null
          content?:      string | null
          file_url?:     string | null
          is_published?: boolean
          view_count?:   number
          updated_at?:   string
        }
      }

      storage_files: {
        Row: {
          id:          string
          file_name:   string
          file_path:   string
          file_type:   string
          file_size:   number | null
          file_hash:   string | null
          uploaded_by: string | null
          purpose:     StoragePurpose | null
          created_at:  string
        }
        Insert: {
          id?:           string
          file_name:     string
          file_path:     string
          file_type:     string
          file_size?:    number | null
          file_hash?:    string | null
          uploaded_by?:  string | null
          purpose?:      StoragePurpose | null
          created_at?:   string
        }
        Update: {
          file_name?:  string
          file_path?:  string
          file_type?:  string
          file_size?:  number | null
          file_hash?:  string | null
          purpose?:    StoragePurpose | null
        }
      }

      exam_assignments: {
        Row: {
          id:          string
          exam_id:     string | null
          student_id:  string | null
          program_id:  string | null
          assigned_by: string | null
          assigned_at: string
          deadline:    string | null
          is_active:   boolean
        }
        Insert: {
          id?:          string
          exam_id?:     string | null
          student_id?:  string | null
          program_id?:  string | null
          assigned_by?: string | null
          assigned_at?: string
          deadline?:    string | null
          is_active?:   boolean
        }
        Update: {
          exam_id?:     string | null
          student_id?:  string | null
          program_id?:  string | null
          assigned_by?: string | null
          assigned_at?: string
          deadline?:    string | null
          is_active?:   boolean
        }
      }

      program_exam_assignments: {
        Row: {
          id:           string
          exam_id:      string
          program_code: string
          year_level:   number | null
          created_at:   string
        }
        Insert: {
          id?:           string
          exam_id:       string
          program_code:  string
          year_level?:   number | null
          created_at?:   string
        }
        Update: {
          exam_id?:      string
          program_code?: string
          year_level?:   number | null
          created_at?:   string
        }
      }

      notifications: {
        Row: {
          id:         string
          user_id:    string | null
          title:      string | null
          message:    string | null
          type:       Database['public']['Enums']['notif_type'] | null
          is_read:    boolean
          created_at: string
          link:       string | null
          cta_label:  string | null
        }
        Insert: {
          id?:        string
          user_id?:   string | null
          title?:     string | null
          message?:   string | null
          type?:      Database['public']['Enums']['notif_type'] | null
          is_read?:   boolean
          created_at?: string
          link?:      string | null
          cta_label?: string | null
        }
        Update: {
          user_id?:   string | null
          title?:     string | null
          message?:   string | null
          type?:      Database['public']['Enums']['notif_type'] | null
          is_read?:   boolean
          link?:      string | null
          cta_label?: string | null
        }
      }

      study_materials: {
        Row: {
          id:            string
          title:         string
          description:   string | null
          type:          StudyMaterialType
          file_url:      string | null
          notes_content: string | null
          program_id:    string | null
          category:      string | null
          is_published:  boolean
          created_at:    string
          updated_at:    string
          created_by:    string | null
          meeting_url:   string | null
        }
        Insert: {
          id?:           string
          title:         string
          type:          StudyMaterialType
          description?:  string | null
          file_url?:     string | null
          notes_content?: string | null
          program_id?:   string | null
          category?:     string | null
          is_published?: boolean
          created_at?:   string
          updated_at?:   string
          created_by?:   string | null
          meeting_url?:  string | null
        }
        Update: {
          id?:           string
          title?:        string
          type?:         StudyMaterialType
          description?:  string | null
          file_url?:     string | null
          notes_content?: string | null
          program_id?:   string | null
          category?:     string | null
          is_published?: boolean
          created_at?:   string
          updated_at?:   string
          created_by?:   string | null
          meeting_url?:  string | null
        }
      }

      // ── favorites ─────────────────────────────────────────────────────────────
      favorites: {
        Row: {
          id:          string
          user_id:     string
          material_id: string
          created_at:  string
        }
        Insert: {
          id?:         string
          user_id:     string
          material_id: string
          created_at?: string
        }
        Update: {
          user_id?:     string
          material_id?: string
        }
      }

      // ── practice_completions ──────────────────────────────────────────────────
      practice_completions: {
        Row: {
          student_id:   string
          exam_id:      string
          completed_at: string
        }
        Insert: {
          student_id:    string
          exam_id:       string
          completed_at?: string
        }
        Update: {
          completed_at?: string
        }
      }

      // ── faculty ───────────────────────────────────────────────────────────────
      // role_types: array of role types a faculty member holds — a faculty
      // member (or program head) may hold more than one at once, e.g.
      // ['professional', 'major'] or ['professional', 'major', 'minor'].
      faculty: {
        Row: {
          id:         string
          user_id:    string | null
          faculty_id: string           
          full_name:  string
          admin_id:   string | null  // FK to admins.admin_id for faculty who are also admins
          school_id: string | null 
          program_id: string | null
          email:      string
          department: string | null
          role_types: FacultyRoleTypeEnum[]
          is_program_head: boolean
          is_active:  boolean
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?:         string
          user_id?:    string | null
          faculty_id:  string
          full_name:   string
          admin_id?:    string | null
          school_id?:   string | null
          program_id?:  string | null
          email:       string
          department?:  string | null
          role_types?: FacultyRoleTypeEnum[]
          is_program_head?: boolean
          is_active?:  boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?:    string | null
          faculty_id?: string
          full_name?:  string
          admin_id?:   string | null
          school_id?:   string | null
          program_id?:  string | null
          email?:      string
          department?:  string | null
          role_types?: FacultyRoleTypeEnum[]
          is_program_head?: boolean
          is_active?:  boolean
          updated_at?: string
        }
        Relationships: []
      }

      // ── admins ────────────────────────────────────────────────────────────────
      admins: {
        Row: {
          id:         string
          user_id:    string | null
          admin_id:   string           
          full_name:  string
          email:      string
          created_at: string
        }
        Insert: {
          id?:         string
          user_id?:    string | null
          admin_id:    string
          full_name:   string
          email:       string
          created_at?: string
        }
        Update: {
          user_id?:   string | null
          admin_id?:  string
          full_name?: string
          email?:     string
        }
        Relationships: []
      }

      // ── users ─────────────────────────────────────────────────────────────────
      users: {
        Row: {
          id:         string
          role:       UserRole
          created_at: string
        }
        Insert: {
          id:          string
          role:        UserRole
          created_at?: string
        }
        Update: {
          role?: UserRole
        }
      }

    }>

    Views: AddViewRelationships<{
      published_study_materials: {
        Row: {
          id:            string
          title:         string
          description:   string | null
          type:          StudyMaterialType
          file_url:      string | null
          notes_content: string | null
          category:      string | null
          created_at:    string
          program_id:    string | null
          meeting_url:   string | null
          program_code:  string | null
          program_name:  string | null
        }
      }
    }>

    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    Functions: {} 

    Enums: {
      user_role:         UserRole
      submission_status: SubmissionStatus
      storage_purpose:   StoragePurpose
      question_type:     QuestionType
      exam_type:         ExamType
      grading_mode:      GradingMode
      notif_type: 'info' | 'warning' | 'success' | 'error'
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    CompositeTypes: {}
  }
}

// ── Table Helpers ──────────────────────────────────────────────────────────────

export type Tables = {
  [K in keyof Database['public']['Tables']]: Database['public']['Tables'][K]['Row']
}[keyof Database['public']['Tables']]

export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']

// ── View Helpers ───────────────────────────────────────────────────────────────
// Mirrors the Tables helper pattern for views so components can do:
//   type PublishedMaterialRow = ViewRow<'published_study_materials'>
export type ViewRow<V extends keyof Database['public']['Views']> =
  Database['public']['Views'][V]['Row']
