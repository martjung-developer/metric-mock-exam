// app/(dashboard)/student/practice-exams/[examId]/page.tsx
'use client'

import { useRouter, useParams } from 'next/navigation'
import { usePracticeExam }      from '@/lib/hooks/student/practice-exams/usePracticeExam'
import PracticeExamShell        from '@/components/dashboard/student/practice-exams/PracticeExamShell'

export default function PracticeExamPage() {
  const { examId } = useParams<{ examId: string }>()
  const router     = useRouter()
  const hook       = usePracticeExam(examId)

  return (
    <PracticeExamShell
      hook={hook}
      onBack={() => router.push('/student/reviewer')}
    />
  )
} 
