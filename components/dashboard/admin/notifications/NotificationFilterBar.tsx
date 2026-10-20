// components/dashboard/admin/notifications/NotificationFilterBar.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Pure UI component – filter chip row (All / Exam / Result / General).
// ─────────────────────────────────────────────────────────────────────────────

import type {
  FilterType,
  NotifType,
} from "@/lib/types/admin/notifications/notifications.types";
import styles from "@/app/(dashboard)/admin/notifications/notifications.module.css";

const TYPE_OPTIONS: NotifType[] = ["exam", "result", "general"];

interface NotificationFilterBarProps {
  filterType: FilterType;
  totalCount: number;
  countByType: Record<NotifType, number>;
  onFilter: (filter: FilterType) => void;
}

export function NotificationFilterBar({
  filterType,
  totalCount,
  countByType,
  onFilter,
}: NotificationFilterBarProps) {
  return (
    <div className={styles.filterBar}>
      <span className={styles.filterBarLabel}>Filter</span>

      <button
        className={`${styles.filterChip} ${filterType === "all" ? styles.filterChipActive : ""}`}
        onClick={() => onFilter("all")}
      >
        All
        <span
          className={`${styles.filterCount} ${
            filterType !== "all" ? styles.filterCountDark : ""
          }`}
        >
          {totalCount}
        </span>
      </button>

      {TYPE_OPTIONS.map((t) => (
        <button
          key={t}
          className={`${styles.filterChip} ${
            filterType === t ? styles.filterChipActive : ""
          }`}
          onClick={() => onFilter(t)}
        >
          {t.charAt(0).toUpperCase() + t.slice(1)}
          <span
            className={`${styles.filterCount} ${
              filterType !== t ? styles.filterCountDark : ""
            }`}
          >
            {countByType[t]}
          </span>
        </button>
      ))}
    </div>
  );
}