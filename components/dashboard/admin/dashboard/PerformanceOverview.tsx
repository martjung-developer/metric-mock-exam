// components/admin/dashboard/PerformanceOverview.tsx
import Link from "next/link";
import { BarChart2, GraduationCap, TrendingUp } from "lucide-react";
import type { DashboardStats } from "@/lib/types/admin/dashboard/dashboard";
import styles from "@/app/(dashboard)/admin/dashboard/dashboard.module.css";

interface PerformanceOverviewProps {
  stats:   DashboardStats;
  mounted: boolean;
}

interface ProgressBar {
  label:     string;
  pct:       number;
  fillClass: string;
  sub:       string;
}

export function PerformanceOverview({ stats, mounted }: PerformanceOverviewProps) {
  const releasedRatio =
    stats.totalSubmissions > 0
      ? Math.min(Math.round((stats.releasedCount / stats.totalSubmissions) * 100), 100)
      : 0;

  const bars: ProgressBar[] = [
    {
      label:     "Pass Rate",
      pct:       stats.passRate ?? 0,
      fillClass: styles.progGreen,
      sub:       "released exams",
    },
    {
      label:     "Avg Score",
      pct:       stats.avgScore ?? 0,
      fillClass: styles.progBlue,
      sub:       "released exams",
    },
    {
      label:     "Released Results",
      pct:       releasedRatio,
      fillClass: styles.progAmber,
      sub:       `${stats.releasedCount} of ${stats.totalSubmissions}`,
    },
  ];

  return (
    <div className={styles.card}>
      <div className={styles.cardHead}>
        <span className={styles.cardTitle}>
          <span className={styles.cardTitleIcon}>
            <TrendingUp size={13} color="#1e3a5f" />
          </span>
          Performance Overview
        </span>
      </div>

      {bars.map((p) => (
        <div key={p.label} className={styles.progItem}>
          <div className={styles.progTop}>
            <span className={styles.progName}>{p.label}</span>
            <span className={styles.progPct}>{p.pct}%</span>
          </div>
          <div className={styles.progTrack}>
            <div
              className={`${styles.progFill} ${p.fillClass}`}
              style={{ width: mounted ? `${p.pct}%` : "0%" }}
            />
          </div>
        </div>
      ))}

      <div style={{ marginTop: "1rem", display: "flex", gap: "0.6rem" }}>
        {[
          { label: "Programs",  Icon: GraduationCap, color: "#ec4899", href: "/admin/programs"  },
          { label: "Analytics", Icon: BarChart2,      color: "#0891b2", href: "/admin/analytics" },
        ].map((item) => (
          <Link
            key={item.label}
            href={item.href}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.55rem 0.75rem",
              background: "var(--c-bg)",
              borderRadius: 9,
              border: "1.5px solid var(--c-border-soft)",
              textDecoration: "none",
              transition: "border-color 0.15s",
            }}
          >
            <item.Icon size={13} color={item.color} />
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--c-text)" }}>
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}