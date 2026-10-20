// components/dashboard/student/profile/ProfileHero.tsx
'use client'

import { motion }         from 'framer-motion'
import { GraduationCap, Target, Hash, School } from 'lucide-react'
import { AvatarUploader } from '@/components/dashboard/student/profile/image/AvatarUploader'
import { heroVariants, avatarVariants } from '@/animations/profile/profile'
import type { ProfileRow, StudentRow, ProgramRow } from '@/lib/services/student/profile/profile.service'
import styles from '@/app/(dashboard)/student/profile/profile.module.css'

interface Props {
  profile:        ProfileRow | null
  student:        StudentRow | null
  program:        ProgramRow | null
  displayName:    string
  initials:       string
  liveAvatarUrl:  string | null
  userId:         string
  onAvatarChange: (url: string | null) => void
}

export function ProfileHero({
  profile,
  student,
  program,
  displayName,
  initials,
  liveAvatarUrl,
  userId,
  onAvatarChange,
}: Props) {
  return (
    <motion.div
      className={styles.heroCard}
      variants={heroVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Avatar column — fully owned by AvatarUploader's own CSS module */}
      <motion.div
        variants={avatarVariants}
        initial="hidden"
        animate="visible"
        style={{ flexShrink: 0 }}   // prevent avatar col from squishing
      >
        <AvatarUploader
          userId={userId}
          initialAvatarUrl={liveAvatarUrl}
          initials={initials}
          onAvatarChange={onAvatarChange}
        />
      </motion.div>

      {/* Text column */}
      <div className={styles.heroInfo}>
        <h2 className={styles.heroName}>{displayName}</h2>
        <p className={styles.heroEmail}>{profile?.email}</p>

        <div className={styles.heroBadges}>
          {program?.code       && (
            <span className={`${styles.heroBadge} ${styles.badgeProgram}`}>
              <School size={10} /> {program.code}
            </span>
          )}
          {student?.year_level && (
            <span className={`${styles.heroBadge} ${styles.badgeYear}`}>
              <GraduationCap size={10} /> Year {student.year_level}
            </span>
          )}
          {student?.target_exam && (
            <span className={`${styles.heroBadge} ${styles.badgeTarget}`}>
              <Target size={10} /> {student.target_exam}
            </span>
          )}
          {student?.student_id && (
            <span className={`${styles.heroBadge} ${styles.badgeId}`}>
              <Hash size={10} /> {student.student_id}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )
}