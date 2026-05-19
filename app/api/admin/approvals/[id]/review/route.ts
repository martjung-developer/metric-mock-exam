import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { reviewAction } from '@/lib/services/approval/approval.service'
import { emitApprovalStreamEvent } from '@/lib/services/approval/approval.stream'
import type { ApprovalEntityType, ReviewActionPayload } from '@/lib/types/approval'

interface ReviewBody {
  action?: ReviewActionPayload['action']
  note?: string
  entityType?: ApprovalEntityType
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
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

  const { id } = await context.params
  const body = (await req.json().catch(() => ({}))) as ReviewBody
  const entityType = body.entityType ?? 'exam'
  const action = body.action

  if (!action) {
    return NextResponse.json({ error: 'Missing action' }, { status: 400 })
  }

  try {
    await reviewAction(
      supabase,
      {
        entityType,
        entityId: id,
        action,
        notes: body.note,
      },
      user.id,
    )

    // Requirement: approve should also publish exam immediately.
    if (entityType === 'exam' && action === 'approve') {
      await reviewAction(
        supabase,
        {
          entityType: 'exam',
          entityId: id,
          action: 'publish',
          notes: body.note,
        },
        user.id,
      )
    }

    const { data: examRow } = await supabase
      .from('exams')
      .select('submitted_by, approval_status')
      .eq('id', id)
      .single()

    if (examRow?.submitted_by) {
      const statusLabel = examRow.approval_status === 'published' ? 'approved and published' : examRow.approval_status
      await supabase.from('notifications').insert({
        user_id: examRow.submitted_by,
        title: 'Exam Approval Update',
        message: `Your exam was ${statusLabel}.`,
        type: 'info',
      })
    }

    emitApprovalStreamEvent({
      type: 'approval_updated',
      entityType,
      entityId: id,
      status: action === 'approve' ? 'published' : action === 'reject' ? 'rejected' : action,
      at: new Date().toISOString(),
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to review approval.' },
      { status: 400 },
    )
  }
}

