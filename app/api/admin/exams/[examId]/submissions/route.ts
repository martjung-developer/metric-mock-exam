// app/api/admin/exams/[examId]/submissions/route.ts

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

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ examId: string }> },
): Promise<NextResponse> {
  try {
    const { examId } = await params
    const supabase   = await getSupabaseServer()

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('submissions')
      .select(
        'id, student_id, started_at, submitted_at, time_spent_seconds, ' +
        'status, score, percentage, passed',
      )
      .eq('exam_id', examId)
      .order('started_at', { ascending: false })

    if (error) {
      console.error('[GET /submissions]', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: data ?? [] })
  } catch (err) {
    console.error('[GET /submissions] unexpected:', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}

