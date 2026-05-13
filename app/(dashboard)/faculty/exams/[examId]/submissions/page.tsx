// app/(dashboard)/faculty/exams/[examId]/submissions/page.tsx
// Faculty: view exam submissions with the same UI as the admin submissions page.
'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter, useParams }         from 'next/navigation'
import Link                              from 'next/link'
import {
  ArrowLeft, RefreshCw, ClipboardList,
  Search, X, Filter,
  Eye, Clock, CheckCircle2, Send,
  Rocket, AlertCircle, ChevronLeft, ChevronRight,
  Zap, PenLine,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

import { useUser }   from '@/lib/context/AuthContext'
import styles        from './submissions.module.css'

// ─── Types ──────────────────────────────────────────────────────────────────

type SubmissionStatus = 'in_progress' | 'submitted' | 'graded' | 'reviewed' | 'released'

interface ExamSubmission {
  id: string
  student_name: string
  student_email: string
  student_id: string
  submitted_at: string | null
  started_at:   string | null
  duration_seconds: number | null
  status: SubmissionStatus
  score: number | null          // 0-100
  grading_mode: 'auto' | 'manual'
}

interface ExamMeta {
  title: string
  program_code: string
}

// ─── Status config ───────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<SubmissionStatus, { label: string; colorKey: string }> = {
  in_progress: { label: 'In Progress', colorKey: 'amber'  },
  submitted:   { label: 'Submitted',   colorKey: 'blue'   },
  graded:      { label: 'Graded',      colorKey: 'teal'   },
  reviewed:    { label: 'Reviewed',    colorKey: 'violet' },
  released:    { label: 'Released',    colorKey: 'green'  },
}

