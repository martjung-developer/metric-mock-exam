// components/dashboard/admin/exams/detail/ExamSectionsNav.tsx

import React, { useMemo } from 'react'
import Link from 'next/link'
import {
  BookOpen, HelpCircle, Users, ClipboardList, BarChart2, ChevronRight,
} from 'lucide-react'
import type { ExamDetail } from '@/lib/types/admin/exams/detail/exam.types'
import s from '@/app/(dashboard)/admin/exams/[examId]/detail.module.css'

type NavColor = 'blue' | 'violet' | 'amber' | 'green'

interface SubpageDef {
  href:  string
  icon:  React.ElementType
  label: string
  desc:  string
  count: number | null
  color: NavColor
}

interface ExamSectionsNavProps {
  examId: string
  exam:   ExamDetail
  assignmentLocked?: boolean
  assignmentLockReason?: string
}

export default function ExamSectionsNav({ examId, exam, assignmentLocked = false, assignmentLockReason }: ExamSectionsNavProps) {
  const subpages: SubpageDef[] = useMemo(
    () => [
      {
        href:  `/admin/exams/${examId}/questions`,
        icon:  HelpCircle,
        label: 'Questions',
        desc:  'Manage exam questions',
        count: exam.question_count,
        color: 'blue',
      },
      {
        href:  `/admin/exams/${examId}/assignments`,
        icon:  Users,
        label: 'Assignments',
        desc:  'View assigned students',
        count: exam.assigned_count,
        color: 'violet',
      },
      {
        href:  `/admin/exams/${examId}/submissions`,
        icon:  ClipboardList,
        label: 'Submissions',
        desc:  'View student submissions',
        count: exam.submission_count,
        color: 'amber',
      },
      {
        href:  `/admin/exams/${examId}/results`,
        icon:  BarChart2,
        label: 'Results',
        desc:  'Graded scores and performance',
        count: null,
        color: 'green',
      },
    ],
    [examId, exam.question_count, exam.assigned_count, exam.submission_count],
  )

  return (
    <div className={s.card}>
      <div className={s.cardHeader}>
        <BookOpen size={15} color="var(--primary)" />
        <h2 className={s.cardTitle}>Exam Sections</h2>
      </div>
      <div className={s.navList}>
        {subpages.map((sp) => {
          const locked = assignmentLocked && sp.label === 'Assignments'
          if (locked) {
            return (
              <div key={sp.href} className={`${s.navItem} ${s[`navItem_${sp.color}`]} ${s.navItemLocked}`} title={assignmentLockReason}>
                <div className={`${s.navIcon} ${s[`navIcon_${sp.color}`]}`}>
                  <sp.icon size={17} />
                </div>
                <div className={s.navContent}>
                  <div className={s.navLabel}>{sp.label}</div>
                  <div className={s.navDesc}>{assignmentLockReason}</div>
                </div>
                {sp.count !== null && <span className={s.navCount}>{sp.count}</span>}
                <ChevronRight size={14} className={s.navChevron} />
              </div>
            )
          }
          return (
            <Link key={sp.href} href={sp.href} className={`${s.navItem} ${s[`navItem_${sp.color}`]}`}>
            <div className={`${s.navIcon} ${s[`navIcon_${sp.color}`]}`}>
              <sp.icon size={17} />
            </div>
            <div className={s.navContent}>
              <div className={s.navLabel}>{sp.label}</div>
              <div className={s.navDesc}>{sp.desc}</div>
            </div>
            {sp.count !== null && (
              <span className={s.navCount}>{sp.count}</span>
            )}
            <ChevronRight size={14} className={s.navChevron} />
          </Link>
          )
        })}
      </div>
    </div>
  )
}
