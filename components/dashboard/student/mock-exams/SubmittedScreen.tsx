// components/dashboard/student/mock-exams/SubmittedScreen.tsx
import { CheckCircle2 } from 'lucide-react'
import styles from '@/app/(dashboard)/student/mock-exams/[examId]/mock.module.css'

interface Props {
  examTitle: string
  onBack:    () => void
}

export function SubmittedScreen({ examTitle, onBack }: Props) {
  return (
    <div className={styles.results}>
      <div className={styles.resultsCard}>
        <div className={styles.resultsIconWrap} style={{ background: '#dbeafe', border: '2px solid #93c5fd' }}>
          <CheckCircle2 size={28} color="#1d4ed8" />
        </div>
        <h1 className={styles.resultsTitle}>Exam Submitted!</h1>
        <p className={styles.resultsSub}>
          Your answers for <strong>{examTitle}</strong> have been recorded.
        </p>
        <div style={{
          background: '#eff6ff', border: '1.5px solid #bfdbfe', borderRadius: 10,
          padding: '0.9rem 1.1rem', margin: '1rem 0',
          fontSize: '0.84rem', color: '#1e40af', lineHeight: 1.6, textAlign: 'left',
        }}>
          <strong>What happens next?</strong><br />
          Your submission is now under faculty review. Results will appear once
          your exam has been graded. You will be notified when your score is available.
        </div>
        <button className={styles.btnBack} onClick={onBack}>Back to Exams</button>
      </div>
    </div>
  )
}