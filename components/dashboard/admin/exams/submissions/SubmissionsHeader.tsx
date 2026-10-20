// components/dashboard/admin/exams/submissions/SubmissionsHeader.tsx
import Link from 'next/link'
import { ClipboardList, ArrowLeft, RefreshCw } from 'lucide-react'
import s from '@/app/(dashboard)/admin/exams/[examId]/submissions/submissions.module.css'

interface SubmissionsHeaderProps {
  examId:     string
  totalCount: number
  loading:    boolean
  onRefresh:  () => void
}

export function SubmissionsHeader({ examId, totalCount, loading, onRefresh }: SubmissionsHeaderProps) {
  return (
    <div className={s.header}>
      <Link href={`/admin/exams/${examId}`} className={s.backBtn}>
        <ArrowLeft size={14} /> Back to Exam
      </Link>
      <div className={s.headerMain}>
        <div className={s.headerLeft}>
          <div className={s.headerIcon}><ClipboardList size={20} color="#fff" /></div>
          <div>
            <h1 className={s.heading}>Submissions</h1>
            <p className={s.headingSub}>{totalCount} total · Grading &amp; Release</p>
          </div>
        </div>
        <button className={s.btnSecondary} onClick={onRefresh} disabled={loading}>
          <RefreshCw size={13} className={loading ? s.spinner : ''} /> Refresh
        </button>
      </div>
    </div>
  )
}