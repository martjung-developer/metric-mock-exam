import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchPendingReviewItems } from '@/lib/services/approval/approval.service'
import type { ApprovalStatus, PendingReviewItem } from '@/lib/types/approval'

type ApprovalListMode = 'pending' | 'all'

export async function GET(req: Request): Promise<NextResponse> {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  const user = auth.user

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const mode = (new URL(req.url).searchParams.get('mode') ?? 'pending') as ApprovalListMode

  try {
    if (mode !== 'all') {
      const items = await fetchPendingReviewItems(supabase)
      return NextResponse.json({ items })
    }

    const { data: exams, error } = await supabase
      .from('exams')
      .select('id,title,program_id,submitted_at,approval_status,review_notes,submitted_by, programs(code,name), profiles!exams_submitted_by_fkey(full_name)')
      .in('approval_status', ['pending_review', 'approved', 'rejected', 'published'])
      .order('submitted_at', { ascending: false })

    if (error) {
      throw new Error(error.message)
    }

    const items: PendingReviewItem[] = (exams ?? []).map((row) => {
      const program = Array.isArray(row.programs) ? row.programs[0] : row.programs
      const submitter = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
      return {
        id: row.id,
        entityType: 'exam',
        title: row.title,
        submittedBy: row.submitted_by,
        submittedAt: row.submitted_at,
        programCode: program?.code ?? null,
        status: row.approval_status as ApprovalStatus,
        reviewNotes: row.review_notes,
        submittedByName: submitter?.full_name ?? null,
        programName: program?.name ?? null,
      }
    })

    return NextResponse.json({ items })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to load approvals.' },
      { status: 500 },
    )
  }
}

