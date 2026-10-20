// components/dashboard/student/progress/LineChart.tsx
'use client'

import { memo } from 'react'
import type { TimelinePoint } from '@/lib/types/student/progress/progress.types'
import styles from '@/app/(dashboard)/student/progress/progress.module.css'

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

function buildShowIndices(length: number): number[] {
  if (length <= 8) {return Array.from({ length }, (_, i) => i)}
  return [
    0,
    Math.floor((length - 1) / 3),
    Math.floor(2 * (length - 1) / 3),
    length - 1,
  ]
}

// ── SVG Line chart ─────────────────────────────────────────────────────────────

interface Props {
  data: TimelinePoint[]
}

const W = 520
const H = 155
const P = { top: 18, right: 12, bottom: 26, left: 30 } as const

export const LineChart = memo(function LineChart({ data }: Props) {
  if (data.length < 2) {
    return (
      <div style={{
        height: H,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#94a3b8',
        fontSize: '0.8rem',
      }}>
        Not enough data for this range yet.
      </div>
    )
  }

  const scores   = data.map((d) => d.score)
  const minV     = Math.min(...scores) - 8
  const maxV     = Math.max(...scores) + 8
  const xFn      = (i: number) => P.left + (i / (data.length - 1)) * (W - P.left - P.right)
  const yFn      = (v: number) => P.top + ((maxV - v) / (maxV - minV)) * (H - P.top - P.bottom)
  const polyPts  = data.map((d, i) => `${xFn(i)},${yFn(d.score)}`).join(' ')
  const areaClose = `${xFn(data.length - 1)},${H - P.bottom} ${xFn(0)},${H - P.bottom}`
  const gridVals  = [60, 70, 80, 90]
  const showIdx   = buildShowIndices(data.length)

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={styles.lineSvg}
      preserveAspectRatio="xMidYMid meet"
      aria-label="Score over time chart"
      role="img"
    >
      <defs>
        <linearGradient id="lineArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#3b82f6" stopOpacity="0.10" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.00" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {gridVals.map((v) => (
        <g key={v}>
          <line x1={P.left} x2={W - P.right} y1={yFn(v)} y2={yFn(v)} stroke="#f1f5f9" strokeWidth="1" />
          <text x={P.left - 5} y={yFn(v) + 4} fill="#94a3b8" fontSize="9" textAnchor="end">{v}</text>
        </g>
      ))}

      {/* X-axis labels */}
      {showIdx.map((i) => (
        <text key={i} x={xFn(i)} y={H - P.bottom + 14} fill="#94a3b8" fontSize="9" textAnchor="middle">
          {fmtDate(data[i].date)}
        </text>
      ))}

      {/* Area fill */}
      <polygon points={`${polyPts} ${areaClose}`} fill="url(#lineArea)" />

      {/* Line */}
      <polyline
        points={polyPts}
        fill="none"
        stroke="#3b82f6"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Data points */}
      {data.map((d, i) => {
        const isLast = i === data.length - 1
        return (
          <g key={i}>
            <circle
              cx={xFn(i)} cy={yFn(d.score)}
              r={isLast ? 5 : 3}
              fill={isLast ? '#3b82f6' : '#fff'}
              stroke="#3b82f6"
              strokeWidth="2"
            />
            {isLast && (
              <text
                x={xFn(i)} y={yFn(d.score) - 9}
                fill="#3b82f6" fontSize="10" fontWeight="700" textAnchor="middle"
              >
                {d.score}%
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
})