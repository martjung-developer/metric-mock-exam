// components/admin/dashboard/QuickActions.tsx
import Link from "next/link";
import {
  Plus, Upload, Send, Key, PenLine, FileText, Activity,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import styles from "@/app/(dashboard)/admin/dashboard/dashboard.module.css";

interface QuickAction {
  Icon:  LucideIcon;
  bg:    string;
  color: string;
  label: string;
  sub:   string;
  href:  string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { Icon: Plus,     bg: "#eff6ff", color: "#2563eb", label: "Create Exam",       sub: "New mock exam",       href: "/admin/exams/create"   },
  { Icon: Upload,   bg: "#f0fdf4", color: "#059669", label: "Upload Questions",  sub: "Import by program",   href: "/admin/questionnaires" },
  { Icon: Send,     bg: "#fffbeb", color: "#d97706", label: "Assign Exam",       sub: "Send to students",    href: "/admin/exams"          },
  { Icon: Key,      bg: "#fef2f2", color: "#dc2626", label: "Set Answer Key",    sub: "Score an exam",       href: "/admin/questionnaires" },
  { Icon: PenLine,  bg: "#f5f3ff", color: "#7c3aed", label: "Grade Submissions", sub: "Review answers",      href: "/admin/exams"          },
  { Icon: FileText, bg: "#ecfeff", color: "#0891b2", label: "Add Reviewer", sub: "Upload reviewer set", href: "/admin/exams/create"   },
];

export function QuickActions() {
  return (
    <div className={styles.card}>
      <div className={styles.cardHead}>
        <span className={styles.cardTitle}>
          <span className={styles.cardTitleIcon}>
            <Activity size={13} color="#1e3a5f" />
          </span>
          Quick Actions
        </span>
      </div>

      <div className={styles.quickGrid}>
        {QUICK_ACTIONS.map((a) => (
          <Link key={a.label} href={a.href} className={styles.quickAction}>
            <div className={styles.quickIcon} style={{ background: a.bg }}>
              <a.Icon size={15} color={a.color} strokeWidth={2} />
            </div>
            <div>
              <div className={styles.quickLabel}>{a.label}</div>
              <div className={styles.quickSub}>{a.sub}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
