// components/dashboard/student/profile/ProfileInfo.tsx
'use client'

import { motion }          from 'framer-motion'
import {
  Mail, BookOpen, GraduationCap, Target,
  Hash, Building2, User,
} from 'lucide-react'
import { staggerContainer, fadeUp } from '@/animations/profile/profile'
import type { ProfileRow, StudentRow, ProgramRow, SchoolRow } from '@/lib/services/student/profile/profile.service'
import styles from '@/app/(dashboard)/student/profile/profile.module.css'

interface Props {
  profile:        ProfileRow | null
  student:        StudentRow | null
  program:        ProgramRow | null
  school:         SchoolRow  | null
  schoolDisplay:  string
  programDisplay: string
}

export function ProfileInfo({
  profile,
  student,
  schoolDisplay,
  programDisplay,
}: Props) {
  const INFO_ROWS = [
    { Icon: Mail,          iconColor: '#2563eb', iconBg: '#eff6ff', label: 'Email',       value: profile?.email          ?? '—' },
    { Icon: Hash,          iconColor: '#7c3aed', iconBg: '#f5f3ff', label: 'Student ID',  value: student?.student_id     ?? '—' },
    { Icon: GraduationCap, iconColor: '#d97706', iconBg: '#fffbeb', label: 'Program',     value: programDisplay                  },
    { Icon: BookOpen,      iconColor: '#059669', iconBg: '#f0fdf4', label: 'Year Level',  value: student?.year_level ? `Year ${student.year_level}` : '—' },
    { Icon: Building2,     iconColor: '#0891b2', iconBg: '#ecfeff', label: 'School',      value: schoolDisplay                   },
    { Icon: Target,        iconColor: '#dc2626', iconBg: '#fef2f2', label: 'Target Exam', value: student?.target_exam    ?? '—' },
  ]

  return (
    <motion.div className={styles.card} variants={fadeUp}>
      <div className={styles.cardHead}>
        <span className={styles.cardTitle}>
          <span className={styles.cardTitleIcon}>
            <User size={14} color="#1e3a5f" />
          </span>
          Personal Information
        </span>
      </div>

      <motion.div
        className={styles.infoList}
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {INFO_ROWS.map((row) => (
          <motion.div key={row.label} className={styles.infoRow} variants={fadeUp}>
            <div className={styles.infoIconWrap} style={{ background: row.iconBg }}>
              <row.Icon size={14} color={row.iconColor} strokeWidth={2} />
            </div>
            <div>
              <div className={styles.infoLabel}>{row.label}</div>
              <div className={`${styles.infoValue} ${row.value === '—' ? styles.infoValueMuted : ''}`}>
                {row.value}
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  )
}