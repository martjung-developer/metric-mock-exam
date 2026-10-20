// lib/utils/student/results/getPctColor.ts
export function getPctColor(pct: number | null): string {
  if (pct === null) { return '#9ca3af' }
  if (pct >= 75)    { return '#059669' }
  if (pct >= 50)    { return '#d97706' }
  return '#dc2626'
}