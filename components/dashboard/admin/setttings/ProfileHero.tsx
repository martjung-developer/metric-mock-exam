// components/dashboard/admin/settings/ProfileHero.tsx
//
// FIXED:
//  - Uses Next.js <Image> instead of bare <img> (removes the eslint-disable)
//  - Accepts liveAvatarUrl so the hero reflects an upload without page refresh
//  - Initials fallback renders correctly when no avatar exists

import Image   from 'next/image'
import { Shield } from 'lucide-react'
import { motion } from 'framer-motion'
import { avatarVariants, sectionVariants } from '@/animations/admin/settings/settings'
import type { Profile } from '@/lib/types/admin/settings/settings.types'
import s from '@/app/(dashboard)/admin/settings/settings.module.css'
import type { JSX } from 'react'

interface ProfileHeroProps {
  profile:      Profile
  /** Pass avatarUrl from useSettings — updated by realtime + optimistic writes */
  avatarUrl:    string | null
  initials:     string
}

export function ProfileHero({ profile, avatarUrl, initials }: ProfileHeroProps): JSX.Element {
  return (
    <motion.div className={s.profileHero} variants={sectionVariants}>
      <motion.div
        className={s.avatarWrapper}
        variants={avatarVariants}
        whileHover="hover"
        initial="visible"
        animate="visible"
      >
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={profile.full_name ?? 'Profile avatar'}
            width={80}
            height={80}
            className={s.avatar}
            unoptimized
          />
        ) : (
          <div className={s.avatarFallback}>{initials}</div>
        )}
      </motion.div>

      <div className={s.heroInfo}>
        <h2 className={s.heroName}>{profile.full_name || 'No name set'}</h2>
        <p className={s.heroEmail}>{profile.email}</p>
        <span className={s.heroBadge}>
          <Shield size={10} />
          {profile.role === 'admin' ? 'Administrator' : 'Faculty'}
        </span>
      </div>
    </motion.div>
  )
}