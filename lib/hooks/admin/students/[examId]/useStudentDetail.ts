// lib/hooks/admin/students/[examId]/useStudentDetail.ts
import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient }      from '@/lib/supabase/client'
import { getStudentProfile } from '@/lib/services/admin/students/[examId]/student.service'
import { getAssignedExams }  from '@/lib/services/admin/students/[examId]/exam.service'
import { getSubmissions }    from '@/lib/services/admin/students/[examId]/submission.service'
import { getNotifications }  from '@/lib/services/admin/students/[examId]/notification.service'
import type { StudentProfile } from '@/lib/types/admin/students/[examId]/student.types'
import type { AssignedExam }   from '@/lib/types/admin/students/[examId]/exam.types'
import type { Submission }     from '@/lib/types/admin/students/[examId]/submission.types'
import type { Notification }   from '@/lib/types/admin/students/[examId]/notification.types'

export interface UseStudentDetailReturn {
  profile:        StudentProfile | null
  assignedExams:  AssignedExam[]
  submissions:    Submission[]
  notifications:  Notification[]
  loading:        boolean
  error:          string | null
  refetch:        () => void
  refetchNotifications: () => Promise<void>
}

export function useStudentDetail(studentId: string): UseStudentDetailReturn {
  const supabase = useMemo(() => createClient(), [])

  const [profile,       setProfile]       = useState<StudentProfile | null>(null)
  const [assignedExams, setAssignedExams] = useState<AssignedExam[]>([])
  const [submissions,   setSubmissions]   = useState<Submission[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState<string | null>(null)
  const [tick,          setTick]          = useState(0)

  const refetch = useCallback(() => setTick((t) => t + 1), [])

  const refetchNotifications = useCallback(async () => {
    try {
      const notifs = await getNotifications(supabase, studentId)
      setNotifications(notifs)
    } catch { /* silently ignore */ }
  }, [supabase, studentId])

  // ── Realtime: re-fetch submissions when any submission for this student changes
  useEffect(() => {
    if (!studentId) { return }

    const channel = supabase
      .channel(`submissions:student:${studentId}`)
      .on(
        'postgres_changes',
        {
          event:  '*',           // INSERT, UPDATE, DELETE
          schema: 'public',
          table:  'submissions',
          filter: `student_id=eq.${studentId}`,
        },
        () => {
          // Re-fetch submissions slice only (cheap, targeted)
          void getSubmissions(supabase, studentId).then(setSubmissions)
        },
      )
      .subscribe()

    return () => { void supabase.removeChannel(channel) }
  }, [supabase, studentId])

  // ── Main fetch ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!studentId) { return }
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      try {
        const [prof, exams, subs, notifs] = await Promise.all([
          getStudentProfile(supabase, studentId),
          getAssignedExams(supabase, studentId),
          getSubmissions(supabase, studentId),
          getNotifications(supabase, studentId),
        ])

        if (cancelled) { return }
        setProfile(prof)
        setAssignedExams(exams)
        setSubmissions(subs)
        setNotifications(notifs)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load student data.')
        }
      } finally {
        if (!cancelled) { setLoading(false) }
      }
    }

    void load()
    return () => { cancelled = true }
  }, [studentId, supabase, tick])

  return {
    profile, assignedExams, submissions, notifications,
    loading, error, refetch, refetchNotifications,
  }
}