// components/dashboard/admin/students/detail/StudentProfileCard.tsx
import Link   from 'next/link'
import { Bell, Pencil } from 'lucide-react'
import type { StudentProfile } from '@/lib/types/admin/students/[examId]/student.types'
import { getInitials }         from '@/lib/utils/admin/students/helpers'
import { formatDate, yearLabel } from '@/lib/utils/admin/students/format'
import styles from '@/app/(dashboard)/admin/students/[id]/student-detail.module.css'

interface Props {
  profile:    StudentProfile
  studentId:  string
  onNotify:   () => void
}

export function StudentProfileCard({ profile, studentId, onNotify }: Props) {
  const initials = getInitials(profile.full_name, profile.email)

  return (
    <div className={styles.profileCard}>
      <div className={styles.profileLeft}>
        <div className={styles.profileAvatar}>
          {profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar_url}
              alt={profile.full_name ?? ''}
              className={styles.avatarImg}
            />
          ) : (
            <span className={styles.avatarInitials}>{initials}</span>
          )}
        </div>
        <div>
          <h1 className={styles.profileName}>{profile.full_name ?? '—'}</h1>
          <div className={styles.profileMeta}>
            <span>{profile.email}</span>
            {profile.student_id   && <span>· ID: {profile.student_id}</span>}
            {profile.program_code && (
              <span className={styles.programChip}>{profile.program_code}</span>
            )}
            {profile.year_level   && (
              <span className={styles.yearChip}>{yearLabel(profile.year_level)}</span>
            )}
            {profile.school       && <span>· {profile.school}</span>}
            <span style={{ color: '#9ca3af' }}>· Joined {formatDate(profile.created_at)}</span>
          </div>
        </div>
      </div>

      <div className={styles.profileActions}>
        <button className={styles.btnOutline} onClick={onNotify}>
          <Bell size={14} /> Notify
        </button>
        <Link href={`/admin/students/${studentId}/edit`} className={styles.btnOutline}>
          <Pencil size={14} /> Edit
        </Link>
      </div>
    </div>
  )
}