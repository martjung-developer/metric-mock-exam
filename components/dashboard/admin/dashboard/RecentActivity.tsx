// components/admin/dashboard/RecentActivity.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Two cards that live in the same column:
//   1. RecentActivityCard  — activity feed
//   2. AnswerKeysCard      — exams missing correct answers
// ─────────────────────────────────────────────────────────────────────────────

import Link from "next/link";
import { Clock, Key, Layers, Plus, Upload, ChevronRight } from "lucide-react";
import type { RecentActivity, ExamNeedingKey } from "@/lib/types/admin/dashboard/dashboard";
import type { ActivityType } from "@/lib/types/admin/dashboard/dashboard";
import styles from "@/app/(dashboard)/admin/dashboard/dashboard.module.css";

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(iso: string | null): string {
  if (!iso) {
    return "—";
  }
  const diff = Date.now() - new Date(iso).getTime();
  const m    = Math.floor(diff / 60_000);
  if (m < 1) {
    return "just now";
  }
  if (m < 60) {
    return `${m}m ago`;
  }
  const h = Math.floor(m / 60);
  if (h < 24) {
    return `${h}h ago`;
  }
  return `${Math.floor(h / 24)}d ago`;
}

const DOT_COLOR: Record<ActivityType, string> = {
  published: "#2563eb",
  assigned:  "#059669",
  graded:    "#7c3aed",
  uploaded:  "#d97706",
};

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonLines({ count }: { count: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={styles.skeleton}
          style={{ width: "90%", height: 13 }}
        />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. Recent Activity Card
// ═══════════════════════════════════════════════════════════════════════════════

interface RecentActivityCardProps {
  items:   RecentActivity[];
  loading: boolean;
}

export function RecentActivityCard({ items, loading }: RecentActivityCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.cardHead}>
        <span className={styles.cardTitle}>
          <span className={styles.cardTitleIcon}>
            <Layers size={13} color="#1e3a5f" />
          </span>
          Recent Activity
        </span>
        <span className={styles.cardHint}>live</span>
      </div>

      {loading ? (
        <SkeletonLines count={4} />
      ) : items.length === 0 ? (
        <div className={styles.empty} style={{ padding: "1rem" }}>
          <p className={styles.emptyTitle}>No activity yet</p>
          <p className={styles.emptySub}>Start by creating or assigning an exam.</p>
        </div>
      ) : (
        <div className={styles.activity}>
          {items.map((item) => (
            <div key={item.id} className={styles.activityItem}>
              <div
                className={styles.actDot}
                style={{ background: DOT_COLOR[item.type] }}
              />
              <div style={{ flex: 1 }}>
                <div className={styles.actLabel}>{item.label}</div>
                <div className={styles.actSub}>{item.sub}</div>
              </div>
              <div className={styles.actTime}>
                <Clock size={9} /> {timeAgo(item.time)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. Answer Keys Needed Card
// ═══════════════════════════════════════════════════════════════════════════════

interface AnswerKeysCardProps {
  exams:   ExamNeedingKey[];
  loading: boolean;
}

export function AnswerKeysCard({ exams, loading }: AnswerKeysCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.cardHead}>
        <span className={styles.cardTitle}>
          <span className={styles.cardTitleIcon}>
            <Key size={13} color="#1e3a5f" />
          </span>
          Answer Keys Needed
        </span>
        <Link href="/admin/questionnaires" className={styles.viewAll}>Manage →</Link>
      </div>

      {loading ? (
        <SkeletonLines count={3} />
      ) : exams.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>
            <Key size={20} color="#94a3b8" strokeWidth={1.5} />
          </div>
          <p className={styles.emptyTitle}>All answer keys set</p>
          <p className={styles.emptySub}>Every exam has a complete answer key.</p>
        </div>
      ) : (
        exams.map((exam) => (
          <div key={exam.id} className={styles.keyItem}>
            <div className={styles.keyItemLeft}>
              <div className={styles.keyDot} />
              <div>
                <div className={styles.keyTitle}>
                  {exam.title.length > 36 ? `${exam.title.slice(0, 36)}…` : exam.title}
                </div>
                <div className={styles.keyMeta}>
                  {exam.question_count} question{exam.question_count !== 1 ? "s" : ""} · {exam.total_points} pts
                </div>
              </div>
            </div>
            <Link
              href={`/admin/exams/${exam.id}/questions`}
              className={styles.keyLink}
            >
              Set key <ChevronRight size={12} />
            </Link>
          </div>
        ))
      )}

      <div
        style={{
          marginTop: "1rem",
          paddingTop: "1rem",
          borderTop: "1px solid var(--c-border-soft)",
          display: "flex",
          gap: "0.65rem",
        }}
      >
        <Link
          href="/admin/questionnaires"
          className={styles.btnPrimary}
          style={{ flex: 1, justifyContent: "center", fontSize: "0.76rem" }}
        >
          <Upload size={12} /> Upload Question Bank
        </Link>
        <Link
          href="/admin/exams/create"
          className={styles.btnSecondary}
          style={{ flex: 1, justifyContent: "center", fontSize: "0.76rem" }}
        >
          <Plus size={12} /> New Exam
        </Link>
      </div>
    </div>
  );
}