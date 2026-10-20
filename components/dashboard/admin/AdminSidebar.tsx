// components/dashboard/admin/AdminSidebar.tsx
'use client'

import { useEffect, useState } from 'react'
import Link                    from 'next/link'
import Image                   from 'next/image'
import { usePathname }         from 'next/navigation'
import {
  LayoutDashboard, Users, GraduationCap,
  FileText, ClipboardList, FolderOpen,
  Bell, BarChart2, Settings, LogOut, Menu, X,
  BookUser,
  ClipboardCheck,
} from 'lucide-react'
import { createClient }   from '@/lib/supabase/client'
import { useUnreadCount } from '@/lib/hooks/notifications/useUnreadCount'
import {
  STAFF_NAV_HREF,
  type StaffRole,
  getStaffAllowedNav,
} from '@/lib/utils/auth/rbac'
import styles             from './AdminSidebar.module.css'

// ── Nav structure ──────────────────────────────────────────────────────────────

const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [
      { key: 'dashboard',      icon: LayoutDashboard, label: 'Dashboard',       iconColor: '#3b82f6', iconBg: 'rgba(59,130,246,0.15)',  badge: false },
      { key: 'notifications',  icon: Bell,            label: 'Notifications',   iconColor: '#f59e0b', iconBg: 'rgba(245,158,11,0.15)',  badge: true  },
      { key: 'approvals',      icon: ClipboardCheck,  label: 'Questionnaire Review',       iconColor: '#0ea5e9', iconBg: 'rgba(14,165,233,0.15)',  badge: true  },
    ],
  },
  {
    label: 'Management',
    items: [
      { key: 'students',       icon: Users,         label: 'Students',        iconColor: '#10b981', iconBg: 'rgba(16,185,129,0.15)',  badge: false },
      { key: 'faculty',        icon: BookUser,      label: 'Faculty',         iconColor: '#8b5cf6', iconBg: 'rgba(139,92,246,0.15)',  badge: false },
      { key: 'exams',          icon: ClipboardList, label: 'Exams',           iconColor: '#6366f1', iconBg: 'rgba(99,102,241,0.15)',  badge: false },
      { key: 'questionnaires', icon: FileText,      label: 'Questionnaires',  iconColor: '#f97316', iconBg: 'rgba(249,115,22,0.15)',  badge: false },
    ],
  },
  {
    label: 'Academic',
    items: [
      { key: 'programs',        icon: GraduationCap, label: 'Programs',        iconColor: '#ec4899', iconBg: 'rgba(236,72,153,0.15)', badge: false },
      { key: 'study-materials', icon: FolderOpen,    label: 'Study Materials', iconColor: '#14b8a6', iconBg: 'rgba(20,184,166,0.15)', badge: false },
    ],
  },
  {
    label: 'Reports',
    items: [
      { key: 'analytics', icon: BarChart2, label: 'Analytics', iconColor: '#0891b2', iconBg: 'rgba(8,145,178,0.15)', badge: false },
    ],
  },
] as const

const BOTTOM_ITEMS = [
  { key: 'settings', icon: Settings, label: 'Settings', iconColor: '#64748b', iconBg: 'rgba(100,116,139,0.15)' },
] as const

function getInitials(name: string | null): string {
  if (!name) {
    return 'AD'
  }
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
}

interface AdminSidebarProps {
  role: StaffRole
  collapsed:  boolean
  onCollapse: (v: boolean) => void
}

