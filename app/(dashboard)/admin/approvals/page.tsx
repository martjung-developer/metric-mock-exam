// app/(dashboard)/admin/approvals/page.tsx
'use client'

import { useEffect }    from 'react'
import { useRouter }    from 'next/navigation'
import {
  ClipboardCheck, RefreshCw, X,
  CheckCircle2, XCircle, Rocket,
  FileText, Database, Filter,
  MessageSquare,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

import { useUser }           from '@/lib/context/AuthContext'
import { useApprovalQueue }  from '@/lib/hooks/approval/useApprovalQueue'
import { StatusBadge }       from '@/components/shared/approval/StatusBadge'
import { ApprovalHistoryTimeline } from '@/components/shared/approval/ApprovalHistoryTimeline'
import type { ApprovalEntityType } from '@/lib/types/approval'
import styles from './approvals.module.css'

const ENTITY_ICONS: Record<ApprovalEntityType | 'all', React.ReactNode> = {
  all:           <Filter size={13} />,
  exam:          <FileText size={13} />,
  question:      <MessageSquare size={13} />,
  question_bank: <Database size={13} />,
}

export default function ApprovalsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useUser()
  const q = useApprovalQueue()

  // Auth guard — admins only
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
    if (role !== 'admin') {
      router.replace('/unauthorized')
    }
  }, [user, authLoading, router])

  if (authLoading) {
    return null
  }

  return (
    <div className={styles.page}>

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}>
            <ClipboardCheck size={20} color="#fff" />
          </div>
          <div>
            <h1 className={styles.heading}>Questionnaire Review Queue</h1>
            <p className={styles.headingSub}>
              {q.loading
                ? 'Loading…'
                : `${q.items.length} item${q.items.length !== 1 ? 's' : ''} pending questionnaire review`}
            </p>
          </div>
        </div>
        <button
          className={styles.refreshBtn}
          onClick={q.handleRefresh}
          disabled={q.refreshing}
        >
          <RefreshCw size={14} className={q.refreshing ? styles.spinning : ''} />
          {q.refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {/* Filter tabs */}
      <div className={styles.filterRow}>
        {(['all', 'exam', 'question_bank'] as const).map((type) => (
          <button
            key={type}
            className={`${styles.filterTab} ${q.filterType === type ? styles.filterTabActive : ''}`}
            onClick={() => q.setFilterType(type)}
          >
            {ENTITY_ICONS[type]}
            {type === 'all'           ? 'All'
             : type === 'exam'        ? 'Exams'
             : 'Question Banks'}
            <span className={styles.filterCount}>
              {type === 'all'
                ? q.items.length
                : q.items.filter((i) => i.entityType === type).length}
            </span>
          </button>
        ))}
      </div>

      {/* Error */}
      <AnimatePresence>
        {q.error && (
          <motion.div
            className={styles.errorBanner}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
          >
            {q.error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Queue list */}
      {q.loading ? (
        <div className={styles.skeletonList}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={styles.skeletonCard} />
          ))}
        </div>
      ) : q.filteredItems.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <ClipboardCheck size={22} color="#94a3b8" />
          </div>
          <p className={styles.emptyTitle}>Queue is empty</p>
          <p className={styles.emptySub}>No questionnaires are pending review right now.</p>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Exam Title</th>
                <th>Faculty Name</th>
                <th>Program</th>
                <th>Submitted</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {q.filteredItems.map((item) => (
                <tr key={item.id}>
                  <td>{item.title}</td>
                  <td>{item.submittedByName ?? item.submittedBy ?? '—'}</td>
                  <td>{item.programCode ?? item.programName ?? '—'}</td>
                  <td>
                    {item.submittedAt
                      ? new Date(item.submittedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                      : '—'}
                  </td>
                  <td><StatusBadge status={item.status} size="sm" /></td>
                  <td>
                    <button
                      className={styles.reviewBtn}
                      onClick={() => q.openReview(item)}
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Review Modal */}
      <AnimatePresence>
        {q.selectedItem && (
          <motion.div
            className={styles.modalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                q.closeReview()
              }
            }}
          >
            <motion.div
              className={styles.reviewModal}
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            >
              {/* Modal header */}
              <div className={styles.reviewModalHeader}>
                <div>
                  <div className={styles.entityTypeTag} style={{ marginBottom: 4 }}>
                    {ENTITY_ICONS[q.selectedItem.entityType]}
                    <span>{q.selectedItem.entityType === 'exam' ? 'Exam' : 'Question Bank'}</span>
                  </div>
                  <h2 className={styles.reviewModalTitle}>{q.selectedItem.title}</h2>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: 6 }}>
                    {q.selectedItem.programCode && (
                      <span className={styles.metaChip}>{q.selectedItem.programCode}</span>
                    )}
                    <StatusBadge status={q.selectedItem.status} size="sm" />
                  </div>
                </div>
                <button className={styles.closeBtn} onClick={q.closeReview}>
                  <X size={16} />
                </button>
              </div>

              {/* Modal body */}
              <div className={styles.reviewModalBody}>
                {/* Review notes input */}
                <div className={styles.notesSection}>
                  <label className={styles.notesLabel}>
                    Review Notes
                    <span style={{ color: '#94a3b8', fontWeight: 400, marginLeft: 4 }}>
                      (optional — visible to faculty)
                    </span>
                  </label>
                  <textarea
                    className={styles.notesInput}
                    placeholder="Add feedback for the faculty member…"
                    rows={3}
                    value={q.reviewNotes}
                    onChange={(e) => q.setReviewNotes(e.target.value)}
                  />
                </div>

                {/* Approval history */}
                <div className={styles.historySection}>
                  <p className={styles.historySectionTitle}>Approval History</p>
                  <ApprovalHistoryTimeline
                    events={q.history}
                    loading={q.historyLoading}
                  />
                </div>
              </div>

              {/* Modal actions */}
              <div className={styles.reviewModalFooter}>
                <button
                  className={styles.rejectBtn}
                  onClick={q.handleReject}
                  disabled={q.acting}
                >
                  <XCircle size={14} />
                  {q.acting ? 'Processing…' : 'Reject'}
                </button>
                <div style={{ flex: 1 }} />
                <button
                  className={styles.approveBtn}
                  onClick={q.handleApprove}
                  disabled={q.acting}
                >
                  <CheckCircle2 size={14} />
                  {q.acting ? 'Processing…' : 'Approve'}
                </button>
                <button
                  className={styles.publishBtn}
                  onClick={q.handlePublish}
                  disabled={q.acting}
                >
                  <Rocket size={14} />
                  {q.acting ? 'Processing…' : 'Approve & Publish'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
