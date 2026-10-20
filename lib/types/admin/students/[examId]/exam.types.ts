// lib/types/admin/students/[examId]/exam.types.ts

import type { Database } from '@/lib/types/database'
import type { ExamType } from '@/lib/types/database'

// ── Raw DB row aliases ────────────────────────────────────────────────────────
type ExamAssignmentRow = Database['public']['Tables']['exam_assignments']['Row']

// ── Joined exam shape returned inside exam_assignments query ─────────────────
export interface JoinedExamForAssignment {
  title:     string | null
  exam_type: string | null
}

// ── Raw Supabase row from getAssignedExams() ──────────────────────────────────
// Mirrors the SELECT columns exactly:
//   id, exam_id, is_active, assigned_at, deadline,
//   exams ( title, exam_type )
export interface AssignedExamRow {
  id:          ExamAssignmentRow['id']
  exam_id:     ExamAssignmentRow['exam_id']
  is_active:   ExamAssignmentRow['is_active']
  assigned_at: ExamAssignmentRow['assigned_at']
  deadline:    ExamAssignmentRow['deadline']
  exams:       JoinedExamForAssignment | JoinedExamForAssignment[] | null
}

// ── UI-facing domain model ────────────────────────────────────────────────────
export interface AssignedExam {
  id:          string
  exam_id:     string
  exam_title:  string
  exam_type:   ExamType
  is_active:   boolean | null
  assigned_at: string | null
  deadline:    string | null
}