// lib/hooks/student/dashboard/useRealtimeDashboard.ts
// ─────────────────────────────────────────────────────────────────────────────
// Supabase real-time subscriptions for the student dashboard.
// Triggers a refresh whenever relevant DB events fire:
//   - submissions: INSERT (student submits) or UPDATE (graded / released)
//   - exam_assignments: INSERT (new assignment added)
//
// Designed to be used alongside useStudentDashboard — it only calls `refresh`,
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useMemo, useRef } from 'react'
import { createClient }              from '@/lib/supabase/client'
import { useUser }                   from '@/lib/context/AuthContext'

interface UseRealtimeDashboardProps {
  onRefresh: () => Promise<void>
}

export function useRealtimeDashboard({ onRefresh }: UseRealtimeDashboardProps): void {
  const supabase   = useMemo(() => createClient(), [])
  const { user }   = useUser()
  const refreshRef = useRef(onRefresh)

  useEffect(() => {
    refreshRef.current = onRefresh
  }, [onRefresh])

  useEffect(() => {
    if (user === null || user === undefined) {return}

    const studentId = user.id

    // Channel: submissions changes for this student
    const submissionsChannel = supabase
      .channel(`dashboard-submissions-${studentId}`)
      .on(
        'postgres_changes',
        {
          event:  '*',  
          schema: 'public',
          table:  'submissions',
          filter: `student_id=eq.${studentId}`,
        },
        () => { void refreshRef.current() },
      )
      .subscribe()

    // Channel: exam_assignments added for this student
    const assignmentsChannel = supabase
      .channel(`dashboard-assignments-${studentId}`)
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'exam_assignments',
          filter: `student_id=eq.${studentId}`,
        },
        () => { void refreshRef.current() },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(submissionsChannel)
      void supabase.removeChannel(assignmentsChannel)
    }
  }, [supabase, user])
}