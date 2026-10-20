// lib/constants/student/practice-exams/practice-exams.ts

export const PRACTICE_AUTO_SAVE_DEBOUNCE_MS = 1_200

// Question types that can be auto-graded
export const AUTO_GRADE_TYPES = new Set([
  'multiple_choice',
  'true_false',
  'fill_blank',
] as const)

export const PRACTICE_STATUS = {
  /** Student has started but not yet submitted. */
  IN_PROGRESS: 'in_progress',
 
  /** Student has submitted — awaiting admin review. */
  SUBMITTED:   'submitted',
 
  /** Admin has released the result to the student. */
  RELEASED:    'released',
} as const
 
export type PracticeStatus = (typeof PRACTICE_STATUS)[keyof typeof PRACTICE_STATUS]