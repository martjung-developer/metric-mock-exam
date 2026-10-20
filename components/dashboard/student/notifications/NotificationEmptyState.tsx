// components/dashboard/student/notifications/NotificationEmptyState.tsx
// Pure UI — shown when filtered list is empty.

import { BookOpen, ClipboardList, Inbox } from 'lucide-react'
import Link from 'next/link'
import type { FilterTab } from '@/lib/types/student/notifications/notifications.types'
import styles from '@/app/(dashboard)/student/notifications/notifications.module.css'
import type { JSX } from 'react'

interface NotificationEmptyStateProps {
  activeTab: FilterTab
}

export function NotificationEmptyState({
  activeTab,
}: NotificationEmptyStateProps): JSX.Element {
  const isUnread = activeTab === 'unread'

  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyIcon}>
        <Inbox size={26} />
      </div>

      <p className={styles.emptyTitle}>
        {isUnread ? 'No unread notifications' : "You're all caught up"}
      </p>

      <p className={styles.emptySubtitle}>
        {isUnread
          ? 'All your notifications have been read.'
          : 'Notifications will appear here once available.'}
      </p>

      <div className={styles.emptyActions}>
        <Link href="/student/mock-exams" className={styles.emptyBtnPrimary}>
          <ClipboardList size={14} />
          Start a Mock Exam
        </Link>
        <Link href="/student/study-materials" className={styles.emptyBtnSecondary}>
          <BookOpen size={14} />
          Review Study Materials
        </Link>
      </div>
    </div>
  )
}