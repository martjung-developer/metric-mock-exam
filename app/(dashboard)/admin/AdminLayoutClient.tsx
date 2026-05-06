"use client";

import { useEffect, useState } from "react";
import { AuthProvider } from "@/lib/context/AuthContext";
import { useRouteGuard } from '@/lib/hooks/auth/useRouteGuard'
import AdminSidebar from "@/components/dashboard/admin/AdminSidebar";
import AdminTopbar  from "@/components/dashboard/admin/AdminTopbar";
import styles from "./layout.module.css";

// ── Inner shell (context consumer) ────────────────────────────────────────

function AdminShell({ children }: { children: React.ReactNode }) {
  const { isReady, authLoading } = useRouteGuard({ allowedRoles: ['admin', 'faculty'] })
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (authLoading || isReady) {
      return
    }
    window.location.replace('/login')
  }, [authLoading, isReady])

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
      <AdminSidebar collapsed={collapsed} onCollapse={setCollapsed} />
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
