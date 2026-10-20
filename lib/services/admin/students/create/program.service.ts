// lib/services/admin/students/create/program.service.ts
//
// Data access for the programs table.
// No UI, no React — returns typed domain objects or throws.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database }       from '@/lib/types/database'
import type { Program, ProgramRow } from '@/lib/types/admin/students/create/program.types'

type SupabaseDB = SupabaseClient<Database>

/**
 * Fetches all programs ordered by code.
 * Returns a typed Program[] or throws on Supabase error.
 */
export async function getPrograms(supabase: SupabaseDB): Promise<Program[]> {
  const { data, error } = await supabase
    .from('programs')
    .select('id, code, name')
    .order('code', { ascending: true })

  if (error) {throw new Error(error.message)}

  return (data as ProgramRow[]).map((row) => ({
    id:   row.id,
    code: row.code,
    name: row.name,
  }))
}