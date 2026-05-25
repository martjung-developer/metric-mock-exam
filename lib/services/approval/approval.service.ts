// lib/services/approval/approval.service.ts
// ─────────────────────────────────────────────────────────────────────────────
// Role-aware approval workflow service.
// Faculty:  submit, retract, view own submissions
// Admins:   review, approve, reject, publish, archive all submissions
// ─────────────────────────────────────────────────────────────────────────────

import type { SupabaseClient }   from '@supabase/supabase-js'
import type { Database }         from '@/lib/types/database'
import type {
  ApprovalStatus,
  ApprovalEntityType,
  ApprovalEvent,
  PendingReviewItem,
  QuestionBank,
  ReviewActionPayload,
  FacultySubmissionSummary,
} from '@/lib/types/approval'

type TypedClient = SupabaseClient<Database>

// ── Helpers ───────────────────────────────────────────────────────────────────

type ApprovalTableName = 'exams' | 'questions' | 'question_banks'

function assertNever(x: never): never {
  throw new Error(`Unhandled case: ${String(x)}`)
}

function toError(err: unknown): Error {
  return err instanceof Error ? err : new Error(String(err))
}

// Map action → next status
function actionToStatus(
  action: ReviewActionPayload['action'],
): ApprovalStatus {
  switch (action) {
    case 'approve':  return 'approved'
    case 'reject':   return 'rejected'
    case 'publish':  return 'published'
    case 'archive':  return 'archived'
    default:         return assertNever(action)
  }
}

// ── Submission ────────────────────────────────────────────────────────────────

/**
 * Faculty: transition entity from draft → pending_review.
 * Enforces ownership — faculty can only submit their own content.
 */
export async function submitForReview(
  client:     TypedClient,
  entityType: ApprovalEntityType,
  entityId:   string,
  actorId:    string,
): Promise<void> {
  const table = entityTypeToTable(entityType)
  const now   = new Date().toISOString()

  // Ownership check
  const { data: row, error: fetchErr } = await client
    .from(table)
    .select('submitted_by, approval_status')
    .eq('id', entityId)
    .single() as {
      data:  { submitted_by: string | null; approval_status: ApprovalStatus } | null
      error: unknown
    }

  if (fetchErr !== null || row === null) {
    throw new Error('Content not found.')
  }
  if (row.submitted_by !== null && row.submitted_by !== actorId) {
    throw new Error('You do not own this content.')
  }
  if (
    row.approval_status !== 'draft' &&
    row.approval_status !== 'rejected' &&
    row.approval_status !== 'approved' &&
    row.approval_status !== 'published'
  ) {
    throw new Error(`Cannot submit content in '${row.approval_status}' state.`)
  }

  const updatePayload: {
    approval_status: 'pending_review'
    submitted_by: string
    submitted_at: string
    is_published?: boolean
    published_at?: null
  } = {
    approval_status: 'pending_review',
    submitted_by: actorId,
    submitted_at: now,
  }
  if (entityType === 'exam' && row.approval_status === 'published') {
    updatePayload.is_published = false
    updatePayload.published_at = null
  }

  const { error: updateErr } = await client
    .from(table)
    .update(updatePayload as never)
    .eq('id', entityId)

  if (updateErr !== null) {
    throw toError(updateErr)
  }

  await logApprovalEvent(client, {
    entity_type:  entityType,
    entity_id:    entityId,
    from_status:  row.approval_status,
    to_status:    'pending_review',
    actor_id:     actorId,
  })
}

/**
 * Admin: approve / reject / publish / archive.
 */
export async function reviewAction(
  client:  TypedClient,
  payload: ReviewActionPayload,
  actorId: string,
): Promise<void> {
  const { entityType, entityId, action, notes } = payload
  const table    = entityTypeToTable(entityType)
  const toStatus = actionToStatus(action)
  const now      = new Date().toISOString()

  const { data: row, error: fetchErr } = await client
    .from(table)
    .select('approval_status')
    .eq('id', entityId)
    .single() as {
      data:  { approval_status: ApprovalStatus } | null
      error: unknown
    }

  if (fetchErr !== null || row === null) {
    throw new Error('Content not found.')
  }

  validateTransition(row.approval_status, toStatus)

  const updates: Record<string, unknown> = {
    approval_status: toStatus,
    review_notes:    notes ?? null,
  }

  if (action === 'approve') {
    updates['approved_by'] = actorId
    updates['approved_at'] = now
  }
  if (action === 'reject') {
    updates['rejected_at'] = now
  }
  if (action === 'publish') {
    updates['published_at'] = now
    updates['is_published']  = true   // keep existing exams.is_published in sync
  }

  const { error: updateErr } = await client
    .from(table)
    .update(updates as never)
    .eq('id', entityId)

  if (updateErr !== null) {
    throw toError(updateErr)
  }

  await logApprovalEvent(client, {
    entity_type:  entityType,
    entity_id:    entityId,
    from_status:  row.approval_status,
    to_status:    toStatus,
    actor_id:     actorId,
    notes,
  })
}

