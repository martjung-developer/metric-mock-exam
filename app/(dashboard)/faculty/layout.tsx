import type { Metadata } from 'next'
import AdminLayoutClient from '@/app/(dashboard)/admin/AdminLayoutClient'

export const metadata: Metadata = {
  title: 'VERIPRAXIS - Faculty Panel',
  description: 'Faculty dashboard for managing exams, submissions, and students in assigned programs.',
}

export default function FacultyLayout({ children }: { children: React.ReactNode }) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>
}
