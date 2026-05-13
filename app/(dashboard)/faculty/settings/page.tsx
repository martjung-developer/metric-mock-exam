// app/(dashboard)/faculty/settings/page.tsx
import { redirect } from 'next/navigation'

export default function FacultyProxyPage() {
  redirect('/admin/settings')
}