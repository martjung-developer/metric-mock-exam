import { NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/types/database'

function getServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Missing Supabase service role env vars.')
  }
  return createServiceClient<Database>(url, key, { auth: { persistSession: false } })
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ examId: string; submissionId: string }> },
): Promise<NextResponse> {
  const sessionClient = await createServerClient()
  const { data: auth } = await sessionClient.auth.getUser()
  const user = auth.user

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const admin = getServiceRoleClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile || (profile.role !== 'admin' && profile.role !== 'faculty')) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
  }

  const { examId, submissionId } = await context.params

  const { data: submission } = await admin
    .from('submissions')
    .select('id, exam_id')
    .eq('id', submissionId)
    .eq('exam_id', examId)
    .maybeSingle()

  if (!submission) {
    return NextResponse.json({ error: 'Submission not found.' }, { status: 404 })
  }

  const [questionsRes, answersRes, areasRes] = await Promise.all([
    admin
      .from('questions')
      .select('id, question_text, question_type, scenario, points, options, correct_answer, explanation, order_number, section_title')
      .eq('exam_id', examId)
      .order('order_number', { ascending: true, nullsFirst: false }),
    admin
      .from('answers')
      .select('id, question_id, answer_text, is_correct, points_earned, feedback')
      .eq('submission_id', submissionId),
    admin
      .from('exam_tos_areas')
      .select('area_title, weight_percent, expected_items, min_percent')
      .eq('exam_id', examId),
  ])

  if (questionsRes.error || answersRes.error) {
    return NextResponse.json({ error: 'Failed to load submission answers.' }, { status: 500 })
  }

  return NextResponse.json({
    questions: questionsRes.data ?? [],
    answers: answersRes.data ?? [],
    tosAreas: areasRes.error ? [] : areasRes.data ?? [],
  })
}
