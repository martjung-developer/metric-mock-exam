// lib/utils/student/results/formatTime.ts
export function formatTime(seconds: number | null): string {
  if (!seconds) { return '—' }
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m === 0 ? `${s}s` : `${m}m${s > 0 ? ` ${s}s` : ''}`
}