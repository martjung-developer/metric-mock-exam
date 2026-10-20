// components/dashboard/student/StudentTopbar.tsx
//
// FIXED:
//  - Shows real avatar image from profile.avatar_url
//  - Falls back to initials if no avatar
//  - Subscribes to realtime profile changes so avatar updates without refresh

'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Image                 from 'next/image'
import Link                  from 'next/link'
import { Bell, Search, ChevronDown, UserCircle2, LogOut }      from 'lucide-react'
import { createClient }      from '@/lib/supabase/client'
import { useUnreadCount }    from '@/lib/hooks/notifications/useUnreadCount'
import { useRealtimeProfile } from '@/lib/hooks/shared/useRealtimeProfile'
import { useRealtimeNotificationAlerts } from '@/lib/hooks/notifications/useRealtimeNotificationAlerts'
import ThemeToggleButton from '@/components/shared/dashboard/ThemeToggleButton'
import type { Profile }      from '@/lib/types/auth'
import styles                from './StudentTopbar.module.css'

interface Props {
  profile: Profile
  userId:  string
}

export default function StudentTopbar({ profile, userId }: Props) {
  const supabase = useMemo(() => createClient(), [])
  // Start with whatever the server-rendered profile has; realtime will update.
  const [avatarUrl,   setAvatarUrl]   = useState<string | null>(profile.avatar_url ?? null)
  const [displayName, setDisplayName] = useState<string>(profile.full_name ?? 'Student')
  const [menuOpen, setMenuOpen] = useState(false)

  // ── Realtime: update avatar + name without refresh ────────────────────────
  useRealtimeProfile({
    supabase,
    userId,
    onUpdate: useCallback((updated) => {
      if (updated.avatar_url !== undefined) {setAvatarUrl(updated.avatar_url)}
      if (updated.full_name  !== undefined) {setDisplayName(updated.full_name ?? 'Student')}
    }, []),
  })

  const unreadCount = useUnreadCount(userId)
  useRealtimeNotificationAlerts(userId)

  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'S'

  async function handleLogout() {
    window.location.href = '/api/auth/signout'
  }

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null
      if (!target) { return }
      if (!target.closest('[data-topbar-profile-menu="student"]')) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) {
      document.addEventListener('click', onDocClick)
      return () => document.removeEventListener('click', onDocClick)
    }
  }, [menuOpen])
  return (
    <header className={styles.topbar}>

      {/* Search */}
      <div className={styles.searchWrap}>
        <Search size={14} strokeWidth={2} color="#94a3b8" />
        <input
          type="text"
          placeholder="Search exams, materials, reviewers..."
          className={styles.searchInput}
          aria-label="Search"
        />
      </div>

      {/* Right */}
      <div className={styles.right}>
        <ThemeToggleButton className={styles.refreshBtn} />

        <Link
          href="/student/notifications"
          className={styles.notifBtn}
          title={unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'Notifications'}
          aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}
        >
          <Bell size={16} strokeWidth={2} />
          {unreadCount > 0 && (
            <span className={styles.notifBadge} aria-hidden="true">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Link>

        <div className={styles.divider} />

        {/* User pill — image or initials fallback */}
        <div className={styles.profileMenuWrap} data-topbar-profile-menu="student">
        <button
          className={styles.userPill}
          onClick={() => setMenuOpen((v) => !v)}
          type="button"
          aria-expanded={menuOpen}
          aria-haspopup="menu"
        >
          <div className={styles.avatarSmall}>
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={displayName}
                width={32}
                height={32}
                className={styles.avatarImg}
                unoptimized
              />
            ) : (
              initials
            )}
          </div>
          <div>
            <div className={styles.userName}>{displayName.split(' ')[0]}</div>
            <div className={styles.userRole}>Student</div>
          </div>
          <ChevronDown size={12} className={styles.userChevron} />
        </button>
          {menuOpen && (
            <div className={styles.profileMenu} role="menu">
              <Link href="/student/profile" className={styles.profileMenuItem} role="menuitem" onClick={() => setMenuOpen(false)}>
                <UserCircle2 size={14} /> Account Settings
              </Link>
              <button type="button" className={`${styles.profileMenuItem} ${styles.profileMenuDanger}`} onClick={handleLogout} role="menuitem">
                <LogOut size={14} /> Logout
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  )
}
