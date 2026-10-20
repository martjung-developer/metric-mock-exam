// components/dashboard/student/StudentSidebar.tsx
'use client'

import { useEffect, useState } from 'react'
import Link                    from 'next/link'
import Image                   from 'next/image'
import { usePathname }         from 'next/navigation'
import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  BarChart2,
  FileText,
  Bell,
  User,
  HelpCircle,
  GraduationCap,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { createClient }   from '@/lib/supabase/client'
import { useUnreadCount } from '@/lib/hooks/notifications/useUnreadCount'
import type { Profile }   from '@/lib/types/auth'
import styles             from './StudentSidebar.module.css'

// ── Nav items — `badge: true` marks the one item that shows a live count ──────
const NAV = [
  { href: '/student/dashboard',       icon: LayoutDashboard, label: 'Overview',        badge: false },
  { href: '/student/mock-exams',      icon: ClipboardList,   label: 'Mock Exam',       badge: false },
  { href: '/student/reviewer',        icon: BookOpen,        label: 'Reviewer',        badge: false },
  { href: '/student/study-materials', icon: FileText,        label: 'Study Materials', badge: false },
  { href: '/student/progress',        icon: BarChart2,       label: 'My Progress',     badge: false },
  { href: '/student/results',         icon: GraduationCap,   label: 'Results',         badge: false },
  { href: '/student/notifications',   icon: Bell,            label: 'Notifications',   badge: true  },
  { href: '/student/profile',         icon: User,            label: 'Profile',         badge: false },
  { href: '/student/help',            icon: HelpCircle,      label: 'Help',            badge: false },
] as const

interface Props {
  profile: Profile
}

export default function StudentSidebar({ profile }: Props) {
  const pathname            = usePathname()
  const supabase            = createClient()
  const [collapsed, setCollapsed] = useState(false)
  const [userId,    setUserId]    = useState<string | null>(null)

  // ── Resolve auth user ID once ─────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {setUserId(data.user.id)}
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Live unread count ─────────────────────────────────────────────────────
  const unreadCount = useUnreadCount(userId)

  return (
    <aside
      className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ''}`}
    >

      {/* ── Logo ── */}
      <div className={styles.logoWrap}>
        {!collapsed && (
          <Image
            src="/images/metric-logo.png"
            alt="M.E.T.R.I.C."
            width={0}
            height={30}
            style={{ width: 'auto', height: 30, filter: 'brightness(0) invert(1)' }}
            priority
          />
        )}

        {/* Collapse toggle */}
        <button
          className={styles.collapseBtn}
          onClick={() => setCollapsed((c) => !c)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          type="button"
        >
          {collapsed
            ? <ChevronRight size={15} strokeWidth={2.5} />
            : <ChevronLeft  size={15} strokeWidth={2.5} />
          }
        </button>
      </div>

      {/* ── Section label ── */}
      {!collapsed && (
        <div className={styles.sectionLabel}>Student Tools</div>
      )}

      {/* ── Nav links ── */}
      <nav className={styles.nav}>
        {NAV.map(({ href, icon: Icon, label, badge }) => {
          const active    = pathname === href || pathname.startsWith(href + '/')
          const badgeValue = badge && unreadCount > 0 ? unreadCount : 0

          return (
            <Link
              key={href}
              href={href}
              className={`${styles.navLink} ${active ? styles.navLinkActive : ''} ${collapsed ? styles.navLinkCollapsed : ''}`}
              title={collapsed ? label : undefined}
              aria-label={
                badgeValue > 0
                  ? `${label} — ${badgeValue} unread`
                  : label
              }
            >
              <Icon
                size={16}
                strokeWidth={active ? 2.5 : 2}
                className={styles.navIcon}
              />

              {!collapsed && (
                <span className={styles.navLabel}>{label}</span>
              )}

              {/* Live badge — visible both collapsed and expanded */}
              {badgeValue > 0 && (
                <span className={styles.navBadge} aria-hidden="true">
                  {badgeValue > 99 ? '99+' : badgeValue}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* ── Help card — hidden when collapsed ── */}
      {!collapsed && (
        <div className={styles.helpCard}>
          <p className={styles.helpCardTitle}>Need assistance?</p>
          <p className={styles.helpCardText}>
            Having trouble? Visit our help center or contact your faculty.
          </p>
          <Link href="/student/help" className={styles.helpCardBtn}>
            Contact Support
          </Link>
        </div>
      )}

      {/* ── User + sign out ── */}
      <div
        className={`${styles.userWrap} ${collapsed ? styles.userWrapCollapsed : ''}`}
      >
        <div
          className={styles.avatar}
          title={collapsed ? (profile.full_name ?? 'Student') : undefined}
          aria-hidden="true"
        >
          {profile.full_name?.charAt(0).toUpperCase() ?? 'S'}
        </div>

        {!collapsed && (
          <div style={{ overflow: 'hidden', flex: 1 }}>
            <div className={styles.userName}>
              {profile.full_name ?? 'Student'}
            </div>
            <div className={styles.userRole}>Student</div>
          </div>
        )}

        {!collapsed && (
          <button
            className={styles.signOutBtn}
            onClick={() => { window.location.href = '/api/auth/signout' }}
            title="Sign out"
            type="button"
            aria-label="Sign out"
          >
            <LogOut size={15} strokeWidth={2} />
          </button>
        )}
      </div>

    </aside>
  )
}