// ── Queries ───────────────────────────────────────────────────────────────────

/**
 * Admin: fetch all items in pending_review state across exams + question_banks.
 */
export async function fetchPendingReviewItems(
  client: TypedClient,
): Promise<PendingReviewItem[]> {
  const [examsRes, banksRes] = await Promise.all([
    client
      .from('exams')
      .select(`
        id, title, submitted_by, submitted_at, review_notes, approval_status,
        programs ( code ),
        profiles!exams_submitted_by_fkey ( full_name )
      `)
      .eq('approval_status', 'pending_review')
      .order('submitted_at', { ascending: true }) as {
        data: Array<{
          id: string; title: string; submitted_by: string | null
          submitted_at: string | null; review_notes: string | null
          approval_status: ApprovalStatus
          programs: { code: string } | null
          profiles: { full_name: string | null } | { full_name: string | null }[] | null
        }> | null
        error: unknown
      },
    client
      .from('question_banks')
      .select(`
        id, title, submitted_by, submitted_at, review_notes, approval_status,
        programs ( code, name ),
        profiles!question_banks_submitted_by_fkey ( full_name )
      `)
      .eq('approval_status', 'pending_review')
      .order('submitted_at', { ascending: false }) as {
        data: Array<{
          id: string; title: string; submitted_by: string | null
          submitted_at: string | null; review_notes: string | null
          approval_status: ApprovalStatus
          programs: { code: string; name: string } | null
          profiles: { full_name: string | null } | { full_name: string | null }[] | null
        }> | null
        error: unknown
      },
  ])

  const items: PendingReviewItem[] = []

  for (const row of examsRes.data ?? []) {
    items.push({
      id:          row.id,
      entityType:  'exam',
      title:       row.title,
      submittedBy: row.submitted_by,
      submittedAt: row.submitted_at,
      programCode: Array.isArray(row.programs)
        ? (row.programs[0]?.code ?? null)
        : (row.programs?.code ?? null),
      status:      row.approval_status,
      reviewNotes: row.review_notes,
      submittedByName: Array.isArray(row.profiles)
        ? (row.profiles[0]?.full_name ?? null)
        : (row.profiles?.full_name ?? null),
    })
  }

  for (const row of banksRes.data ?? []) {
    items.push({
      id:          row.id,
      entityType:  'question_bank',
      title:       row.title,
      submittedBy: row.submitted_by,
      submittedAt: row.submitted_at,
      programCode: Array.isArray(row.programs)
        ? (row.programs[0]?.code ?? null)
        : (row.programs?.code ?? null),
      programName: Array.isArray(row.programs)
        ? (row.programs[0]?.name ?? null)
        : (row.programs?.name ?? null),
      status:      row.approval_status,
      reviewNotes: row.review_notes,
      submittedByName: Array.isArray(row.profiles)
        ? (row.profiles[0]?.full_name ?? null)
        : (row.profiles?.full_name ?? null),
    })
  }

  // Sort by most recent submission first
  return items.sort((a, b) =>
    (b.submittedAt ?? '').localeCompare(a.submittedAt ?? ''),
  )
}

/**
 * Faculty: summary counts for their own submissions.
 */
export async function fetchFacultySubmissionSummary(
  client:   TypedClient,
  facultyId: string,
): Promise<FacultySubmissionSummary> {
  const { data, error } = await client
    .from('exams')
    .select('approval_status')
    .eq('submitted_by', facultyId) as {
      data:  Array<{ approval_status: ApprovalStatus }> | null
      error: unknown
    }

  if (error !== null) {
    throw toError(error)
  }

  const rows = data ?? []
  return {
    drafts:    rows.filter((r) => r.approval_status === 'draft').length,
    pending:   rows.filter((r) => r.approval_status === 'pending_review').length,
    approved:  rows.filter((r) => r.approval_status === 'approved').length,
    rejected:  rows.filter((r) => r.approval_status === 'rejected').length,
    published: rows.filter((r) => r.approval_status === 'published').length,
  }
}

/**
 * Fetch approval event history for a specific entity.
 */
