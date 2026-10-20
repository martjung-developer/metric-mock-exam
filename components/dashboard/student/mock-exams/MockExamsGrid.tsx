// components/dashboard/student/mock-exams/MockExamsGrid.tsx
import { ExamCard } from './ExamCard'
import type { MockExam } from '@/lib/types/student/mock-exams/mock-exams'
import styles from '@/app/(dashboard)/student/mock-exams/mock-exams.module.css'

interface Props {
  exams:         MockExam[]
  onStart:       (id: string) => void
  onContinue:    (id: string) => void
  onViewAttempt: (id: string) => void
}

export function MockExamsGrid({ exams, onStart, onContinue, onViewAttempt }: Props) {
  return (
    <div className={styles.grid}>
      {exams.map((exam) => (
        <ExamCard
          key={exam.id}
          exam={exam}
          onStart={onStart}
          onContinue={onContinue}
          onViewAttempt={onViewAttempt}
        />
      ))}
    </div>
  )
}