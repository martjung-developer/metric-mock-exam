// lib/utils/admin/students/[examId]/format.ts
export function formatDate(iso: string | null): string {
  if (!iso) { return '—' }
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day:   'numeric',
    year:  'numeric',
  })
}

export function yearLabel(n: number | null): string {
  if (!n) { return '—' }
  const suffix = ['st', 'nd', 'rd'][n - 1] ?? 'th'
  return `${n}${suffix} Year`
}