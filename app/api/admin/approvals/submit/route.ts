import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { submitForReview } from '@/lib/services/approval/approval.service'
import { emitApprovalStreamEvent } from '@/lib/services/approval/approval.stream'
import type { ApprovalEntityType } from '@/lib/types/approval'

interface SubmitBody {
  entityType?: ApprovalEntityType
  entityId?: string
}

export async function POST(req: Request): Promise<NextResponse> {
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

  if (!profile || profile.role !== 'faculty') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = (await req.json().catch(() => ({}))) as SubmitBody
  const entityType = body.entityType ?? 'exam'
  const entityId = body.entityId

  if (!entityId) {
    return NextResponse.json({ error: 'Missing entityId' }, { status: 400 })
  }

  try {
    await submitForReview(supabase, entityType, entityId, user.id)
    emitApprovalStreamEvent({
      type: 'approval_submitted',
      entityType,
      entityId,
      status: 'pending_review',
      at: new Date().toISOString(),
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to submit for review.' },
      { status: 400 },
    )
  }
}

