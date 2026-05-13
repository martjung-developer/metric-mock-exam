// app/api/admin/exams/[examId]/submissions/[submissionId]/force-submit/route.ts

import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { createServerClient }        from '@supabase/ssr'
import { cookies }                   from 'next/headers'
import type { Database }             from '@/lib/types/database'

async function getSupabaseServer() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    },
  )
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ examId: string; submissionId: string }> },
): Promise<NextResponse> {
  try {
    const { submissionId } = await params
    const supabase         = await getSupabaseServer()

    // ── Auth ──────────────────────────────────────────────────────────────────
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    let bodyStartedAt: string | null = null
    if ((req.headers.get('content-type') ?? '').includes('application/json')) {
      const body = (await req.json().catch(() => null)) as { started_at?: string } | null
      if (typeof body?.started_at === 'string' && body.started_at.length > 0) {
        bodyStartedAt = body.started_at
      }
    }

    // ── Verify admin or faculty role ──────────────────────────────────────────
    const { data: profileData } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const profile = profileData as Pick<Database['public']['Tables']['profiles']['Row'], 'role'> | null

    if (!profile || !['admin', 'faculty'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
    }

    // ── Fetch current submission to validate state ─────────────────────────────
    const { data: subData, error: fetchErr } = await supabase
      .from('submissions')
      .select('id, status, started_at')
      .eq('id', submissionId)
      .single()

    const sub = subData as Pick<Database['public']['Tables']['submissions']['Row'], 'id' | 'status' | 'started_at'> | null

    if (fetchErr || !sub) {
      return NextResponse.json({ error: 'Submission not found.' }, { status: 404 })
    }

    if (sub.status !== 'in_progress') {
      return NextResponse.json(
        { error: `Submission is already "${sub.status}" — only in_progress can be force-submitted.` },
        { status: 409 },
      )
    }

    // ── Compute timestamps ────────────────────────────────────────────────────
    const now       = new Date().toISOString()
    const startedAt = bodyStartedAt ?? sub.started_at
    if (!startedAt) {
      return NextResponse.json({ error: 'Missing started_at for submission.' }, { status: 409 })
    }

    const timeSpent = Math.max(
      0,
      Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000),
    )

    // ── Persist ───────────────────────────────────────────────────────────────
    const patch: Database['public']['Tables']['submissions']['Update'] = {
      status:             'submitted',
      submitted_at:       now,
      time_spent_seconds: timeSpent,
    }

    const { error: updateErr } = await supabase
      .from('submissions')
      .update(patch)
      .eq('id', submissionId)

    if (updateErr) {
      console.error('[POST force-submit]', updateErr.message)
      return NextResponse.json({ error: updateErr.message }, { status: 500 })
    }

    return NextResponse.json({
      data: {
        submission_id:      submissionId,
        status:             'submitted',
        submitted_at:       now,
        time_spent_seconds: timeSpent,
      },
    })
  } catch (err) {
    console.error('[POST force-submit] unexpected:', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
