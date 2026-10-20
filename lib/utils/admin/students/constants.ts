/**
 * lib/utils/admin/students/constants.ts
 *
 * Shared constants for the students admin page.
 * No React, no Supabase, no side effects.
 */

/** Number of student rows shown per page. */
export const PAGE_SIZE = 15

/** Sentinel value used for the "All Programs" tab. */
export const ALL_TAB = '__all__'

/** Ordered year-level filter options shown in the year dropdown. */
export const YEAR_OPTIONS = [
  'All Years',
  '1st Year',
  '2nd Year',
  '3rd Year',
  '4th Year',
] as const

/** Inferred union type from YEAR_OPTIONS — use where the value must be one of these. */
export type YearOption = (typeof YEAR_OPTIONS)[number]