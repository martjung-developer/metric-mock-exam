// lib/utils/student/results/formatDate.ts
export function formatDate(iso: string | null): string {
  if (!iso) { return '—' }
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day:   'numeric',
    year:  'numeric',
  })
}