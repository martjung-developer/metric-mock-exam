// lib/constants/student/results.ts
import type { SubmissionStatus } from '@/lib/types/database'

export const PAGE_SIZE = 10

export const RELEASED_STATUS: SubmissionStatus = 'released'

export const PENDING_STATUSES: SubmissionStatus[] = ['submitted', 'graded']