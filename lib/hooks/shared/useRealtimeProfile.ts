/**
 * lib/hooks/shared/useRealtimeProfile.ts
 *
 * Subscribes to realtime changes on the `profiles` row for the given userId.
 * Updates the provided setter whenever avatar_url or full_name changes in DB.
 */

'use client'

import { useEffect, useRef } from 'react'
import type {
  SupabaseClient,
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'

type ProfileRow = Database['public']['Tables']['profiles']['Row']

interface UseRealtimeProfileOptions {
  supabase: SupabaseClient<Database>
  userId: string | null
  onUpdate: (updated: Partial<ProfileRow>) => void
}

export function useRealtimeProfile({
  supabase,
  userId,
  onUpdate,
}: UseRealtimeProfileOptions): void {
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!userId) {return}

    // ✅ UNIQUE CHANNEL NAME (critical fix)
    const channelName = `profile:${userId}:${crypto.randomUUID()}`

    const channel = supabase.channel(channelName)

    channel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${userId}`,
      },
      (payload: RealtimePostgresChangesPayload<ProfileRow>) => {
        const row = payload.new
        if (!row || !('id' in row)) {return}

        const updated: Partial<ProfileRow> = {}

        if (typeof row.avatar_url === 'string' || row.avatar_url === null) {
          updated.avatar_url = row.avatar_url
        }

        if (typeof row.full_name === 'string' || row.full_name === null) {
          updated.full_name = row.full_name
        }

        if (typeof row.email === 'string') {
          updated.email = row.email
        }

        if (Object.keys(updated).length > 0) {
          onUpdate(updated)
        }
      }
    )

    channel.subscribe()
    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [supabase, userId, onUpdate])
}