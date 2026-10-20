// app/api/admin/exams/[examId]/submissions/route.ts

import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import type { Database }             from '@/lib/types/database'

function getServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Missing Supabase service role env vars.')
  }
  return createServiceClient<Database>(url, key, { auth: { persistSession: false } })
}

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ examId: string }> },
): Promise<NextResponse> {
  try {
    const { examId } = await params
    const supabase   = await createServerClient()

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile || (profile.role !== 'admin' && profile.role !== 'faculty')) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
    }

    const admin = getServiceRoleClient()

    const { data, error } = await admin
      .from('submissions')
      .select(
        'id, student_id, attempt_no, started_at, submitted_at, time_spent_seconds, ' +
        'status, score, percentage, passed',
      )
      .eq('exam_id', examId)
      .order('started_at', { ascending: false })

    if (error) {
      console.error('[GET /submissions]', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const rows = data ?? []
    const studentIds = [
      ...new Set(rows.map((row) => row.student_id).filter((id): id is string => id !== null)),
    ]
    const submissionIds = rows.map((row) => row.id)

    const [studentsRes, profilesRes, answersRes, questionsRes, examRes] = await Promise.all([
      studentIds.length > 0
        ? admin.from('students').select('id, student_id').in('id', studentIds)
        : Promise.resolve({ data: [], error: null }),
      studentIds.length > 0
        ? admin.from('profiles').select('id, full_name, email').in('id', studentIds)
        : Promise.resolve({ data: [], error: null }),
      submissionIds.length > 0
        ? admin
            .from('answers')
            .select('submission_id, points_earned')
            .in('submission_id', submissionIds)
        : Promise.resolve({ data: [], error: null }),
      admin
        .from('questions')
        .select('points')
        .eq('exam_id', examId),
      admin
        .from('exams')
        .select('passing_score')
        .eq('id', examId)
        .maybeSingle(),
    ])

    if (studentsRes.error || profilesRes.error || answersRes.error || questionsRes.error || examRes.error) {
      return NextResponse.json({ error: 'Failed to assemble submissions.' }, { status: 500 })
    }

    const studentMap = new Map((studentsRes.data ?? []).map((student) => [student.id, student]))
    const profileMap = new Map((profilesRes.data ?? []).map((profileRow) => [profileRow.id, profileRow]))
    const earnedMap = new Map<string, number>()
    const totalPoints = (questionsRes.data ?? []).reduce(
      (sum, question) => sum + (question.points ?? 1),
      0,
    )
    const passingScore = Number(examRes.data?.passing_score ?? 0)

    for (const answer of answersRes.data ?? []) {
      if (!answer.submission_id || answer.points_earned === null) {
        continue
      }
      earnedMap.set(
        answer.submission_id,
        (earnedMap.get(answer.submission_id) ?? 0) + answer.points_earned,
      )
    }

    const assembled = rows.map((row) => {
      const student = row.student_id ? studentMap.get(row.student_id) : null
      const profileRow = row.student_id ? profileMap.get(row.student_id) : null
      const earned = earnedMap.get(row.id)
      const percentage = earned !== undefined && totalPoints > 0
        ? parseFloat(((earned / totalPoints) * 100).toFixed(2))
        : row.percentage

      return {
        ...row,
        score: earned !== undefined ? earned : row.score,
        percentage,
        passed: percentage !== null ? percentage >= passingScore : row.passed,
        students: student
          ? {
              student_id: student.student_id,
              profiles: profileRow ?? null,
            }
          : null,
      }
    })

    return NextResponse.json({ data: assembled })
  } catch (err) {
    console.error('[GET /submissions] unexpected:', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}

