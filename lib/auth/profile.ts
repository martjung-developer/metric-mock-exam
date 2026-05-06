import type { SupabaseClient, User } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'
import type { UserRole } from '@/lib/types/auth/'

export interface AuthProfile {
  id: string
  email: string
  role: UserRole
  full_name: string | null
  school_id: string | null
  program_id: string | null
}

export async function fetchProfileByUserId(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<AuthProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, role')
    .eq('id', userId)
    .single()

  if (error || !data) {
    return null
  }

  const base = {
    id: data.id,
    email: data.email,
    role: data.role,
    full_name: data.full_name,
  } as const

  if (data.role === 'student') {
    const { data: student } = await supabase
      .from('students')
      .select('school_id, program_id')
      .eq('id', userId)
      .single()

    return {
      ...base,
      school_id: student?.school_id ?? null,
      program_id: student?.program_id ?? null,
    }
  }

  if (data.role === 'faculty') {
    const { data: faculty } = await supabase
      .from('faculty')
      .select('school_id, program_id')
      .eq('user_id', userId)
      .single()

    return {
      ...base,
      school_id: faculty?.school_id ?? null,
      program_id: faculty?.program_id ?? null,
    }
  }

  const { data: admin } = await supabase
    .from('admins')
    .select('school_id')
    .eq('user_id', userId)
    .single()

  return {
    ...base,
    school_id: admin?.school_id ?? null,
    program_id: null,
  }
}

export async function fetchProfileForUser(
  supabase: SupabaseClient<Database>,
  user: User | null,
): Promise<AuthProfile | null> {
  if (!user) {
    return null
  }
  return fetchProfileByUserId(supabase, user.id)
}
