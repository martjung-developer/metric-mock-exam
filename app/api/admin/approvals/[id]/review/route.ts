import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { reviewAction } from '@/lib/services/approval/approval.service'
import { emitApprovalStreamEvent } from '@/lib/services/approval/approval.stream'
import type { ApprovalEntityType, ReviewActionPayload, ApprovalStatus } from '@/lib/types/approval'
import type { ApprovalReviewDetail, ApprovalReviewQuestion } from '@/lib/types/approval'

interface ReviewBody {
  action?: ReviewActionPayload['action']
  note?: string
  entityType?: ApprovalEntityType
}

function buildChoices(options: unknown): { label: string; text: string }[] {
  if (!Array.isArray(options)) {
    return []
  }
  const mapped = options
    .map((opt) => {
      if (!opt || typeof opt !== 'object') {
        return null
      }
      const row = opt as Record<string, unknown>
      const label = typeof row.label === 'string' ? row.label.toUpperCase() : ''
      const text = typeof row.text === 'string' ? row.text : ''
      if (!label || !text) {
        return null
      }
      return { label, text }
    })
    .filter((v): v is { label: string; text: string } => v !== null)

  if (mapped.length > 0) {
    return mapped
  }

  return ['A', 'B', 'C', 'D'].map((label, i) => {
    const value = options[i]
    return {
      label,
      text: typeof value === 'string' ? value : '',
    }
  })
}

export async function GET(
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
  const entityType = (new URL(req.url).searchParams.get('entityType') ?? 'question_bank') as ApprovalEntityType
  if (entityType !== 'exam' && entityType !== 'question_bank') {
    return NextResponse.json({ error: 'Unsupported entity type.' }, { status: 400 })
  }

  let detail: ApprovalReviewDetail | null = null

  if (entityType === 'question_bank') {
    const { data: bank, error: bankError } = await supabase
      .from('question_banks')
      .select(`
        id, title, approval_status, submitted_at, submitted_by, exam_id,
        programs ( code, name ),
        profiles!question_banks_submitted_by_fkey ( full_name, avatar_url )
      `)
      .eq('id', id)
      .single()

    if (bankError || !bank) {
      return NextResponse.json({ error: bankError?.message ?? 'Question bank not found.' }, { status: 404 })
    }

    const { data: questions, error: qError } = await supabase
      .from('questions')
      .select('id, order_number, scenario, question_text, options, correct_answer')
      .eq('question_bank_id', id)
      .order('order_number', { ascending: true, nullsFirst: false })

    if (qError) {
      return NextResponse.json({ error: qError.message }, { status: 500 })
    }

    const questionRows: ApprovalReviewQuestion[] = (questions ?? []).map((row, idx) => {
      const choices = buildChoices(row.options)
      const correct = row.correct_answer ? String(row.correct_answer).trim().toUpperCase() : null
      return {
        id: row.id,
        questionNumber: Number(row.order_number ?? idx + 1),
        scenario: row.scenario,
        stem: row.question_text,
        choices,
        correctAnswer: correct,
        hasParseIssue: !correct || !['A', 'B', 'C', 'D'].includes(correct),
      }
    })

    const program = Array.isArray(bank.programs) ? bank.programs[0] : bank.programs
    const submitter = Array.isArray(bank.profiles) ? bank.profiles[0] : bank.profiles
    detail = {
      examId: bank.exam_id ?? bank.id,
      title: bank.title,
      status: (bank.approval_status ?? 'draft') as ApprovalStatus,
      programCode: program?.code ?? null,
      programName: program?.name ?? null,
      submittedAt: bank.submitted_at,
      facultyId: bank.submitted_by,
      facultyName: submitter?.full_name ?? null,
      facultyAvatarUrl: submitter?.avatar_url ?? null,
      metadata: {
        durationMinutes: null,
        passingScore: null,
        examType: 'question_bank',
        category: null,
        questionCount: questionRows.length,
      },
      questions: questionRows,
    }
  } else {
    const { data: exam, error: examError } = await supabase
      .from('exams')
      .select(`
        id, title, approval_status, submitted_at, submitted_by, duration_minutes, passing_score, exam_type,
        programs ( code, name ),
        exam_categories ( name ),
        profiles!exams_submitted_by_fkey ( full_name, avatar_url )
      `)
      .eq('id', id)
      .single()

    if (examError || !exam) {
      return NextResponse.json({ error: examError?.message ?? 'Exam not found.' }, { status: 404 })
    }

    const { data: questions, error: qError } = await supabase
      .from('questions')
      .select('id, order_number, scenario, question_text, options, correct_answer')
      .eq('exam_id', id)
      .order('order_number', { ascending: true, nullsFirst: false })

    if (qError) {
      return NextResponse.json({ error: qError.message }, { status: 500 })
    }

    const questionRows: ApprovalReviewQuestion[] = (questions ?? []).map((row, idx) => {
      const choices = buildChoices(row.options)
      const correct = row.correct_answer ? String(row.correct_answer).trim().toUpperCase() : null
      return {
        id: row.id,
        questionNumber: Number(row.order_number ?? idx + 1),
        scenario: row.scenario,
        stem: row.question_text,
        choices,
        correctAnswer: correct,
        hasParseIssue: !correct || !['A', 'B', 'C', 'D'].includes(correct),
      }
    })

    const program = Array.isArray(exam.programs) ? exam.programs[0] : exam.programs
    const category = Array.isArray(exam.exam_categories) ? exam.exam_categories[0] : exam.exam_categories
    const submitter = Array.isArray(exam.profiles) ? exam.profiles[0] : exam.profiles
    detail = {
      examId: exam.id,
      title: exam.title,
      status: (exam.approval_status ?? 'draft') as ApprovalStatus,
      programCode: program?.code ?? null,
      programName: program?.name ?? null,
      submittedAt: exam.submitted_at,
      facultyId: exam.submitted_by,
      facultyName: submitter?.full_name ?? null,
      facultyAvatarUrl: submitter?.avatar_url ?? null,
      metadata: {
        durationMinutes: exam.duration_minutes,
        passingScore: exam.passing_score,
        examType: exam.exam_type,
        category: category?.name ?? null,
        questionCount: questionRows.length,
      },
      questions: questionRows,
    }
  }
  return NextResponse.json({ detail })
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
  const entityType = body.entityType ?? 'question_bank'
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

    const sourceTable = entityType === 'question_bank' ? 'question_banks' : 'exams'
    const { data: row } = await supabase
      .from(sourceTable)
      .select('submitted_by, approval_status')
      .eq('id', id)
      .single()

    if (row?.submitted_by) {
      const statusLabel = row.approval_status === 'published' ? 'approved and published' : row.approval_status
      const itemLabel = entityType === 'question_bank' ? 'question bank' : 'exam'
      await supabase.from('notifications').insert({
        user_id: row.submitted_by,
        title: 'Approval Update',
        message: `Your ${itemLabel} was ${statusLabel}.`,
        type: 'info',
      })
    }

    emitApprovalStreamEvent({
      type: 'approval_updated',
      entityType,
      entityId: id,
      status: action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : action,
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
