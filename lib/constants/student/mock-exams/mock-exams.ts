// lib/constants/student/mock-exams/mock-exams.ts

export const PAGE_SIZE          = 12
export const ALL_CATEGORIES     = 'All Categories'
export const TIMER_WARNING      = 300   
export const TIMER_CRITICAL     = 60    
export const MAX_TAB_VIOLATIONS = 3

export const MOCK_STATUS = {
  IN_PROGRESS: 'in_progress',
  SUBMITTED:   'submitted',
  RELEASED:    'released',
} as const
 
export type MockStatus = (typeof MOCK_STATUS)[keyof typeof MOCK_STATUS]