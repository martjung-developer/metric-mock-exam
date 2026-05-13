// lib/auth/profile.ts
import type { SupabaseClient, User } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'
import type { UserRole } from '@/lib/types/auth/'

type DbClient = SupabaseClient<Database>

type ProfileRow = {
  id:         string
  email:      string
  full_name:  string | null
  role:       string
  avatar_url: string | null
  created_at: string
  updated_at: string
}
 
export interface AuthProfile {
  id: string
  email: string
  role: UserRole
  full_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
  school_id: string | null
  program_id: string | null
}

export async function fetchProfileByUserId(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<AuthProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, avatar_url, created_at, updated_at')
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
    avatar_url: data.avatar_url,
    created_at: data.created_at,
    updated_at: data.updated_at,
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

  return {
    ...base,
    school_id: null,
    program_id: null,
  }
}

export async function fetchProfileForUser(
  supabase: DbClient,
  user: User | null | undefined,
): Promise<AuthProfile | null> {
  if (!user) { return null }
 
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, avatar_url, created_at, updated_at')
    .eq('id', user.id)
    .single()
 
  if (error || !data) { return null }
 
  const row = data as ProfileRow
 
  return {
    id:         row.id,
    email:      row.email,
    full_name:  row.full_name,
    role:       row.role as UserRole,
    avatar_url: row.avatar_url,
    created_at: row.created_at,
    updated_at: row.updated_at,
    school_id:  null,
    program_id: null,
  }
}