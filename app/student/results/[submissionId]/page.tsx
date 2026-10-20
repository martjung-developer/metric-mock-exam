import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { fetchStudentSubmissionReview } from '@/lib/services/student/results/resultReview.service'
import { ResultsReviewClient } from './ResultsReviewClient'

export default async function StudentResultReviewPage({
  params,
}: {
  params: Promise<{ submissionId: string }>
}) {
  const { submissionId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: review, error } = await fetchStudentSubmissionReview(supabase, submissionId, user.id)
  if (error || !review) {
    redirect('/student/results')
  }

  if (review.status !== 'released') {
    redirect(`/student/results/${submissionId}/pending`)
  }

  return <ResultsReviewClient review={review} />
}
