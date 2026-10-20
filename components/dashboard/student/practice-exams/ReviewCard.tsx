// components/dashboard/student/practice-exams/ReviewCard.tsx
import Image from 'next/image'
import { Clock, BookOpen, GraduationCap, Lock, PlayCircle } from 'lucide-react'
import { getProgramImagePath } from '@/lib/constants/program-images'
import { EXAM_TYPE_META } from '@/lib/types/database'
import type { ReviewItem, ExamStatus } from '@/lib/services/student/practice-exams/practiceExamList.service'
import styles from '@/app/(dashboard)/student/practice-exams/reviews.module.css'

function StatusBadge({ status }: { status: ExamStatus }) {
  return (
    <span className={`${styles.badge} ${status === 'available' ? styles.badgeAvailable : styles.badgeComingSoon}`}>
      {status === 'available' ? 'Available' : 'Coming Soon'}
    </span>
  )
}

interface ReviewCardProps {
  item:    ReviewItem
  onStart: (id: string) => void
}

export default function ReviewCard({ item, onStart }: ReviewCardProps) {
  const isAvailable = item.status === 'available'
  const programImage = getProgramImagePath(item.programCode)

  return (
    <div className={`${styles.examCard} ${isAvailable ? styles.examCardAvailable : ''}`}>
      <div className={`${styles.cardAccent} ${isAvailable ? styles.cardAccentAvailable : styles.cardAccentSoon}`} />

      <div className={styles.cardTop}>
        <div className={`${styles.cardIconWrap} ${isAvailable ? styles.cardIconAvailable : styles.cardIconSoon}`}>
          {programImage ? (
            <Image
              className={styles.programImage}
              src={programImage}
              alt=""
              width={640}
              height={180}
            />
          ) : (
            <GraduationCap size={28} strokeWidth={1.75} />
          )}
        </div>
        <div className={styles.cardBadges}>
          <span className={styles.examTypePill}>
            {EXAM_TYPE_META['practice'].label}
          </span>
          <StatusBadge status={item.status} />
        </div>
      </div>

      <div className={styles.cardBody}>
        <p className={styles.shortCode}>{item.shortCode}</p>
        <h3 className={styles.programName}>{item.title}</h3>
        <span className={styles.categoryTag}>{item.program}</span>
      </div>

      {isAvailable && (
        <div className={styles.cardMeta}>
          <span className={styles.metaItem}>
            <BookOpen size={13} strokeWidth={2} />
            {item.questions ?? '—'} items
          </span>
          <span className={styles.metaItem}>
            <Clock size={13} strokeWidth={2} />
            {item.duration ?? '—'}
          </span>
        </div>
      )}

      <div className={styles.cardFooter}>
        {isAvailable ? (
          <button className={styles.startBtn} onClick={() => onStart(item.id)}>
            <PlayCircle size={15} strokeWidth={2} /> Start Review
          </button>
        ) : (
          <button className={styles.disabledBtn} disabled>
            <Lock size={13} strokeWidth={2} /> Not Available
          </button>
        )}
      </div>
    </div>
  )
}
