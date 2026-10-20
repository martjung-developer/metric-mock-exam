// lib/services/admin/students/edit/program.service.ts

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database }       from '@/lib/types/database'
import type { ProgramOption }  from '@/lib/types/admin/students/edit/program.types'

type DB = SupabaseClient<Database>

export async function getPrograms(supabase: DB): Promise<ProgramOption[]> {
  const { data } = await supabase
    .from('programs')
    .select('id, code, name')
    .order('code', { ascending: true })
    .returns<ProgramOption[]>()

  return data ?? []
}