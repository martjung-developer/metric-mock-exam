// web/app/api/admin/approvals/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchPendingReviewItems } from '@/lib/services/approval/approval.service'
import type { ApprovalStatus, PendingReviewItem } from '@/lib/types/approval'

type ApprovalListMode = 'pending' | 'all'

type ApprovalExamRow = {
  id: string
  title: string
  submitted_by: string | null
  submitted_at: string | null
  approval_status: ApprovalStatus
  review_notes: string | null
  programs: { code: string | null; name: string | null } | { code: string | null; name: string | null }[] | null
  profiles: { full_name: string | null } | { full_name: string | null }[] | null
}

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

  if (!profile || (profile.role !== 'admin' && profile.role !== 'faculty')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let programScope: string | null = null
  if (profile.role === 'faculty') {
    const { data: faculty } = await supabase
      .from('faculty')
      .select('program_id, is_program_head')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!faculty?.is_program_head || !faculty.program_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    programScope = faculty.program_id
  }

  const mode = (new URL(req.url).searchParams.get('mode') ?? 'pending') as ApprovalListMode

  try {
    if (mode !== 'all') {
      const items = await fetchPendingReviewItems(supabase, programScope)
      return NextResponse.json({ items })
    }

    let query = supabase
      .from('exams')
      .select('id,title,program_id,submitted_at,approval_status,review_notes,submitted_by, programs(code,name), profiles!exams_submitted_by_fkey(full_name)')
      .in('approval_status', ['pending_review', 'approved', 'rejected', 'published'])

    if (programScope) {
      query = query.eq('program_id', programScope)
    }

    const { data: exams, error } = await query
      .order('submitted_at', { ascending: false })

    if (error) {
      throw new Error(error.message)
    }

    const items: PendingReviewItem[] = ((exams ?? []) as ApprovalExamRow[]).map((row) => {
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
