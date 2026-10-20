// lib/utils/admin/students/[examId]/helpers.ts
export function getInitials(name: string | null, email: string): string {
  if (name) {
    const parts = name.trim().split(' ')
    if (parts.length >= 2) {
      return ((parts[0]?.[0] ?? '') + (parts[parts.length - 1]?.[0] ?? '')).toUpperCase()
    }
    return (parts[0] ?? '').slice(0, 2).toUpperCase()
  }
  return email.slice(0, 2).toUpperCase()
}