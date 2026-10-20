// components/dashboard/admin/analytics/ExamChart.tsx
// Pure UI — renders the Exam Performance bar chart. No data fetching.

import React from 'react'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'
import { BarChart2 } from 'lucide-react'
import type { ExamPerf } from '@/lib/types/admin/analytics/analytics.types'
import { chartVariants } from '@/animations/admin/analytics/analytics'
import styles from '@/app/(dashboard)/admin/analytics/analytics.module.css'

const BAR_COLORS_EXAM = ['#0891b2', '#059669', '#d97706', '#dc2626', '#7c3aed', '#4f5ff7']

// ── Tooltip ─────────────────────────────────────────────────────────────────

interface TooltipProps {
  active?:  boolean
  payload?: Array<{ value: number }>
  label?:   string
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) {
    return null
  }
  return (
    <div className={styles.customTooltip}>
      <p className={styles.tooltipLabel}>{label}</p>
      <p className={styles.tooltipValue}>{payload[0].value.toFixed(1)}%</p>
    </div>
  )
}

// ── Empty State ──────────────────────────────────────────────────────────────

function EmptyChart() {
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyIcon}><BarChart2 size={20} color="#8a9ab5" /></div>
      <p className={styles.emptyTitle}>No data yet</p>
      <p className={styles.emptySub}>Analytics will appear once exams are released.</p>
    </div>
  )
}

// ── Main Component ───────────────────────────────────────────────────────────

interface ExamChartProps {
  examPerf: ExamPerf[]
}

export default function ExamChart({ examPerf }: ExamChartProps) {
  return (
    <motion.div className={styles.chartCard} variants={chartVariants}>
      <div className={styles.chartCardHeader}>
        <div>
          <h2 className={styles.chartCardTitle}>Exam Performance</h2>
          <p className={styles.chartCardSub}>Average score per exam — top 8 (released only)</p>
        </div>
        <span className={styles.chartBadge}>{examPerf.length} exams</span>
      </div>
      <div className={styles.chartWrap}>
        {examPerf.length === 0 ? (
          <EmptyChart />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={examPerf}
              margin={{ top: 4, right: 8, left: -20, bottom: 40 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e9f0" vertical={false} />
              <XAxis
                dataKey="title"
                tick={{ fontSize: 10, fill: '#8a9ab5', fontWeight: 600 }}
                angle={-35}
                textAnchor="end"
                interval={0}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 10, fill: '#8a9ab5' }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f0f3f8' }} />
              <Bar dataKey="avg_score" radius={[5, 5, 0, 0]} maxBarSize={42}>
                {examPerf.map((_, idx) => (
                  <Cell
                    key={idx}
                    fill={BAR_COLORS_EXAM[idx % BAR_COLORS_EXAM.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  )
}