// components/dashboard/student/results/PendingBanner.tsx
import { Clock } from 'lucide-react'
import type { PendingRow } from '@/lib/types/student/results/results.types'

interface Props {
  rows: PendingRow[]
}

export function PendingBanner({ rows }: Props) {
  if (rows.length === 0) { return null }

  return (
    <div style={{
      background: '#fffbeb', border: '1.5px solid #fde68a',
      borderRadius: 10, padding: '0.8rem 1rem', marginBottom: '0.5rem',
      display: 'flex', alignItems: 'flex-start', gap: '0.6rem',
    }}>
      <Clock size={16} color="#d97706" style={{ marginTop: 2, flexShrink: 0 }} />
      <div>
        <p style={{ fontSize: '0.82rem', fontWeight: 700, color: '#92400e', margin: '0 0 4px' }}>
          {rows.length} exam{rows.length > 1 ? 's' : ''} awaiting faculty review
        </p>
        <p style={{ fontSize: '0.77rem', color: '#b45309', margin: 0 }}>
          Results will appear here once released:&nbsp;
          {rows.map((r) => r.exam_title).join(', ')}
        </p>
      </div>
    </div>
  )
}