// components/dashboard/admin/students/detail/StudentTabs.tsx
import { useMemo } from 'react'
import type { ActiveTab } from '@/lib/hooks/admin/students/[examId]/useStudentTabs'
import styles from '@/app/(dashboard)/admin/students/[id]/student-detail.module.css'

interface Props {
  activeTab:          ActiveTab
  assignedExamCount:  number
  submissionCount:    number
  notificationCount:  number
  onTabChange:        (tab: ActiveTab) => void
}

export function StudentTabs({
  activeTab,
  assignedExamCount,
  submissionCount,
  notificationCount,
  onTabChange,
}: Props) {
  const TABS = useMemo(() => [
    { key: 'exams'         as ActiveTab, label: 'Assigned Exams', count: assignedExamCount  },
    { key: 'submissions'   as ActiveTab, label: 'Submissions',    count: submissionCount    },
    { key: 'notifications' as ActiveTab, label: 'Notifications',  count: notificationCount  },
  ], [assignedExamCount, submissionCount, notificationCount])

  return (
    <div className={styles.tabBar}>
      {TABS.map((tab) => (
        <button
          key={tab.key}
          className={`${styles.tabItem} ${activeTab === tab.key ? styles.tabItemActive : ''}`}
          onClick={() => onTabChange(tab.key)}
        >
          {tab.label}
          <span className={styles.tabCount}>{tab.count}</span>
        </button>
      ))}
    </div>
  )
}