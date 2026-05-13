// app/(dashboard)/admin/students/[id]/page.tsx
'use client'

import { use, useCallback }    from 'react'
import Link                    from 'next/link'
import { ArrowLeft }           from 'lucide-react'
import { useAuthGuard }        from '@/lib/hooks/admin/students/[examId]/useAuthGuard'
import { useStudentDetail }    from '@/lib/hooks/admin/students/[examId]/useStudentDetail'
import { useStudentTabs }      from '@/lib/hooks/admin/students/[examId]/useStudentTabs'
import { useStudentStats }     from '@/lib/hooks/admin/students/[examId]/useStudentStats'
import { useSendNotification } from '@/lib/hooks/admin/students/[examId]/useSendNotification'
import {
  LoadingState,
  ErrorState,
  StudentProfileCard,
  StudentStats,
  StudentTabs,
  AssignedExamsTable,
  SubmissionsTable,
  NotificationsList,
  SendNotificationModal,
} from '@/components/dashboard/admin/students/detail'
import styles from './student-detail.module.css'

export default function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: studentId } = use(params)

  const { authLoading }    = useAuthGuard()
  const { activeTab, setActiveTab } = useStudentTabs('exams')

  const {
    profile, assignedExams, submissions, notifications,
    loading, error,
    refetchNotifications,
  } = useStudentDetail(studentId)

  const stats = useStudentStats(submissions)

  // ── Optimistic insert handler ──────────────────────────────────────────────
  // Provided to useSendNotification so it can prepend the notification
  // immediately before the server confirms. We type it correctly here.
  // Note: the hook will call refetchNotifications() after the server responds
  // to replace the optimistic entry with real data.
  // We use useCallback to keep the reference stable.

  // We need to wire the optimistic notification into the detail hook's state.
  // Because useStudentDetail owns the notifications array, we expose a
  // lightweight callback that calls refetchNotifications (which re-reads from
  // the server). For true optimistic UI the hook would need a setter, but
  // since useSendNotification already calls onRefreshAfterSend, both paths
  // converge on the server state.
  const handleOptimisticSent = useCallback(() => {
    // Intentionally a no-op here: the modal closes immediately (handled
    // inside useSendNotification), and onRefreshAfterSend will update the
    // list. Override this if you want instant prepend before the server call.
  }, [])

  const notify = useSendNotification({
    studentId,
    onSent:             handleOptimisticSent,
    onRefreshAfterSend: refetchNotifications,
  })

  // ── Guards ─────────────────────────────────────────────────────────────────
  if (authLoading || loading) { return <LoadingState /> }
  if (error || !profile)      { return <ErrorState message={error} /> }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className={styles.page}>

      {/* Back */}
      <Link href="/admin/students" className={styles.backLink}>
        <ArrowLeft size={14} /> Back to Students
      </Link>

      {/* Profile card */}
      <StudentProfileCard
        profile={profile}
        studentId={studentId}
        onNotify={notify.open}
      />

      {/* Stats */}
      <StudentStats
        stats={stats}
        assignedExamCount={assignedExams.length}
        submissionCount={submissions.length}
        notificationCount={notifications.length}
      />

      {/* Tabs */}
      <StudentTabs
        activeTab={activeTab}
        assignedExamCount={assignedExams.length}
        submissionCount={submissions.length}
        notificationCount={notifications.length}
        onTabChange={setActiveTab}
      />

      {/* Tab content */}
      <div className={styles.tabContent}>
        <div className={styles.tableCard}>
          {activeTab === 'exams' && (
            <AssignedExamsTable exams={assignedExams} />
          )}
          {activeTab === 'submissions' && (
            <SubmissionsTable submissions={submissions} />
          )}
          {activeTab === 'notifications' && (
            <NotificationsList
              notifications={notifications}
              onOpenModal={notify.open}
            />
          )}
        </div>
      </div>

      {/* Modal */}
      {notify.isOpen && (
        <SendNotificationModal
          studentName={profile.full_name}
          form={notify.form}
          errors={notify.errors}
          sending={notify.sending}
          onField={notify.setField}
          onSubmit={notify.submit}
          onClose={notify.close}
        />
      )}
    </div>
  )
}
