"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from 'next/navigation'
import { AuthProvider } from "@/lib/context/AuthContext";
import { useRouteGuard } from '@/lib/hooks/auth/useRouteGuard'
import { useUser } from '@/lib/context/AuthContext'
import AdminSidebar from "@/components/dashboard/admin/AdminSidebar";
import AdminTopbar  from "@/components/dashboard/admin/AdminTopbar";
import {
  canAccessStaffPath,
  getStaffHomePath,
  isStaffRole,
} from '@/lib/utils/auth/rbac'
import styles from "./layout.module.css";

// ── Inner shell (context consumer) ────────────────────────────────────────

function AdminShell({ children }: { children: React.ReactNode }) {
  const { isReady, authLoading } = useRouteGuard({ allowedRoles: ['admin', 'faculty'] })
  const { profile } = useUser()
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (authLoading || isReady) {
      return
    }
    window.location.replace('/login')
  }, [authLoading, isReady])

  useEffect(() => {
    if (authLoading || !profile || !isStaffRole(profile.role)) {
      return
    }

    if (!canAccessStaffPath(profile.role, pathname)) {
      router.replace(getStaffHomePath(profile.role))
    }
  }, [authLoading, pathname, profile, router])

  if (authLoading || !isReady) {
    return (
      <div className={styles.shell}>
        <div className={styles.body}>
          <main className={styles.content}>Loading admin dashboard...</main>
        </div>
      </div>
    )
  }

  return (
    <div
      className={styles.shell}
      data-collapsed={collapsed ? "true" : "false"}
    >
      <AdminSidebar
        role={isStaffRole(profile?.role) ? profile.role : 'admin'}
        collapsed={collapsed}
        onCollapse={setCollapsed}
      />
      <div className={styles.body}>
        <AdminTopbar />
        <main className={styles.content}>
          {children}
        </main>
      </div>
    </div>
  );
}

// ── Outer wrapper (context provider) ──────────────────────────────────────

export default function AdminLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <AdminShell>{children}</AdminShell>
    </AuthProvider>
  );
}
