// lib/types/admin/students/edit/program.types.ts

import type { Database } from '@/lib/types/database'

export type ProgramRow    = Database['public']['Tables']['programs']['Row']
export type ProgramOption = Pick<ProgramRow, 'id' | 'code' | 'name'>