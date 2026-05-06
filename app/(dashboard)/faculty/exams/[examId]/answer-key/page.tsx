import { redirect } from 'next/navigation'

export default async function FacultyProxyPage({ params }: { params: Promise<{ examId: string }> }) {
  const p = await params
  redirect('/admin/exams/' + p.examId + '/answer-key')
}

