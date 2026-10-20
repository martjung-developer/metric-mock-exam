'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { fetchSubmissionStatus } from '@/lib/services/student/results/results.service'
import s from './pending.module.css'

export default function PendingResultPage() {
  const router = useRouter()
  const { submissionId } = useParams<{ submissionId: string }>()
  const supabase = createClient()

  useEffect(() => {
    let mounted = true

    async function checkStatus() {
      const { status } = await fetchSubmissionStatus(supabase, submissionId)
      if (!mounted) {return}
      if (status === 'released') {
        router.replace(`/student/results/${submissionId}`)
      }
    }

    const intervalId = window.setInterval(() => { void checkStatus() }, 30000)
    void checkStatus()

    const channel = supabase
      .channel(`pending:submission:${submissionId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'submissions', filter: `id=eq.${submissionId}` },
        () => { void checkStatus() },
      )
      .subscribe()

    return () => {
      mounted = false
      window.clearInterval(intervalId)
      void supabase.removeChannel(channel)
    }
  }, [router, submissionId, supabase])

  return (
    <div className={s.page}>
      <div className={s.card}>
        <Link href="/student/results" className={s.backBtn}>
          <ArrowLeft size={16} /> Back
        </Link>

        <div className={s.hero}>
          <div className={s.orb} />
          <h1 className={s.title}>Results Pending Release</h1>
          <p className={s.subtext}>
            Your faculty or admin is reviewing your exam. You&apos;ll receive a notification here and on your Notifications page once your results are released.
          </p>
        </div>

        <div className={s.actions}>
          <Link href="/student/notifications" className={s.notifBtn}>Go to Notifications</Link>
        </div>

        <div className={s.checking}>
          <span>Checking for updates…</span>
          <span className={s.dot} />
        </div>
      </div>
    </div>
  )
}
