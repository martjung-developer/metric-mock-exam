// components/dashboard/student/progress/DonutChart.tsx
'use client'

import { memo } from 'react'
import type { DonutSlice } from '@/lib/types/student/progress/progress.types'
import styles from '@/app/(dashboard)/student/progress/progress.module.css'

interface Props {
  slices: readonly DonutSlice[] | DonutSlice[]
}

const R    = 42
const CX   = 56
const CY   = 56
const CIRC = 2 * Math.PI * R

export const DonutChart = memo(function DonutChart({ slices }: Props) {
  // Compute stroke-dasharray offsets for each arc
  const arcs = (slices as DonutSlice[]).reduce((acc: Array<DonutSlice & { dash: number; offset: number }>, s: DonutSlice, i: number) => {
    const cumPct = slices.slice(0, i).reduce((sum, sl) => sum + sl.pct, 0)
    acc.push({
      ...s,
      dash:   (s.pct / 100) * CIRC,
      offset: CIRC - cumPct * (CIRC / 100),
    })
    return acc
  }, [])

  return (
    <div className={styles.donutWrap}>
      <svg
        viewBox="0 0 112 112"
        className={styles.donutSvg}
        aria-label="Study distribution donut chart"
        role="img"
      >
        {/* Track */}
        <circle
          cx={CX} cy={CY} r={R}
          fill="none"
          stroke="#f1f5f9"
          strokeWidth="12"
        />

        {/* Segments */}
        {arcs.map((a, i) => (
          <circle
            key={i}
            cx={CX} cy={CY} r={R}
            fill="none"
            stroke={a.color}
            strokeWidth="12"
            strokeDasharray={`${a.dash} ${CIRC - a.dash}`}
            strokeDashoffset={a.offset}
            transform={`rotate(-90 ${CX} ${CY})`}
          />
        ))}

        {/* Centre text */}
        <text x={CX} y={CY - 4}  textAnchor="middle" fill="#1e293b" fontSize="12" fontWeight="700">
          100%
        </text>
        <text x={CX} y={CY + 10} textAnchor="middle" fill="#94a3b8" fontSize="7.5">
          of time
        </text>
      </svg>

      {/* Legend */}
      <div className={styles.donutLegend}>
        {slices.map((s) => (
          <div key={s.label} className={styles.legendRow}>
            <span className={styles.legendDot}  style={{ background: s.color }} />
            <span className={styles.legendLabel}>{s.label}</span>
            <span className={styles.legendPct}  >{s.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  )
})