// lib/auth/client-actions.ts
// NO 'use server' — these functions use browser APIs (window)

import { createClient } from '@/lib/supabase/client'
import type { AuthResult } from './actions'

export async function signInWithGoogle(): Promise<AuthResult> {
  const supabase = createClient()   

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt:      'consent',
      },
    },
  })

  if (error) {return { success: false, error: error.message }}
  return { success: true, redirectTo: '/dashboard' }
}