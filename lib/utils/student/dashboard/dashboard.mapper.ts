// lib/utils/student/dashboard/dashboard.mapper.ts

import type {
  SubmissionRow,
  ExamRow,
  AssignmentRow,
  RecentActivityItem,
  AssignedExamItem,
  DashboardStats,
  DashboardSubmissionStatus,
} from '@/lib/types/student/dashboard/dashboard.types'
import {
  computeStreak,
  computeBestScore,
} from './dashboard.calculations'

// ── Status guard ──────────────────────────────────────────────────────────────

const TERMINAL_STATUSES = new Set<string>([
  'submitted', 'graded', 'reviewed', 'released',
])

export function isDashboardStatus(raw: string): raw is DashboardSubmissionStatus {
  return TERMINAL_STATUSES.has(raw)
}

// ── Score-visible statuses ────────────────────────────────────────────────────

function isScoreVisible(status: DashboardSubmissionStatus): boolean {
  return status === 'graded' || status === 'reviewed' || status === 'released'
}

// ── mapToStats ────────────────────────────────────────────────────────────────

export function mapToStats(
  submissions:  SubmissionRow[],
  examMap:      Map<string, ExamRow>,
): DashboardStats {
  const pendingCount = submissions.filter((s) => s.status === 'submitted').length

  const gradedCount = submissions.filter(
    (s) => s.status === 'graded' || s.status === 'reviewed' || s.status === 'released',
  ).length

  // Best score from any submission where score is revealed
  const bestScore = computeBestScore(
    submissions
      .filter((s) => isScoreVisible(s.status))
      .map((s) => s.percentage),
  )

  const reviewersDone = submissions.filter((s) => {
    const exam = s.exam_id !== null ? examMap.get(s.exam_id) : undefined
    return exam?.exam_type === 'practice'
  }).length

  const streak = computeStreak(
    submissions
      .map((s) => s.submitted_at)
      .filter((d): d is string => d !== null),
  )

  return {
    examsTaken:   submissions.length,
    pendingCount,
    gradedCount,
    bestScore,
    reviewersDone,
    streak,
  }
}

// ── mapToRecentActivity ───────────────────────────────────────────────────────

export function mapToRecentActivity(
  submissions: SubmissionRow[],
  examMap:     Map<string, ExamRow>,
  limit        = 5,
): RecentActivityItem[] {
  return submissions.slice(0, limit).map((s): RecentActivityItem => {
    const exam       = s.exam_id !== null ? examMap.get(s.exam_id) : undefined
    const scoreShown = isScoreVisible(s.status)

    return {
      id:          s.id,
      examTitle:   exam?.title    ?? 'Unknown Exam',
      examType:    exam?.exam_type ?? 'mock',
      submittedAt: s.submitted_at,
      status:      s.status,
      percentage:  scoreShown && s.percentage !== null
        ? Math.round(s.percentage)
        : null,
      passed: scoreShown ? s.passed : null,
    }
  })
}

// ── mapToAssignedExams ────────────────────────────────────────────────────────

export function mapToAssignedExams(
  assignments: AssignmentRow[],
  examMap:     Map<string, ExamRow>,
): AssignedExamItem[] {
  return assignments
    .filter((a) => a.is_active)
    .map((a): AssignedExamItem => ({
      id:         a.id,
      examId:     a.exam_id,
      examTitle:  examMap.get(a.exam_id)?.title ?? 'Unknown Exam',
      deadline:   a.deadline,
      assignedAt: a.assigned_at,
    }))
}

// ── buildExamMap ──────────────────────────────────────────────────────────────

export function buildExamMap(exams: ExamRow[]): Map<string, ExamRow> {
  return new Map(exams.map((e) => [e.id, e]))
}