const STATUS_FILTER_TABS: Array<{ key: SubmissionStatus | 'all'; label: string }> = [
  { key: 'all',         label: 'All'         },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'submitted',   label: 'Submitted'   },
  { key: 'graded',      label: 'Graded'      },
  { key: 'reviewed',    label: 'Reviewed'    },
  { key: 'released',    label: 'Released'    },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDuration(seconds: number | null): string {
  if (seconds === null) {
    return '—'
  }
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}m ${s}s`
}

function fmtDate(iso: string | null): string {
  if (!iso) {
    return '—'
  }
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })
}

function initials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

const PAGE_SIZE = 10

// ─── Component ───────────────────────────────────────────────────────────────

export default function FacultyExamSubmissionsPage() {
  const router    = useRouter()
  const params    = useParams()
  const examId    = params?.examId as string
  const { user, loading: authLoading } = useUser()

  // ── Auth guard ──
  useEffect(() => {
    if (authLoading) {
      return
    }
    if (!user) {
      router.replace('/login')
      return
    }
    const role =
      (user.user_metadata?.['role'] as string | undefined) ??
      (user.app_metadata?.['role']  as string | undefined)
    if (role !== 'faculty' && role !== 'admin') {
      router.replace('/unauthorized')
    }
  }, [user, authLoading, router])

  // ── State ──
  const [examMeta,     setExamMeta]     = useState<ExamMeta | null>(null)
  const [submissions,  setSubmissions]  = useState<ExamSubmission[]>([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<SubmissionStatus | 'all'>('all')
  const [search,       setSearch]       = useState('')
  const [page,         setPage]         = useState(1)

  // ── Fetch ──
  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      // Replace with your actual API calls
      const [metaRes, subRes] = await Promise.all([
        fetch(`/api/faculty/exams/${examId}`),
        fetch(`/api/faculty/exams/${examId}/submissions`),
      ])
      if (!metaRes.ok || !subRes.ok) {
        throw new Error('Failed to load data')
      }
      const [meta, subs] = await Promise.all([metaRes.json(), subRes.json()])
      setExamMeta(meta)
      setSubmissions(subs)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!authLoading && user && examId) {
      fetchData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, examId])

  // ── Derived ──
  const summary = useMemo(() => ({
    in_progress: submissions.filter(s => s.status === 'in_progress').length,
    submitted:   submissions.filter(s => s.status === 'submitted').length,
    graded:      submissions.filter(s => s.status === 'graded').length,
    reviewed:    submissions.filter(s => s.status === 'reviewed').length,
    released:    submissions.filter(s => s.status === 'released').length,
  }), [submissions])

  const filtered = useMemo(() => {
    let list = submissions
    if (statusFilter !== 'all') {
      list = list.filter(s => s.status === statusFilter)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(s =>
        s.student_name.toLowerCase().includes(q)  ||
        s.student_email.toLowerCase().includes(q) ||
        s.student_id.toLowerCase().includes(q)
      )
    }
    return list
  }, [submissions, statusFilter, search])

  const totalPages  = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // Reset page when filter/search changes
  useEffect(() => {
    setPage(1)
  }, [statusFilter, search])

  if (authLoading) {
    return null
  }

  // ── Render ──
  return (
    <div className={styles.page}>

      {/* Back link */}
      <Link href={`/faculty/exams/${examId}`} className={styles.backBtn}>
        <ArrowLeft size={13} /> Back to Exam
      </Link>

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerMain}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <ClipboardList size={20} color="#fff" />
            </div>
            <div>
              <h1 className={styles.heading}>Submissions</h1>
              <p className={styles.headingSub}>
                {loading
                  ? 'Loading…'
                  : `${submissions.length} total · ${examMeta?.title ?? examId}`}
              </p>
            </div>
          </div>
          <div className={styles.headerActions}>
            <button
              className={styles.btnSecondary}
              onClick={fetchData}
              disabled={loading}
            >
              <RefreshCw size={14} className={loading ? styles.spinner : ''} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            className={styles.errorBanner}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
          >
            <AlertCircle size={14} /> {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status pills (summary) */}
      {!loading && (
        <div className={styles.statsRow}>
          {STATUS_FILTER_TABS.filter(t => t.key !== 'all').map(({ key, label }) => {
            const cfg = STATUS_CONFIG[key as SubmissionStatus]
            const count = summary[key as keyof typeof summary]
            return (
              <button
                key={key}
                className={`${styles.statPill} ${styles[`statPill_${cfg.colorKey}`]} ${statusFilter === key ? styles.statPillActive : ''}`}
                onClick={() => setStatusFilter(statusFilter === key ? 'all' : key as SubmissionStatus)}
              >
                {label} <strong>{count}</strong>
              </button>
            )
          })}
        </div>
      )}

      {/* Filter bar */}
      <div className={styles.filterBar}>
        <div className={styles.searchWrap}>
          <Search size={14} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder="Search by name, email, or student ID…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className={styles.searchClear} onClick={() => setSearch('')}>
              <X size={13} />
            </button>
          )}
        </div>
        <div className={styles.filterGroup}>
          <Filter size={13} className={styles.filterIcon} />
          <select
            className={styles.filterSelect}
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as SubmissionStatus | 'all')}
          >
            {STATUS_FILTER_TABS.map(({ key, label }) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
        {!loading && (
          <p className={styles.resultCount}>
            <strong>{filtered.length}</strong> result{filtered.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Student</th>
                <th>Student ID</th>
                <th>Submitted</th>
                <th>Time</th>
                <th>Status</th>
                <th>Score</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className={styles.skeletonRow}>
                    <td>
                      <div className={styles.skelCell}>
                        <div className={`${styles.skeleton} ${styles.skelAvatar}`} />
                        <div>
                          <div className={`${styles.skeleton} ${styles.skelText}`} style={{ width: 120 }} />
                          <div className={`${styles.skeleton} ${styles.skelText}`} style={{ width: 160, marginTop: 5 }} />
                        </div>
                      </div>
                    </td>
                    <td><div className={`${styles.skeleton} ${styles.skelText}`} style={{ width: 80 }} /></td>
                    <td><div className={`${styles.skeleton} ${styles.skelText}`} style={{ width: 120 }} /></td>
                    <td><div className={`${styles.skeleton} ${styles.skelText}`} style={{ width: 60 }} /></td>
                    <td><div className={`${styles.skeleton} ${styles.skelText}`} style={{ width: 70, borderRadius: 20 }} /></td>
                    <td><div className={`${styles.skeleton} ${styles.skelText}`} style={{ width: 50, borderRadius: 6 }} /></td>
                    <td>
                      <div className={styles.skelActions}>
                        <div className={`${styles.skeleton} ${styles.skelBtn}`} />
                      </div>
                    </td>
                  </tr>
                ))
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className={styles.emptyState}>
                      <div className={styles.emptyIcon}><ClipboardList size={22} color="#94a3b8" /></div>
                      <p className={styles.emptyTitle}>No submissions found</p>
                      <p className={styles.emptySub}>
                        {search || statusFilter !== 'all'
                          ? 'Try adjusting your search or filter.'
                          : 'No students have submitted this exam yet.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map(sub => {
                  const cfg    = STATUS_CONFIG[sub.status]
                  const isPass = sub.score !== null && sub.score >= 50
                  const isReleased = sub.status === 'released'
                  return (
                    <motion.tr
                      key={sub.id}
                      className={`${styles.tableRow} ${isReleased ? styles.tableRowReleased : ''}`}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      layout
                    >
                      {/* Student */}
                      <td>
                        <div className={styles.studentCell}>
                          <div className={styles.avatar}>
                            <span className={styles.avatarInitials}>{initials(sub.student_name)}</span>
                          </div>
                          <div>
                            <div className={styles.studentName}>{sub.student_name}</div>
                            <div className={styles.studentEmail}>{sub.student_email}</div>
                          </div>
                        </div>
                      </td>
                      {/* ID */}
                      <td>
                        <span className={styles.idChip}>{sub.student_id}</span>
                      </td>
                      {/* Submitted */}
                      <td>
                        <span className={styles.dateCell}>{fmtDate(sub.submitted_at)}</span>
                      </td>
                      {/* Time */}
                      <td>
                        <span className={styles.timeCell}>{fmtDuration(sub.duration_seconds)}</span>
                      </td>
                      {/* Status */}
                      <td>
                        <span className={`${styles.statusBadge} ${styles[`statusBadge_${cfg.colorKey}`]}`}>
                          {sub.status === 'released'    && <Rocket     size={9} />}
                          {sub.status === 'graded'      && <CheckCircle2 size={9} />}
                          {sub.status === 'submitted'   && <Send       size={9} />}
                          {sub.status === 'in_progress' && <Clock      size={9} />}
                          {sub.status === 'reviewed'    && <CheckCircle2 size={9} />}
                          {cfg.label}
                        </span>
                      </td>
                      {/* Score */}
                      <td>
                        {sub.score !== null ? (
                          <span className={`${styles.scoreChip} ${isPass ? styles.scorePass : styles.scoreFail}`}>
                            {sub.score.toFixed(1)}%
                          </span>
                        ) : (
                          <span className={styles.na}>—</span>
                        )}
                      </td>
                      {/* Actions */}
                      <td>
                        <div className={styles.actions}>
                          <Link
                            href={`/faculty/exams/${examId}/submissions/${sub.id}`}
                            className={styles.actionView}
                            title="View submission"
                          >
                            <Eye size={14} />
                          </Link>
                          {/* Grading mode indicator (read-only for faculty) */}
                          <span
                            className={styles.actionMode}
                            title={sub.grading_mode === 'auto' ? 'Auto-graded' : 'Manually graded'}
                          >
                            {sub.grading_mode === 'auto'
                              ? <Zap    size={13} />
                              : <PenLine size={13} />}
                          </span>
                        </div>
                      </td>
                    </motion.tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && filtered.length > PAGE_SIZE && (
          <div className={styles.pagination}>
            <p className={styles.pageInfo}>
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </p>
            <div className={styles.pageButtons}>
              <button
                className={styles.pageBtn}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
                .reduce<(number | 'ellipsis')[]>((acc, n, idx, arr) => {
                  if (idx > 0 && n - (arr[idx - 1] as number) > 1) {
                    acc.push('ellipsis')
                  }
                  acc.push(n)
                  return acc
                }, [])
                .map((n, i) =>
                  n === 'ellipsis' ? (
                    <span key={`e${i}`} className={styles.pageBtn} style={{ cursor: 'default' }}>…</span>
                  ) : (
                    <button
                      key={n}
                      className={`${styles.pageBtn} ${page === n ? styles.pageBtnActive : ''}`}
                      onClick={() => setPage(n as number)}
                    >
                      {n}
                    </button>
                  )
                )}
              <button
                className={styles.pageBtn}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}