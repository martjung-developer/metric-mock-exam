// lib/hooks/student/profile/useProfile.ts

'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter }           from 'next/navigation'
import { createClient }        from '@/lib/supabase/client'
import { useUser }             from '@/lib/context/AuthContext'
import { useRealtimeProfile }  from '@/lib/hooks/shared/useRealtimeProfile'
import {
  getProfile,
  getStudent,
  getProgram,
  getSchool,
  getTotalTaken,
  getRecentSubmissions,
  type ProfileRow,
  type StudentRow,
  type ProgramRow,
  type SchoolRow,
  type SubmissionRow,
} from '@/lib/services/student/profile/profile.service'

export interface UseProfileReturn {
  profile:          ProfileRow | null
  student:          StudentRow | null
  program:          ProgramRow | null
  school:           SchoolRow  | null
  submissions:      SubmissionRow[]
  totalTaken:       number
  liveAvatarUrl:    string | null
  setLiveAvatarUrl: (url: string | null) => void
  loading:          boolean
  error:            string | null
  authLoading:      boolean
  authError:        string | null
  refetch:          () => Promise<void>
}

export function useProfile(): UseProfileReturn {
  const router   = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const { user, loading: authLoading, error: authError } = useUser()

  const [profile,       setProfile]       = useState<ProfileRow   | null>(null)
  const [student,       setStudent]       = useState<StudentRow   | null>(null)
  const [program,       setProgram]       = useState<ProgramRow   | null>(null)
  const [school,        setSchool]        = useState<SchoolRow    | null>(null)
  const [submissions,   setSubmissions]   = useState<SubmissionRow[]>([])
  const [totalTaken,    setTotalTaken]    = useState(0)
  const [liveAvatarUrl, setLiveAvatarUrl] = useState<string | null>(null)
  const [loading,       setLoading]       = useState(false)
  const [error,         setError]         = useState<string | null>(null)

  const fetchAll = useCallback(async (userId: string) => {
    setLoading(true)
    setError(null)

    try {
      const [profileData, studentData] = await Promise.all([
        getProfile(supabase, userId),
        getStudent(supabase, userId),
      ])

      const [programData, schoolData] = await Promise.all([
        studentData?.program_id ? getProgram(supabase, studentData.program_id) : Promise.resolve(null),
        studentData?.school_id ? getSchool(supabase, studentData.school_id) : Promise.resolve(null),
      ])

      const [taken, subs] = await Promise.all([
        getTotalTaken(supabase, userId),
        getRecentSubmissions(supabase, userId),
      ])

      setProfile(profileData)
      setStudent(studentData)
      setProgram(programData)
      setSchool(schoolData)
      setTotalTaken(taken)
      setSubmissions(subs)
      setLiveAvatarUrl(profileData?.avatar_url ?? null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // ── Realtime profile updates ──────────────────────────────────────────────
  useRealtimeProfile({
    supabase,
    userId: user?.id ?? null,
    onUpdate: useCallback((updated) => {
      if (updated.avatar_url !== undefined) {
        setLiveAvatarUrl(updated.avatar_url)
        setProfile((p) => (p ? { ...p, avatar_url: updated.avatar_url ?? null } : p))
      }
      if (updated.full_name !== undefined) {
        setProfile((p) => (p ? { ...p, full_name: updated.full_name ?? null } : p))
      }
    }, []),
  })

  // ── Data fetch ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (authLoading) {return}
    if (!user) { router.push('/login'); return }

    let cancelled = false

    void (async () => {
      await fetchAll(user.id)
      if (cancelled) {
        return
      }
    })()
    return () => { cancelled = true }
  }, [authLoading, fetchAll, router, user])  

  const refetch = useCallback(async () => {
    if (!user?.id) {
      return
    }
    await fetchAll(user.id)
  }, [fetchAll, user])

  return {
    profile, student, program, school,
    submissions, totalTaken,
    liveAvatarUrl, setLiveAvatarUrl,
    loading, error,
    authLoading, authError,
    refetch,
  }
}
