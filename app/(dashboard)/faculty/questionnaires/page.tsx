// app/(dashboard)/faculty/questionnaires/page.tsx
import { redirect } from 'next/navigation'

export default function FacultyQuestionnairesProxy() {
  redirect('/admin/questionnaires')
}