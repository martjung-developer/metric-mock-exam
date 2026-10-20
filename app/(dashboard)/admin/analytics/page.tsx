// app/(dashboard)/admin/analytics/page.tsx — auth guard + layout only.

'use client'

// Main page
import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { BarChart2, AlertTriangle, RefreshCw } from 'lucide-react'

// Libraries
import { useUser } from '@/lib/context/AuthContext'
import { useAnalytics } from '@/lib/hooks/admin/analytics/useAnalytics'

// Components
import OverviewCards   from '@/components/dashboard/admin/analytics/OverviewCards'
import ProgramChart    from '@/components/dashboard/admin/analytics/ProgramChart'
import ExamChart       from '@/components/dashboard/admin/analytics/ExamChart'
import TopStudents     from '@/components/dashboard/admin/analytics/TopStudents'
import AtRiskStudents  from '@/components/dashboard/admin/analytics/AtRiskStudents'
import EngagementCard  from '@/components/dashboard/admin/analytics/EngagementCard'

// Styles
import styles from './analytics.module.css'
import { containerVariants, sectionVariants, chartVariants } from '@/animations/admin/analytics/analytics'

// ── Role type guard ──────────────────────────────────────────────────────────
function resolveRole(user: { user_metadata?: Record<string, unknown>; app_metadata?: Record<string, unknown> }): string | undefined {
  const fromMeta    = user.user_metadata?.['role']
  const fromAppMeta = user.app_metadata?.['role']
  if (typeof fromMeta    === 'string') { return fromMeta }
  if (typeof fromAppMeta === 'string') { return fromAppMeta }
  return undefined
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function AnalyticsDashboardPage() {
  const router             = useRouter()
  const { user, profile, loading: authLoading } = useUser()

  const {
    data,
    loading,
    error,
    refreshed,
    selectedProgram,
    setSelectedProgram,
    refresh,
  } = useAnalytics()

  // ── Auth / role guard ──────────────────────────────────────────────────────
  useEffect(() => {
    if (authLoading) {
      return
    }
    if (!user) { router.replace('/login'); return }
    const role = profile?.role ?? resolveRole(user)
    if (role !== 'admin' && role !== 'faculty') {
      router.replace('/unauthorized')
    }
  }, [user, profile?.role, authLoading, router])

  // ── Skeleton while loading ─────────────────────────────────────────────────
  if (authLoading || loading) {
    return (
      <div className={styles.page}>
        <div className={styles.overviewGrid}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={styles.skeletonCard}>
              <div className={styles.skeleton} style={{ width: 40, height: 40, borderRadius: 10 }} />
              <div>
                <div className={styles.skeleton} style={{ width: 70, height: 24, marginBottom: 6 }} />
                <div className={styles.skeleton} style={{ width: 90, height: 12 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <motion.div
      className={styles.page}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* ── Header ── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}>
            <BarChart2 size={20} color="#fff" strokeWidth={2.2} />
          </div>
          <div>
            <h1 className={styles.heading}>Analytics</h1>
            <p className={styles.headingSub}>
              Performance overview · scores from released exams only
              {refreshed && <> · refreshed {refreshed.toLocaleTimeString()}</>}
            </p>
          </div>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnSecondary} onClick={refresh}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* ── Program Filter Buttons ── */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <button
          className={`${styles.btnSecondary} ${selectedProgram === 'all' ? styles.filterBtnActive : ''}`}
          onClick={() => setSelectedProgram('all')}
          style={{ fontWeight: selectedProgram === 'all' ? 700 : 500 }}
        >
          All Programs
        </button>
        {data.programs.map((prog) => (
          <button
            key={prog.id}
            className={`${styles.btnSecondary} ${selectedProgram === prog.id ? styles.filterBtnActive : ''}`}
            onClick={() => setSelectedProgram(prog.id)}
            style={{ fontWeight: selectedProgram === prog.id ? 700 : 500 }}
          >
            {prog.code}
          </button>
        ))}
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div className={styles.errorBanner}>
          <AlertTriangle size={15} /> {error}
        </div>
      )}

      {/* ── Overview Cards ── */}
      <OverviewCards overview={data.overview} />

      {/* ── Charts Row ── */}
      <motion.div
        className={styles.chartsRow}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={chartVariants}>
          <ProgramChart programPerf={data.programPerf} />
        </motion.div>
        <motion.div variants={chartVariants}>
          <ExamChart examPerf={data.examPerf} />
        </motion.div>
      </motion.div>

      {/* ── Bottom Row ── */}
      <motion.div
        className={styles.bottomRow}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
      >
        <TopStudents    topStudents={data.topStudents} />
        <AtRiskStudents atRisk={data.atRisk}           />
        <EngagementCard engagement={data.engagement}   />
      </motion.div>
    </motion.div>
  )
}
