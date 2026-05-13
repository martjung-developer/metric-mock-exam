// components/shared/approval/ApprovalHistoryTimeline.tsx
'use client'

import type { ApprovalEvent } from '@/lib/types/approval'
import { STATUS_META }        from '@/lib/types/approval'

interface Props {
  events:  ApprovalEvent[]
  loading: boolean
}

export function ApprovalHistoryTimeline({ events, loading }: Props) {
  if (loading) {
    return (
      <div style={{ padding: '1rem', color: '#94a3b8', fontSize: '0.8rem' }}>
        Loading history…
      </div>
    )
  }
  if (events.length === 0) {
    return (
      <div style={{ padding: '1rem', color: '#94a3b8', fontSize: '0.8rem', fontStyle: 'italic' }}>
        No review activity yet.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {events.map((ev, i) => {
        const meta = STATUS_META[ev.to_status]
        return (
          <div key={ev.id} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            {/* Timeline dot */}
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0,
            }}>
              <div style={{
                width: 10, height: 10, borderRadius: '50%',
                background: meta.color, marginTop: 4,
              }} />
              {i < events.length - 1 && (
                <div style={{
                  width: 1, flex: 1, minHeight: 24,
                  background: '#e2e8f0', marginTop: 3,
                }} />
              )}
            </div>
            {/* Content */}
            <div style={{ flex: 1, paddingBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: meta.color }}>
                  {meta.label}
                </span>
                {ev.from_status && (
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                    ← {STATUS_META[ev.from_status].label}
                  </span>
                )}
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginLeft: 'auto' }}>
                  {new Date(ev.created_at).toLocaleString()}
                </span>
              </div>
              {ev.actorName && (
                <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 1 }}>
                  by {ev.actorName}
                </div>
              )}
              {ev.notes && (
                <div style={{
                  marginTop: '0.35rem', padding: '0.4rem 0.6rem',
                  background: '#f8fafc', border: '1px solid #e2e8f0',
                  borderRadius: 6, fontSize: '0.75rem', color: '#475569',
                  fontStyle: 'italic',
                }}>
                  &ldquo;{ev.notes}&rdquo;
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}