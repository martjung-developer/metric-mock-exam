// app/(dashboard)/admin/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ClipboardList, BookOpen, BarChart2,
  Plus, PenLine, Clock, ArrowRight,
  Activity, UserCheck, Award,
  Upload, Send,
  AlertCircle, ChevronRight,
  RefreshCw,
} from "lucide-react";
import { useUser } from "@/lib/context/AuthContext";
import { useAdminDashboard } from "@/lib/hooks/admin/dashboard/useAdminDashboard";
import { StatCard }           from "@/components/dashboard/admin/dashboard/StatCard";
import { QuickActions }       from "@/components/dashboard/admin/dashboard/QuickActions";
import { PendingTable }       from "@/components/dashboard/admin/dashboard/PendingTable";
import { RecentActivityCard, AnswerKeysCard } from "@/components/dashboard/admin/dashboard/RecentActivity";
import { PerformanceOverview } from "@/components/dashboard/admin/dashboard/PerformanceOverview";
import styles from "./dashboard.module.css";

// ── Helpers ───────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) {
    return "Good morning";
  }
  if (h < 18) {
    return "Good afternoon";
  }
  return "Good evening";
}

// Skeleton used only for the auth-loading fallback
function Skeleton({ w = "100%", h = 13 }: { w?: string; h?: number }) {
  return <div className={styles.skeleton} style={{ width: w, height: h }} />;
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const router                        = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const { user, profile, loading: authLoading} = useUser();

  // ── Role guard ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (authLoading) {
      return;
    }
    if (!user) { router.replace("/login"); return; }
    const role = profile?.role;
    if (role !== "admin" && role !== "faculty") {
      router.replace("/unauthorized");
    }
  }, [user, profile, authLoading, router]);

  // ── Data ───────────────────────────────────────────────────────────────────
  const {
    displayName,
    stats,
    pendingSubs,
    recentActivity,
    examsNeedingKey,
    loading,
    mounted,
  } = useAdminDashboard(user);

  async function handleRefresh() {
    if (refreshing) {
      return;
    }
    setRefreshing(true);
    router.refresh();
    setTimeout(() => setRefreshing(false), 500);
  }

  // ── Auth-loading fallback ──────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.statsGrid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={styles.statCard}>
              <Skeleton w="55%" h={30} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const role = profile?.role;

  if (role !== "admin" && role !== "faculty") {
    return null;
  }

  // ── Stat card definitions ──────────────────────────────────────────────────
  const STAT_CARDS = [
    {
      Icon: UserCheck,    bg: "#eff6ff", color: "#2563eb",
      label: "Students Reached", value: String(stats.assignedStudents),
      sub: "submitted your exams", href: "/admin/students",
      empty: stats.assignedStudents === 0,
    },
    {
      Icon: ClipboardList, bg: "#f0fdf4", color: "#059669",
      label: "Mock Exams", value: String(stats.publishedExams),
      sub: "published", href: "/admin/exams",
      empty: stats.publishedExams === 0,
    },
    {
      Icon: BookOpen, bg: "#fffbeb", color: "#d97706",
      label: "Reviewers", value: String(stats.practiceExams),
      sub: "published", href: "/admin/exams",
      empty: stats.practiceExams === 0,
    },
    {
      Icon: PenLine, bg: "#fef2f2", color: "#dc2626",
      label: "Pending Grading", value: String(stats.pendingGrading),
      sub: "awaiting review", href: "/admin/exams",
      empty: stats.pendingGrading === 0,
      urgent: stats.pendingGrading > 0,
    },
    {
      Icon: BarChart2, bg: "#f5f3ff", color: "#7c3aed",
      label: "Avg Score", value: stats.avgScore !== null ? `${stats.avgScore}%` : "—",
      sub: "released exams only", href: "/admin/analytics",
      empty: stats.avgScore === null,
    },
    {
      Icon: Award, bg: "#ecfeff", color: "#0891b2",
      label: "Released Results", value: String(stats.releasedCount),
      sub: `${stats.totalSubmissions} total`, href: "/admin/analytics",
      empty: stats.releasedCount === 0,
    },
  ] as const;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className={styles.page}>

      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.greeting}>
            {getGreeting()}, {displayName ?? "..."}
          </h1>
          <p className={styles.greetingSub}>
            {role === "admin" ? "Admin" : "Faculty"} overview · exams, grading, and student progress.
          </p>
        </div>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={() => { void handleRefresh(); }}
            disabled={refreshing}
            aria-label="Refresh dashboard data"
          >
            <RefreshCw size={13} className={refreshing ? styles.spinning : ''} /> Refresh
          </button>
          <Link href="/admin/exams"        className={styles.btnSecondary}>
            <PenLine size={13} /> Grade Submissions
          </Link>
          <Link href="/admin/exams"        className={styles.btnSecondary}>
            <Send    size={13} /> Assign Exam
          </Link>
          <Link href="/admin/exams/create" className={styles.btnPrimary}>
            <Plus    size={13} /> Create Exam
          </Link>
        </div>
      </div>

      {/* Urgent: pending grading */}
      {!loading && stats.pendingGrading > 0 && (
        <div className={styles.urgent}>
          <AlertCircle size={16} className={styles.urgentIcon} />
          <span className={styles.urgentText}>
            <strong>{stats.pendingGrading} submission{stats.pendingGrading > 1 ? "s" : ""}</strong> waiting for review.
          </span>
          <Link href="/admin/exams" className={styles.urgentLink}>
            Grade now <ChevronRight size={13} />
          </Link>
        </div>
      )}

      {/* Graded but not released */}
      {!loading && stats.gradedNotReleased > 0 && (
        <div
          className={styles.urgent}
          style={{ background: "#f5f3ff", borderColor: "#ddd6fe" }}
        >
          <Clock size={16} style={{ color: "#7c3aed", flexShrink: 0 }} />
          <span className={styles.urgentText} style={{ color: "#5b21b6" }}>
            <strong>{stats.gradedNotReleased} submission{stats.gradedNotReleased > 1 ? "s" : ""}</strong>{" "}
            graded but not released.
          </span>
          <Link
            href="/admin/exams"
            className={styles.urgentLink}
            style={{ color: "#7c3aed" }}
          >
            Release now <ChevronRight size={13} />
          </Link>
        </div>
      )}

      {/* Hero */}
      <div className={styles.hero}>
        <Image
          src="/images/lccb_admin_img.jpg"
          alt=""
          fill
          sizes="100vw"
          className={styles.heroImage}
          aria-hidden="true"
          priority
        />
        <div className={styles.heroOverlay} aria-hidden="true" />
        <div className={styles.heroContent}>
          <p className={styles.heroEyebrow}><Activity size={10} /> Control Panel</p>
          <h2 className={styles.heroTitle}>
            Assign, grade, and guide<br />your students to success.
          </h2>
          <p className={styles.heroSub}>
            Upload question banks by degree program, set answer keys, assign mock exams and reviewers,
            and track every student&apos;s performance — all in one place.
          </p>
          <div className={styles.heroActions}>
            <Link href="/admin/questionnaires" className={styles.heroBtnOutline}>
              <Upload size={12} /> Upload Questions
            </Link>
            <Link href="/admin/exams"          className={styles.heroBtnOutline}>
              <Send   size={12} /> Assign to Students
            </Link>
            <Link href="/admin/analytics"      className={styles.heroBtnWhite}>
              View Analytics <ArrowRight size={12} />
            </Link>
          </div>
        </div>
        <div className={styles.heroEmoji}></div>
      </div>

      {/* Stat cards */}
      <div className={styles.statsGrid}>
        {STAT_CARDS.map((card) => (
          <StatCard
            key={card.label}
            {...card}
            loading={loading}
          />
        ))}
      </div>

      {/* Row 1: Pending grading + Quick actions */}
      <div className={styles.row}>
        <PendingTable rows={pendingSubs} loading={loading} />
        <QuickActions />
      </div>

      {/* Row 2: Answer keys + Activity + Performance */}
      <div className={styles.row}>
        <AnswerKeysCard exams={examsNeedingKey} loading={loading} />

        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <RecentActivityCard items={recentActivity} loading={loading} />
          <PerformanceOverview stats={stats} mounted={mounted} />
        </div>
      </div>

    </div>
  );
}
