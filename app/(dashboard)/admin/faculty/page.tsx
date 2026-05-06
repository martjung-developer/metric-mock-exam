// app/(dashboard)/admin/faculty/page.tsx
'use client'

import { useState, useCallback } from 'react'
import { UserPlus, RefreshCw, Users } from 'lucide-react'
import { useFacultyList }   from '@/lib/hooks/admin/faculty/useFacultyList'
import FacultyTable          from '@/components/dashboard/admin/faculty/FacultyTable'
import FacultyStatsBar       from '@/components/dashboard/admin/faculty/FacultyStatsBar'
import AddFacultyModal       from '@/components/dashboard/admin/faculty/AddFacultyModal'
import styles                from './faculty.module.css'

export default function FacultyPage() {
  const { faculty, loading, error, refetch } = useFacultyList()
  const [modalOpen, setModalOpen] = useState(false)
  const [toast,     setToast]     = useState<string | null>(null)

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 4000)
  }, [])

  function handleSuccess(facultyId: string) {
    showToast(`Faculty account created — ID: ${facultyId}`)
    refetch()
  }

  return (
    <div className={styles.page}>

      {/* ── Outer container with left-accent border ── */}
      <div className={styles.container}>

        {/* ── Header — mirrors Students page header exactly ── */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon} aria-hidden="true">
              <Users size={22} strokeWidth={1.8} />
            </div>
            <div>
              <h1 className={styles.title}>Faculty Members</h1>
              <p className={styles.subtitle}>
                {loading && faculty.length === 0
                  ? 'Loading…'
                  : `${faculty.length} faculty member${faculty.length !== 1 ? 's' : ''}`}
              </p>
            </div>
          </div>

          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.refreshBtn}
              onClick={refetch}
              disabled={loading}
              aria-label="Refresh faculty list"
            >
              <RefreshCw size={14} className={loading ? styles.spinning : ''} />
            </button>

            <button
              type="button"
              className={styles.addBtn}
              onClick={() => setModalOpen(true)}
            >
              <UserPlus size={15} />
              Add Faculty
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div className={styles.content}>

          {/* Stats — only once data is available */}
          {!error && faculty.length > 0 && (
            <FacultyStatsBar faculty={faculty} />
          )}

          {/* Error */}
          {error && (
            <div className={styles.errorBox} role="alert">{error}</div>
          )}

          {/* Skeleton — first load only */}
          {loading && faculty.length === 0 && !error && (
            <div className={styles.skeleton}>
              <div className={styles.skeletonHeader} />
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className={styles.skeletonRow} />
              ))}
            </div>
          )}

          {/* Table — show with stale data during refetch too */}
          {!error && faculty.length > 0 && (
            <div className={styles.tableWrap}>
              <FacultyTable faculty={faculty} onRefresh={refetch} />
            </div>
          )}

          {/* Empty state after load */}
          {!loading && !error && faculty.length === 0 && (
            <div className={styles.tableWrap}>
              <FacultyTable faculty={[]} onRefresh={refetch} />
            </div>
          )}

        </div>
      </div>

      {/* ── Modal ── */}
      <AddFacultyModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleSuccess}
      />

      {/* ── Toast ── */}
      {toast && (
        <div className={styles.toast} role="status" aria-live="polite">
          {toast}
        </div>
      )}

    </div>
  )
}