export default function AdminSidebar({ role, collapsed, onCollapse }: AdminSidebarProps) {
  const pathname = usePathname()
  const supabase = createClient()

  const [adminName,  setAdminName]  = useState<string | null>(null)
  const [adminEmail, setAdminEmail] = useState<string | null>(null)
  const [userId,     setUserId]     = useState<string | null>(null)
  const [loggingOut, setLoggingOut] = useState(false)
  const [pendingApprovals, setPendingApprovals] = useState(0)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        return
      }
      setUserId(data.user.id)
      setAdminEmail(data.user.email ?? null)

      supabase
        .from('profiles')
        .select('full_name')
        .eq('id', data.user.id)
        .single()
        .then(({ data: profile }) => {
          if (profile) {
            setAdminName(
              (profile as { full_name: string | null }).full_name ?? 'Admin',
            )
          }
        })
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (role !== 'admin') {
      return
    }
    let cancelled = false
    const load = async () => {
      try {
        const res = await fetch('/api/admin/approvals')
        const json = (await res.json().catch(() => ({}))) as { items?: unknown[] }
        if (!cancelled) {
          setPendingApprovals(Array.isArray(json.items) ? json.items.length : 0)
        }
      } catch {
        if (!cancelled) {
          setPendingApprovals(0)
        }
      }
    }
    void load()
    const t = setInterval(() => { void load() }, 10000)
    return () => {
      cancelled = true
      clearInterval(t)
    }
  }, [role])

  const unreadCount = useUnreadCount(userId)

  async function handleLogout() {
    setLoggingOut(true)
    window.location.href = '/api/auth/signout'
  }

  const initials = getInitials(adminName)

  const allowedNavItems = new Set(getStaffAllowedNav(role))
  if (role === 'program_head') {
    allowedNavItems.add('study-materials')
  }
  const hrefByKey = STAFF_NAV_HREF[role]

  return (
    <aside
      className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ''}`}
    >
      {/* ── Logo / hamburger ── */}
      <div className={styles.logoArea}>
        <button
          className={styles.menuToggle}
          onClick={() => onCollapse(!collapsed)}
          title={collapsed ? 'Expand menu' : 'Collapse menu'}
          aria-label={collapsed ? 'Expand menu' : 'Collapse menu'}
          type="button"
        >
          {collapsed ? <Menu size={18} /> : <X size={18} />}
        </button>

        {!collapsed && (
          <div className={styles.logoImgWrap}>
            <Image
              src="/images/metric-logo.png"
              alt="M.E.T.R.I.C."
              width={28}
              height={28}
              className={styles.logoImg}
              priority
            />
          </div>
        )}
      </div>

      {/* ── Scrollable nav ── */}
      <nav className={styles.nav}>
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            {!collapsed && (
              <div className={styles.sectionLabel}>{section.label}</div>
            )}

            {section.items.map((item) => {
              if (!allowedNavItems.has(item.key)) {
                return null
              }

              const href = item.key === 'study-materials' && role === 'program_head'
                ? '/faculty/study-materials'
                : hrefByKey[item.key]
              const isActive =
                pathname === href ||
                (href !== '/admin/dashboard' &&
                  href !== '/faculty/dashboard' &&
                  pathname.startsWith(href))

              const badgeValue =
                item.key === 'approvals'
                  ? pendingApprovals
                  : item.badge && unreadCount > 0 ? unreadCount : 0

              return (
                <Link
                  key={href}
                  href={href}
                  prefetch={false}
                  className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                  title={collapsed ? item.label : undefined}
                  aria-label={
                    badgeValue > 0
                      ? `${item.label} — ${badgeValue} unread`
                      : item.label
                  }
                >
                  <div
                    className={styles.navIcon}
                    style={{ background: item.iconBg }}
                    aria-hidden="true"
                  >
                    <item.icon size={16} color={item.iconColor} strokeWidth={2} />
                  </div>

                  {!collapsed && (
                    <span className={styles.navLabel}>{item.label}</span>
                  )}

                  {badgeValue > 0 && (
                    <span className={styles.navBadge} aria-hidden="true">
                      {badgeValue > 99 ? '99+' : badgeValue}
                    </span>
                  )}
                </Link>
              )
            })}

            <div className={styles.divider} />
          </div>
        ))}

        {/* Settings */}
        {BOTTOM_ITEMS.map((item) => {
          const href = hrefByKey[item.key]
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              prefetch={false}
              className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <div
                className={styles.navIcon}
                style={{ background: item.iconBg }}
                aria-hidden="true"
              >
                <item.icon size={16} color={item.iconColor} strokeWidth={2} />
              </div>
              {!collapsed && (
                <span className={styles.navLabel}>{item.label}</span>
              )}
            </Link>
          )
        })}

        <div style={{ height: '0.5rem', flexShrink: 0 }} />
      </nav>

      {/* ── Bottom: user panel + logout ── */}
      <div className={styles.bottomPanel}>

        {/* User identity card */}
        <div className={styles.userCard} title={collapsed ? (adminName ?? 'Admin') : undefined}>
          <div className={styles.userAvatar} aria-hidden="true">
            {initials}
          </div>

          {!collapsed && (
            <div className={styles.userInfo}>
              <p className={styles.userName}>
                {adminName ?? 'Admin'}
              </p>
              {adminEmail && (
                <p className={styles.userEmail}>{adminEmail}</p>
              )}
            </div>
          )}
        </div>

        {/* Logout */}
        <button
          className={`${styles.logoutBtn} ${loggingOut ? styles.logoutBtnLoading : ''}`}
          onClick={handleLogout}
          disabled={loggingOut}
          title={collapsed ? 'Log out' : undefined}
          type="button"
          aria-label="Log out"
        >
          <LogOut size={15} className={styles.logoutIcon} aria-hidden="true" />
          {!collapsed && (
            <span className={styles.logoutLabel}>
              {loggingOut ? 'Signing out…' : 'Log out'}
            </span>
          )}
        </button>

      </div>
    </aside>
  )
}
