/**
 * lib/types/admin/students/program.types.ts
 *
 * Program domain types used on the students page.
 * Derived from Database['public']['Tables'] — zero `any`.
 */

import type { Database } from '@/lib/types/database'

// ── Raw Supabase row alias ────────────────────────────────────────────────────

export type ProgramRow = Database['public']['Tables']['programs']['Row']

// ── Scoped subset used after SELECT projection ────────────────────────────────

export interface Program {
  id:   string
  code: string
  name: string
}

// ── Service result shape ──────────────────────────────────────────────────────

export interface FetchProgramsResult {
  programs: Program[]
  error:    string | null
}