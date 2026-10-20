// components/admin/dashboard/StatCard.tsx
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import styles from "@/app/(dashboard)/admin/dashboard/dashboard.module.css";

interface StatCardProps {
  Icon:    LucideIcon;
  bg:      string;
  color:   string;
  label:   string;
  value:   string;
  sub:     string;
  href:    string;
  empty:   boolean;
  urgent?: boolean;
  loading: boolean;
}

function Skeleton({ w = "100%", h = 13 }: { w?: string; h?: number }) {
  return <div className={styles.skeleton} style={{ width: w, height: h }} />;
}

export function StatCard({
  Icon, bg, color, label, value, sub, href, empty, urgent = false, loading,
}: StatCardProps) {
  return (
    <Link
      href={href}
      className={`${styles.statCard}${urgent ? ` ${styles.statCardUrgent}` : ""}`}
    >
      <div className={styles.statTop}>
        <div className={styles.statIcon} style={{ background: bg }}>
          <Icon size={17} color={color} strokeWidth={2} />
        </div>
        {urgent
          ? <div className={styles.statUrgentDot} />
          : <span style={{ fontSize: "0.68rem", color: "var(--c-text-muted)" }}>—</span>
        }
      </div>

      {loading
        ? <Skeleton w="55%" h={30} />
        : (
          <div className={`${styles.statValue}${empty ? ` ${styles.statValueEmpty}` : ""}`}>
            {value}
          </div>
        )
      }

      <div className={styles.statLabel}>{label}</div>
      <div className={styles.statSub}>{sub}</div>
    </Link>
  );
}