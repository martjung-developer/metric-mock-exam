// components/admin/dashboard/PendingTable.tsx
import Link from "next/link";
import { CheckCircle2, ChevronRight, PenLine } from "lucide-react";
import type { PendingSubmission } from "@/lib/types/admin/dashboard/dashboard";
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

function scoreColor(pct: number | null): string {
  if (pct === null) {
    return "var(--c-text-muted)";
  }
  if (pct >= 75) {
    return "var(--c-success)";
  }
  if (pct >= 50) {
    return "var(--c-warning)";
  }
  return "var(--c-danger)";
}

// ── Badge ─────────────────────────────────────────────────────────────────────

function Badge({ passed }: { passed: boolean | null }) {
  if (passed === true) {
    return <span className={styles.badgePassed}>Passed</span>;
  }
  if (passed === false) {
    return <span className={styles.badgeFailed}>Failed</span>;
  }
  return <span className={styles.badgePending}>Pending</span>;
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className={styles.skeleton} style={{ width: "100%", height: 13 }} />
      ))}
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

interface PendingTableProps {
  rows:    PendingSubmission[];
  loading: boolean;
}

export function PendingTable({ rows, loading }: PendingTableProps) {
  return (
    <div className={styles.card}>
      <div className={styles.cardHead}>
        <span className={styles.cardTitle}>
          <span className={styles.cardTitleIcon}>
            <PenLine size={13} color="#1e3a5f" />
          </span>
          Needs Grading
        </span>
        <Link href="/admin/exams" className={styles.viewAll}>View all →</Link>
      </div>

      {loading ? (
        <Skeleton />
      ) : rows.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>
            <CheckCircle2 size={20} color="#94a3b8" strokeWidth={1.5} />
          </div>
          <p className={styles.emptyTitle}>All caught up!</p>
          <p className={styles.emptySub}>No submissions pending review.</p>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Student</th>
                <th>Exam</th>
                <th>Score</th>
                <th>Status</th>
                <th>Submitted</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td><p className={styles.cellName}>{row.student_name}</p></td>
                  <td><p className={styles.cellExam}>{row.exam_title}</p></td>
                  <td>
                    <span
                      className={styles.scoreChip}
                      style={{ color: scoreColor(row.percentage) }}
                    >
                      {row.percentage !== null ? `${row.percentage}%` : "—"}
                    </span>
                  </td>
                  <td><Badge passed={row.passed} /></td>
                  <td>
                    <span className={styles.cellTime}>{timeAgo(row.submitted_at)}</span>
                  </td>
                  <td>
                    <Link
                      href={`/admin/exams/${row.id}/submissions`}
                      className={styles.gradeBtn}
                    >
                      Grade <ChevronRight size={11} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}