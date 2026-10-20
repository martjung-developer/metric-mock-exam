// components/dashboard/admin/AdminTopbar.tsx
//
// FIXED:
//  - Shows real avatar image from profiles.avatar_url (not just initials)
//  - Falls back to initials if no avatar
//  - Subscribes to realtime profile changes so avatar updates instantly
//  - Correctly fetches full_name + avatar_url in one query

'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Image                   from 'next/image'
import Link                    from 'next/link'
import { usePathname } from 'next/navigation'
import { Search, Bell, Settings, ChevronDown, GraduationCap, UserCircle2, LogOut } from 'lucide-react'
import { createClient }        from '@/lib/supabase/client'
import { useUnreadCount }      from '@/lib/hooks/notifications/useUnreadCount'
import { useRealtimeProfile }  from '@/lib/hooks/shared/useRealtimeProfile'
import { useRealtimeNotificationAlerts } from '@/lib/hooks/notifications/useRealtimeNotificationAlerts'
import ThemeToggleButton from '@/components/shared/dashboard/ThemeToggleButton'
import styles                  from './AdminTopbar.module.css'

type ProfileRow = {
  full_name: string | null
  avatar_url: string | null
}

function getInitials(name: string | null): string {
  if (!name) {return 'FA'}
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export default function AdminTopbar() {
  const supabase = useMemo(() => createClient(), [])
  const [facultyName, setFacultyName] = useState<string | null>(null)
  const [avatarUrl,   setAvatarUrl]   = useState<string | null>(null)
  const [userId,      setUserId]      = useState<string | null>(null)
  const [search,      setSearch]      = useState('')
  const [menuOpen,    setMenuOpen]    = useState(false)
  const pathname = usePathname()

  // ── Resolve current user + profile ───────────────────────────────────────
  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {return}
      setUserId(data.user.id)

      void supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', data.user.id)
        .single()
        .then(({ data }) => {
          const profile = data as ProfileRow | null
          if (!profile) {return}
          setFacultyName(profile.full_name ?? 'Faculty')
          setAvatarUrl(profile.avatar_url ?? null)
        })
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Realtime: update avatar + name without refresh ────────────────────────
  useRealtimeProfile({
    supabase,
    userId,
    onUpdate: useCallback((updated) => {
      if (updated.avatar_url !== undefined) {setAvatarUrl(updated.avatar_url)}
      if (updated.full_name  !== undefined) {setFacultyName(updated.full_name ?? 'Faculty')}
    }, []),
  })

  const unreadCount = useUnreadCount(userId)
  useRealtimeNotificationAlerts(userId)
  const initials    = getInitials(facultyName)
  const inFaculty = pathname.startsWith('/faculty')
  const notificationHref = inFaculty ? '/faculty/notifications' : '/admin/notifications'
  const settingsHref = inFaculty ? '/faculty/settings' : '/admin/settings'
  const roleLabel = inFaculty ? 'Faculty' : 'Admin'

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null
      if (!target) { return }
      if (!target.closest('[data-topbar-profile-menu="admin"]')) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) {
      document.addEventListener('click', onDocClick)
      return () => document.removeEventListener('click', onDocClick)
    }
  }, [menuOpen])

  async function handleLogout() {
    window.location.href = '/api/auth/signout'
  }

  return (
    <header className={styles.topbar}>

      {/* ── Left: search ── */}
      <div className={styles.left}>
        <div className={styles.searchWrap}>
          <span className={styles.searchIcon}><Search size={14} /></span>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Search students, exams, programs…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* ── Right: actions ── */}
      <div className={styles.right}>

        <span className={styles.rolePill}>
          <GraduationCap size={11} />
          {roleLabel}
        </span>

        <ThemeToggleButton className={styles.iconBtn} />

        <Link
          href={notificationHref}
          prefetch={false}
          className={styles.iconBtn}
          title={unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'Notifications'}
          aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}
        >
          <Bell size={15} />
          {unreadCount > 0 && (
            <span className={styles.notifDot} aria-hidden="true">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Link>

        <Link href={settingsHref} prefetch={false} className={styles.iconBtn} title="Settings">
          <Settings size={15} />
        </Link>

        {/* Avatar — image or initials fallback */}
        <div className={styles.profileMenuWrap} data-topbar-profile-menu="admin">
        <button
          className={styles.avatarBtn}
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
          aria-haspopup="menu"
        >
          <div className={styles.avatarCircle}>
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={facultyName ?? 'Avatar'}
                width={32}
                height={32}
                className={styles.avatarImg}
                unoptimized
              />
            ) : (
              initials
            )}
          </div>
          <span className={styles.avatarName}>{facultyName ?? 'Faculty'}</span>
          <ChevronDown size={12} className={styles.avatarChevron} />
        </button>
          {menuOpen && (
            <div className={styles.profileMenu} role="menu">
              <Link href={settingsHref} className={styles.profileMenuItem} role="menuitem" onClick={() => setMenuOpen(false)}>
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
