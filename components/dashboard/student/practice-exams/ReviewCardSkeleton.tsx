// components/dashboard/student/practice-exams/ReviewCardSkeleton.tsx
import styles from '@/app/(dashboard)/student/practice-exams/reviews.module.css'

export default function ReviewCardSkeleton() {
  return (
    <div className={styles.examCard} style={{ minHeight: 260 }}>
      <div style={{ height: 4, background: '#e4ecf3', borderRadius: '13px 13px 0 0' }} />
      <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#f0f4f8' }} />
          <div style={{ width: 80, height: 20, borderRadius: 99, background: '#f0f4f8' }} />
        </div>
        <div style={{ width: '40%', height: 12, borderRadius: 6, background: '#f0f4f8' }} />
        <div style={{ width: '80%', height: 16, borderRadius: 6, background: '#f0f4f8' }} />
        <div style={{ width: '55%', height: 12, borderRadius: 99, background: '#f0f4f8' }} />
      </div>
    </div>
  )
}