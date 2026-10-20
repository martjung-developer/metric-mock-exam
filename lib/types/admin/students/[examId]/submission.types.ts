// lib/types/admin/students/[examId]/submission.types.ts
import type { Database } from '@/lib/types/database'

export type ExamType = Database['public']['Enums']['exam_type'] // if needed

export type SubmissionStatus = Database['public']['Enums']['submission_status']

export type ServiceResult<T = void> =
  | { data: T;    error: null   }
  | { data: null; error: string }

export interface JoinedExamForSubmission {
  title:     string | null
  exam_type: string | null
}

export interface SubmissionRaw {
  id:           string
  exam_id:      string | null
  status:       string
  score:        number | null  
  percentage:   number | null
  passed:       boolean | null
  submitted_at: string | null
  exams:        JoinedExamForSubmission | JoinedExamForSubmission[] | null
}

export interface Submission {
  id:           string
  exam_title:   string
  exam_type:    ExamType          
  status:       SubmissionStatus
  score:        number | null   
  percentage:   number | null
  passed:       boolean | null
  submitted_at: string | null
}