export async function fetchApprovalHistory(
  client:     TypedClient,
  entityType: ApprovalEntityType,
  entityId:   string,
): Promise<ApprovalEvent[]> {
  const { data, error } = await client
    .from('approval_events')
    .select('*, profiles ( full_name )')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('created_at', { ascending: true }) as {
      data: Array<{
        id: string; entity_type: string; entity_id: string
        from_status: ApprovalStatus | null; to_status: ApprovalStatus
        actor_id: string; notes: string | null; created_at: string
        profiles: { full_name: string | null } | null
      }> | null
      error: unknown
    }

  if (error !== null) {
    throw toError(error)
  }

  return (data ?? []).map((row) => ({
    id:          row.id,
    entity_type: row.entity_type as ApprovalEntityType,
    entity_id:   row.entity_id,
    from_status: row.from_status,
    to_status:   row.to_status,
    actor_id:    row.actor_id,
    notes:       row.notes,
    created_at:  row.created_at,
    actorName:   Array.isArray(row.profiles)
      ? (row.profiles[0]?.full_name ?? null)
      : (row.profiles?.full_name ?? null),
  }))
}

/**
 * Fetch question banks for a faculty member.
 */
export async function fetchFacultyQuestionBanks(
  client:    TypedClient,
  facultyId: string,
): Promise<QuestionBank[]> {
  const { data, error } = await client
    .from('question_banks')
    .select(`
      *,
      programs ( code ),
      exams ( title )
    `)
    .eq('submitted_by', facultyId)
    .order('created_at', { ascending: false }) as {
      data: Array<Record<string, unknown>> | null
      error: unknown
    }

  if (error !== null) {
    throw toError(error)
  }

  return (data ?? []).map((row): QuestionBank => ({
    id:              String(row['id']),
    title:           String(row['title']),
    description:     row['description'] !== null ? String(row['description']) : null,
    program_id:      row['program_id']  !== null ? String(row['program_id'])  : null,
    exam_id:         row['exam_id']     !== null ? String(row['exam_id'])     : null,
    approval_status: row['approval_status'] as ApprovalStatus,
    submitted_by:    row['submitted_by']  !== null ? String(row['submitted_by'])  : null,
    submitted_at:    row['submitted_at']  !== null ? String(row['submitted_at'])  : null,
    approved_by:     row['approved_by']   !== null ? String(row['approved_by'])   : null,
    approved_at:     row['approved_at']   !== null ? String(row['approved_at'])   : null,
    review_notes:    row['review_notes']  !== null ? String(row['review_notes'])  : null,
    rejected_at:     row['rejected_at']   !== null ? String(row['rejected_at'])   : null,
    published_at:    row['published_at']  !== null ? String(row['published_at'])  : null,
    created_at:      String(row['created_at']),
    updated_at:      String(row['updated_at']),
    programCode:     (() => {
      const p = row['programs']
      if (!p || typeof p !== 'object') {
        return null
      }
      const arr = Array.isArray(p) ? p : [p]
      return arr[0]?.['code'] ? String(arr[0]['code']) : null
    })(),
    examTitle: (() => {
      const e = row['exams']
      if (!e || typeof e !== 'object') {
        return null
      }
      const arr = Array.isArray(e) ? e : [e]
      return arr[0]?.['title'] ? String(arr[0]['title']) : null
    })(),
  }))
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function entityTypeToTable(type: ApprovalEntityType): ApprovalTableName {
  switch (type) {
    case 'exam':          return 'exams'
    case 'question':      return 'questions'
    case 'question_bank': return 'question_banks'
    default:              return assertNever(type)
  }
}

function validateTransition(from: ApprovalStatus, to: ApprovalStatus): void {
  const allowed: Partial<Record<ApprovalStatus, ApprovalStatus[]>> = {
    pending_review: ['approved', 'rejected'],
    approved:       ['published', 'archived'],
    rejected:       [],          // faculty must resubmit
    published:      ['archived'],
    draft:          [],          // admin should not touch drafts directly
    archived:       [],
  }

  const valid = allowed[from]
  if (valid === undefined || !valid.includes(to)) {
    throw new Error(`Invalid transition: ${from} → ${to}`)
  }
}

async function logApprovalEvent(
  client: TypedClient,
  event: {
    entity_type: ApprovalEntityType
    entity_id:   string
    from_status: ApprovalStatus | null
    to_status:   ApprovalStatus
    actor_id:    string
    notes?:      string
  },
): Promise<void> {
  // Best-effort — don't throw if logging fails
  await client.from('approval_events').insert({
    entity_type:  event.entity_type,
    entity_id:    event.entity_id,
    from_status:  event.from_status ?? null,
    to_status:    event.to_status,
    actor_id:     event.actor_id,
    notes:        event.notes ?? null,
  } as never)
}
