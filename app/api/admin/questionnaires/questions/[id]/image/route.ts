import { NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/types/database'

type ServiceClient = ReturnType<typeof getServiceRoleClient>

type QuestionScopeRow = {
  id: string
  image_url: string | null
  exam_id: string | null
  question_bank_id: string | null
  exams: { program_id: string | null } | { program_id: string | null }[] | null
  question_banks: { program_id: string | null } | { program_id: string | null }[] | null
}

type ProfileRole = {
  role: string
}

type FacultyProgram = {
  program_id: string | null
}

type ImagePayload = {
  imageUrl?: string
}

function getServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Missing Supabase service role env vars.')
  }
  return createServiceClient<Database>(url, key, { auth: { persistSession: false } })
}

function firstJoin<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null
  }
  return value
}

async function getFacultyProgramIds(
  supabase: ServiceClient,
  userId: string,
): Promise<Set<string>> {
  const { data: faculty } = await supabase
    .from('faculty')
    .select('id, program_id')
    .eq('user_id', userId)
    .maybeSingle() as {
      data: { id: string; program_id: string | null } | null
      error: unknown
    }

  if (!faculty) {
    return new Set()
  }

  const { data, error } = await supabase
    .from('faculty_programs')
    .select('program_id')
    .eq('faculty_id', faculty.id) as {
      data: FacultyProgram[] | null
      error: unknown
    }

  if (error !== null) {
    throw new Error('Failed to resolve faculty program access.')
  }

  const ids = new Set((data ?? []).map((row) => row.program_id).filter((id): id is string => Boolean(id)))
  if (faculty.program_id) {
    ids.add(faculty.program_id)
  }
  return ids
}

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const sessionClient = await createServerClient()
  const { data: auth } = await sessionClient.auth.getUser()
  const user = auth.user

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getServiceRoleClient()
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle() as {
      data: ProfileRole | null
      error: unknown
    }

  if (profileError !== null || !profile || (profile.role !== 'admin' && profile.role !== 'faculty')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await context.params
  const body = (await req.json().catch(() => ({}))) as ImagePayload
  const imageUrl = body.imageUrl?.trim() ?? ''

  if (!imageUrl) {
    return NextResponse.json({ error: 'Missing imageUrl.' }, { status: 400 })
  }

  const { data: question, error: questionError } = await supabase
    .from('questions')
    .select('id,image_url,exam_id,question_bank_id,exams(program_id),question_banks(program_id)')
    .eq('id', id)
    .maybeSingle() as {
      data: QuestionScopeRow | null
      error: unknown
    }

  if (questionError !== null) {
    return NextResponse.json({ error: 'Failed to load question.' }, { status: 400 })
  }
  if (!question) {
    return NextResponse.json({ error: 'Question not found.' }, { status: 404 })
  }

  if (profile.role === 'faculty') {
    const exam = firstJoin(question.exams)
    const bank = firstJoin(question.question_banks)
    const questionProgramId = exam?.program_id ?? bank?.program_id ?? null
    const facultyProgramIds = await getFacultyProgramIds(supabase, user.id)

    if (!questionProgramId || !facultyProgramIds.has(questionProgramId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const now = new Date().toISOString()
  const { error: updateError } = await supabase
    .from('questions')
    .update({
      image_url: imageUrl,
      last_modified_by: user.id,
      last_modified_at: now,
    } as never)
    .eq('id', id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 })
  }

  const { data: saved, error: verifyError } = await supabase
    .from('questions')
    .select('id,image_url')
    .eq('id', id)
    .maybeSingle() as {
      data: { id: string; image_url: string | null } | null
      error: unknown
    }

  if (verifyError !== null) {
    return NextResponse.json({ error: 'Failed to confirm saved image URL.' }, { status: 400 })
  }
  if (!saved) {
    return NextResponse.json({ error: 'Image URL update did not match a question row.' }, { status: 404 })
  }

  return NextResponse.json({ question: saved })
}
