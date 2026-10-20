/**
 * components/dashboard/admin/exams/assignments/StatusPills.tsx
 *
 * Pure presentational component.
 * Renders the four status summary pills at the top of the assignments page.
 */

import { CheckCircle, Clock, XCircle } from 'lucide-react'
import type { ElementType }            from 'react'

import type {
  Assignment,
  DisplaySubmissionStatus,
} from '@/lib/types/admin/exams/assignments/assignments.types'

import s from '@/app/(dashboard)/admin/exams/[examId]/assignments/assignments.module.css'

// ── Status display config ─────────────────────────────────────────────────────

interface StatusMeta {
  label: string
  icon:  ElementType
  color: string
}

export const STATUS_CONFIG: Record<DisplaySubmissionStatus, StatusMeta> = {
  not_started: { label: 'Not Started', icon: XCircle,     color: 'muted'  },
  in_progress: { label: 'In Progress', icon: Clock,       color: 'amber'  },
  submitted:   { label: 'Submitted',   icon: CheckCircle, color: 'blue'   },
  graded:      { label: 'Graded',      icon: CheckCircle, color: 'green'  },
}

// ── Component ─────────────────────────────────────────────────────────────────

interface StatusPillsProps {
  assignments: Assignment[]
}

export function StatusPills({ assignments }: StatusPillsProps) {
  return (
    <div className={s.statsRow}>
      {(
        Object.entries(STATUS_CONFIG) as [DisplaySubmissionStatus, StatusMeta][]
      ).map(([key, cfg]) => {
        const count = assignments.filter(
          (a) => a.submission_status === key,
        ).length

        return (
          <div
            key={key}
            className={`${s.statPill} ${s[`statPill_${cfg.color}`]}`}
          >
            <cfg.icon size={13} />
            <span className={s.statPillLabel}>{cfg.label}</span>
            <span className={s.statPillCount}>{count}</span>
          </div>
        )
      })}
    </div>
  )
}