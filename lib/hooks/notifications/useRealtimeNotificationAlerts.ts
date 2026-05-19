'use client'

import { useEffect, useMemo, useRef } from 'react'
import type { RealtimePostgresInsertPayload } from '@supabase/supabase-js'
import Swal from 'sweetalert2'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/types/database'

type NotificationRow = Database['public']['Tables']['notifications']['Row']

export function useRealtimeNotificationAlerts(userId: string | null): void {
  const supabase = useMemo(() => createClient(), [])
  const seenIds = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!userId) {
      return
    }

    const channel = supabase
      .channel(`alerts:notifications:${userId}`)
      .on<NotificationRow>(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload: RealtimePostgresInsertPayload<NotificationRow>) => {
          const row = payload.new
          if (!row || seenIds.current.has(row.id)) {
            return
          }
          seenIds.current.add(row.id)
          const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
          void Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'info',
            title: row.title ?? 'New notification',
            text: row.message ?? '',
            timer: 3500,
            showConfirmButton: false,
            timerProgressBar: true,
            background: isDark ? '#0f172a' : '#ffffff',
            color: isDark ? '#e2e8f0' : '#0f172a',
          })
        },
      )

    channel.subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [supabase, userId])
}
