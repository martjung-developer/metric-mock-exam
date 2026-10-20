// app/(dashboard)/student/dashboard/DashboardClient.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Thin orchestrator — all data logic lives in hooks and services.
// This component only wires props to UI modules.
// ─────────────────────────────────────────────────────────────────────────────
'use client'

import { type FC, useState }      from 'react'
import Link             from 'next/link'
import Image            from 'next/image'
import { motion }       from 'framer-motion'
import { Clock, ChevronRight } from 'lucide-react'
import { dashboardPage, section } from '@/animations/dashboard/dashboardAnimations'
import styles           from './dashboard/dashboard.module.css'

import { useStudentDashboard }  from '@/lib/hooks/student/dashboard/useStudentDashboard'
import { useRealtimeDashboard } from '@/lib/hooks/student/dashboard/useRealtimeDashboard'

import { DashboardHeader }  from '@/components/dashboard/student/dashboard/DashboardHeader'
import { StatCards }        from '@/components/dashboard/student/dashboard/StatCards'
import { QuickActions }     from '@/components/dashboard/student/dashboard/QuickActions'
import { ProgressOverview } from '@/components/dashboard/student/dashboard/ProgressOverview'
import { AssignedExams }    from '@/components/dashboard/student/dashboard/AssignedExams'
import { RecentActivity }   from '@/components/dashboard/student/dashboard/RecentActivity'

interface Props {
  firstName: string
  greeting:  string
}

const DashboardClient: FC<Props> = ({ firstName, greeting }) => {
  const { data, loading, error, refresh } = useStudentDashboard()
  const [refreshing, setRefreshing] = useState(false)

  // Wire real-time subscriptions — automatically triggers refresh on DB events
  useRealtimeDashboard({ onRefresh: refresh })

  const { stats, progress, recentActivity, assignedExams } = data

  async function handleRefresh() {
    if (refreshing) {
      return
    }
    setRefreshing(true)
    await refresh()
    setTimeout(() => setRefreshing(false), 500)
  }

  return (
    <motion.div className={styles.page} {...dashboardPage}>

      {/* ── Header ── */}
      <DashboardHeader
        firstName={firstName}
        greeting={greeting}
        refreshing={refreshing}
        onRefresh={() => { void handleRefresh() }}
      />

      {/* ── Hero Banner ── */}
      <motion.div className={styles.heroBanner} {...section}>
        <Image
          src="/images/lccb_student_img.jpeg"
          alt=""
          fill
          sizes="100vw"
          className={styles.heroImage}
          aria-hidden="true"
          priority
        />
        <div className={styles.heroOverlay} aria-hidden="true" />
        <div className={styles.heroText}>
          <div className={styles.heroEyebrow}>Board Exam Prep</div>
          <h2 className={styles.heroTitle}>
            Ready to ace your Licensure Exam?
          </h2>
          <p className={styles.heroSub}>
            Take mock exams, practice with reviewers, and track your progress — all in one place.
          </p>
          <Link href="/student/mock-exams" className={styles.heroCta}>
            Browse Exams <ChevronRight size={14} strokeWidth={2.5} />
          </Link>
        </div>
        <div className={styles.heroEmoji}></div>
      </motion.div>

      {/* ── Error banner ── */}
      {error !== null && (
        <motion.div {...section} style={{
          background:   '#fef2f2',
          border:       '1.5px solid #fecaca',
          borderRadius: 10,
          padding:      '0.8rem 1rem',
          fontSize:     '0.82rem',
          color:        '#991b1b',
          fontWeight:   600,
        }}>
          Could not load dashboard data: {error}
        </motion.div>
      )}

      {/* ── Pending submissions notice ── */}
      {!loading && stats.pendingCount > 0 && (
        <motion.div {...section} style={{
          background:   '#fffbeb',
          border:       '1.5px solid #fde68a',
          borderRadius: 10,
          padding:      '0.8rem 1rem',
          display:      'flex',
          alignItems:   'flex-start',
          gap:          '0.6rem',
        }}>
          <Clock size={16} color="#d97706" style={{ marginTop: 2, flexShrink: 0 }} />
          <div>
            <p style={{
              fontSize: '0.82rem', fontWeight: 700,
              color: '#92400e', margin: '0 0 2px',
            }}>
              {stats.pendingCount} result{stats.pendingCount > 1 ? 's' : ''} pending faculty review
            </p>
            <p style={{ fontSize: '0.77rem', color: '#b45309', margin: 0 }}>
              Scores will appear once your faculty grades your submission.
            </p>
          </div>
        </motion.div>
      )}

      {/* ── Stat Cards ── */}
      <StatCards stats={stats} loading={loading} />

      {/* ── Main Grid ── */}
      <div className={styles.mainGrid}>

        {/* LEFT column */}
        <div className={styles.leftCol}>
          <QuickActions />
          <RecentActivity items={recentActivity} loading={loading} />
        </div>

        {/* RIGHT column */}
        <div className={styles.rightCol}>
          <ProgressOverview progress={progress} loading={loading} />
          <AssignedExams assignedExams={assignedExams} loading={loading} />

          {/* Study tip */}
          <motion.div className={styles.tipCard} {...section}>
            <div className={styles.tipEyebrow}>Study Tip</div>
            <p className={styles.tipText}>
              Consistent daily practice beats last-minute cramming. Aim for at least one reviewer per day!
            </p>
            <Link href="/student/reviewer" className={styles.tipBtn}>
              Start Reviewing →
            </Link>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}

export default DashboardClient
