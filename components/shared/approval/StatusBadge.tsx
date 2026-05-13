// components/shared/approval/StatusBadge.tsx
// Zero-dependency badge — safe in server and client components.

import type { ApprovalStatus } from '@/lib/types/approval'
import { STATUS_META }         from '@/lib/types/approval'

interface StatusBadgeProps {
  status: ApprovalStatus
  size?:  'sm' | 'md'
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const meta = STATUS_META[status]
  const pad  = size === 'sm' ? '1px 7px' : '3px 10px'
  const fs   = size === 'sm' ? '0.63rem'  : '0.69rem'

  return (
    <span
      style={{
        display:      'inline-flex',
        alignItems:   'center',
        padding:      pad,
        borderRadius: 20,
        fontSize:     fs,
        fontWeight:   700,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        color:         meta.color,
        background:    meta.bg,
        border:        `1px solid ${meta.border}`,
        whiteSpace:    'nowrap',
      }}
    >
      {meta.label}
    </span>
  )
}