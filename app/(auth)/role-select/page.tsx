// app/(auth)/role-select/page.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Entry point for the auth flow. User picks a role → /login?role=X
// UI-only: no auth logic. Detected role from ID overrides this at login.
// ─────────────────────────────────────────────────────────────────────────────
'use client'

import Link          from 'next/link'
import { useRouter } from 'next/navigation'
import { motion }    from 'framer-motion'
import {
  GraduationCap, BookOpen, ShieldCheck, ArrowLeft, ChevronRight,
} from 'lucide-react'
import { RoleSelectBackground } from '@/animations/auth/RoleSelectBackground'
import styles from './role-select.module.css'

// ── Role card data ────────────────────────────────────────────────────────────

const ROLES = [
  {
    key:         'student'  as const,
    icon:        GraduationCap,
    title:       'Student',
    description: 'Access your exams, study materials, and academic progress.',
    hint:        'YY-NNNN-NNN',
  },
  {
    key:         'faculty'  as const,
    icon:        BookOpen,
    title:       'Faculty',
    description: 'Manage course content, exams, and student performance.',
    hint:        'PREFIX-NNNNN',
  },
  {
    key:         'admin'    as const,
    icon:        ShieldCheck,
    title:       'Department Admin',
    description: 'Oversee programs, faculty, and institutional data.',
    hint:        'PREFIX-NNNNN',
  },
] as const

// ── Animation variants ────────────────────────────────────────────────────────

const containerVariants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.09 } },
}

const itemVariants = {
  hidden:  { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] } },
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function RoleSelectPage() {
  const router = useRouter()

  function handleRoleSelect(role: 'student' | 'faculty' | 'admin') {
    router.push(`/login?role=${role}`)
  }

  return (
    <>
      <RoleSelectBackground />

      <div className={styles.page}>

        {/* ── Back to site ── */}
        <motion.div
          className={styles.backRow}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.08 }}
        >
          <Link href="/" className={styles.backLink}>
            <ArrowLeft size={13} strokeWidth={2.5} />
            Back to site
          </Link>
        </motion.div>

        {/* ── Heading ── */}
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1 className={styles.heading}>What Role Are You In?</h1>
          <p className={styles.subheading}>
            Select your role to continue. Your ID will be verified at log in page.
          </p>
        </motion.div>

        {/* ── Role cards ── */}
        <motion.div
          className={styles.grid}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {ROLES.map(({ key, icon: Icon, title, description, hint }) => (
            <motion.button
              key={key}
              className={styles.card}
              data-role={key}
              variants={itemVariants}
              onClick={() => handleRoleSelect(key)}
              whileTap={{ scale: 0.975 }}
              type="button"
            >
              <div className={styles.iconWrap}>
                <Icon size={21} strokeWidth={1.8} />
              </div>

              <div className={styles.cardBody}>
                <span className={styles.cardTitle}>{title}</span>
                <span className={styles.cardDesc}>{description}</span>
              </div>

              <span className={styles.cardHint}>{hint}</span>

              <ChevronRight size={16} strokeWidth={2} className={styles.cardArrow} />
            </motion.button>
          ))}
        </motion.div>

        {/* ── Footer ── */}
        <motion.p
          className={styles.footer}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Already signed in?{' '}
          <Link href="/student/dashboard" className={styles.footerLink}>
            Go to login
          </Link>
        </motion.p>

      </div>
    </>
  )
}