// lib/hooks/notifications/useUnreadCount.ts
//
// ─────────────────────────────────────────────────────────────────────────────
// Lightweight hook: fetches the current user's unread notification count and
// keeps it live via a Supabase Realtime subscription.
//
// Deliberately minimal — no full notification list, no store dependency.
// Designed to be dropped into any topbar or sidebar without overhead.
//
// ─────────────────────────────────────────────────────────────────────────────
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/types/database'

type NotificationRow = Database['public']['Tables']['notifications']['Row']

const supabase = createClient()

export function useUnreadCount(userId: string | null): number {
  const [count, setCount] = useState(0)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  // ── Fetch count ─────────────────────────────────────────
  const fetchCount = useCallback(async () => {
    if (!userId) {return}

    const { count: unread, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false)

    if (!error && unread !== null) {
      setCount(unread)
    }
  }, [userId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchCount()
  }, [fetchCount])

  // ── Realtime subscription ──────────────────────────────
  useEffect(() => {
    if (!userId) {return}

    // ✅ CLEAN PREVIOUS
    if (channelRef.current) {
      channelRef.current.unsubscribe()
      channelRef.current = null
    }

    const channel = supabase
      .channel(`unread_count:${userId}:${Date.now()}`) 
      .on<NotificationRow>(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          void fetchCount()
        }
      )

    channel.subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe()
        channelRef.current = null
      }
    }
  }, [userId, fetchCount])

  return count
}
