// app/(dashboard)/faculty/students/page.tsx
import { redirect } from 'next/navigation'

export default function FacultyProxyPage() {
  redirect('/admin/students')
}

