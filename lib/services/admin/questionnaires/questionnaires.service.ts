// lib/services/admin/questionnaires/questionnaires.service.ts
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, QuestionType, QuestionOption } from '@/lib/types/database'
import type {
  DisplayQuestion,
  ProgramOption,
  ExamOption,
  QuestionInsertPayload,
} from '@/lib/types/admin/questionnaires/questionnaires'
import type { ServiceResult } from '@/lib/types/admin/exams/questions/questions.types'
import { normalizeQuestionText, parseDifficulty } from '@/lib/utils/admin/questionnaires/questionnaires.utils'
 
type TypedClient = SupabaseClient<Database>
 
// ── CHANGED: programId -> programIds (a faculty member can hold >1 program,
// see faculty_programs join table). null = unrestricted (admin).
// [] = restricted but resolved to zero programs (should short-circuit to empty).
interface Scope {
  schoolId:   string | null
  programIds: string[] | null
}
 
function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message
  }
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const candidate = (error as { message?: unknown }).message
    if (typeof candidate === 'string' && candidate.length > 0) {
      return candidate
    }
  }
  return 'Unknown error'
}
 
async function getScope(client: TypedClient): Promise<Scope> {
  const { data: userRes } = await client.auth.getUser()
  const userId = userRes.user?.id ?? null
  if (!userId) {
    return { schoolId: null, programIds: null }
  }
 
  const { data: profile } = await client
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle()
 
  if (profile?.role === 'faculty') {
    // faculty.id (uuid) is what faculty_programs.faculty_id references —
    // NOT faculty.user_id. Resolve the faculty row first.
    const { data: facultyRow } = await client
      .from('faculty')
      .select('id, school_id')
      .eq('user_id', userId)
      .maybeSingle()
 
    if (!facultyRow) {
      return { schoolId: null, programIds: [] }
    }
 
    // ── CHANGED: read ALL programs from the join table instead of a single
    // faculty.program_id column. This is the actual fix — a faculty member
    // like Jean Erezo (BSEd-FIL + BEEd) can have multiple rows here.
    const { data: programLinks, error: programLinksError } = await client
      .from('faculty_programs')
      .select('program_id')
      .eq('faculty_id', facultyRow.id) as {
        data: Array<{ program_id: string }> | null
        error: unknown
      }
 
    if (programLinksError !== null) {
      throw new Error(getErrorMessage(programLinksError))
    }
 
    return {
      schoolId:   facultyRow.school_id,
      programIds: (programLinks ?? []).map((row) => row.program_id),
    }
  }
 
  const { data: adminRow } = await client
    .from('admins')
    .select('school_id')
    .eq('user_id', userId)
    .maybeSingle()
 
  return { schoolId: adminRow?.school_id ?? null, programIds: null }
}
 
async function getCurrentUserId(client: TypedClient): Promise<string | null> {
  const { data } = await client.auth.getUser()
  return data.user?.id ?? null
}
 
// Supabase currently infers mutation payloads as `never` in this workspace.
// Keep runtime payloads unchanged while satisfying the generated typings.
function asMutationPayload<T>(payload: T): never {
  return payload as unknown as never
}
 
// ── Safe option unwrap ────────────────────────────────────────────────────────
 
function toOptions(raw: unknown): QuestionOption[] | null {
  if (!Array.isArray(raw)) { return null }
  const filtered = raw.filter(
    (item): item is QuestionOption =>
      typeof item === 'object' &&
      item !== null &&
      'label' in item &&
      'text'  in item &&
      typeof (item as Record<string, unknown>)['label'] === 'string' &&
      typeof (item as Record<string, unknown>)['text']  === 'string',
  )
  return filtered.length > 0 ? filtered : null
}
 
// ── Programs ──────────────────────────────────────────────────────────────────
 
export async function fetchPrograms(client: TypedClient): Promise<ProgramOption[]> {
  const scope = await getScope(client)
  let query = client
    .from('programs')
    .select('id, code, name')
 
  if (scope.schoolId) {
    query = query.eq('school_id', scope.schoolId)
  }
  // ── CHANGED: .eq(programId) -> .in(programIds), with an explicit
  // short-circuit when a scoped faculty member resolves to zero programs.
  if (scope.programIds !== null) {
    if (scope.programIds.length === 0) {
      return []
    }
    query = query.in('id', scope.programIds)
  }
 
  const { data, error } = await query
    .order('code') as {
      data:  Array<{ id: string; code: string; name: string }> | null
      error: unknown
    }
 
  if (error !== null) {
    throw new Error(getErrorMessage(error))
  }
  return (data ?? []).map((p) => ({ id: p.id, code: p.code, name: p.name }))
}
 
// ── Exams ─────────────────────────────────────────────────────────────────────
 
export async function fetchExams(client: TypedClient): Promise<ExamOption[]> {
  const scope = await getScope(client)
 
  let allowedProgramIds: string[] | null = null
  // ── CHANGED: multi-program faculty pass their full programIds list through
  // directly instead of wrapping a single id in an array.
  if (scope.programIds !== null) {
    allowedProgramIds = scope.programIds
  } else if (scope.schoolId) {
    const { data: scopedPrograms } = await client
      .from('programs')
      .select('id')
      .eq('school_id', scope.schoolId) as {
        data: Array<{ id: string }> | null
        error: unknown
      }
    allowedProgramIds = (scopedPrograms ?? []).map((p) => p.id)
  }
 
  let query = client
    .from('exams')
    .select('id, title, program_id, category_id')
 
  if (allowedProgramIds) {
    if (allowedProgramIds.length === 0) {
      return []
    }
    query = query.in('program_id', allowedProgramIds)
  }
 
  const { data, error } = await query
    .order('title') as {
      data: Array<{
        id: string; title: string
        program_id: string | null; category_id: string | null
      }> | null
      error: unknown
    }
 
  if (error !== null) {
    throw new Error(getErrorMessage(error))
  }
  return (data ?? []).map((e) => ({
    id:          e.id,
    title:       e.title,
    program_id:  e.program_id,
    category_id: e.category_id,
  }))
}
 
// ── Questions ─────────────────────────────────────────────────────────────────
 
interface RawQuestionRow {
  id:             string
  question_text:  string
  question_type:  string
  points:         number
  options:        unknown
  correct_answer: string | null
  explanation:    string | null
  scenario:       string | null   
  image_url:      string | null
  section_title:  string | null
  section_number: number | null
  order_number:   number | null
  exam_id:        string | null
  created_by:     string | null
  last_modified_by: string | null
  last_modified_at: string | null
  created_at:     string
  approval_status: string
  submitted_by: string | null
  submitted_at: string | null
  approved_by: string | null
  approved_at: string | null
  review_notes: string | null
  question_bank_id: string | null
  profiles: { full_name: string | null } | { full_name: string | null }[] | null
  question_banks: { program_id: string | null } | { program_id: string | null }[] | null
  exams: {
    title:           string
    program_id:      string | null
    exam_categories: { name: string } | null
  } | null
}
 
export async function fetchQuestions(client: TypedClient): Promise<DisplayQuestion[]> {
  const scope = await getScope(client)
 
  let allowedProgramIds: string[] | null = null
  // ── CHANGED: same as fetchExams — use the full multi-program list.
  if (scope.programIds !== null) {
    allowedProgramIds = scope.programIds
  } else if (scope.schoolId) {
    const { data: scopedPrograms } = await client
      .from('programs')
      .select('id')
      .eq('school_id', scope.schoolId) as {
        data: Array<{ id: string }> | null
        error: unknown
      }
    allowedProgramIds = (scopedPrograms ?? []).map((p) => p.id)
  }
 
  const query = client
    .from('questions')
    .select(`
      id, question_text, question_type, points, options,
      correct_answer, explanation, scenario, image_url, section_title, section_number, order_number,
      exam_id, created_by, created_at,
      approval_status, submitted_by, submitted_at, approved_by, approved_at, review_notes,
      question_bank_id, last_modified_by, last_modified_at,
      profiles!questions_last_modified_by_fkey ( full_name ),
      question_banks ( program_id ),
      exams ( title, program_id, exam_categories ( name ) )
    `)
 
  if (allowedProgramIds && allowedProgramIds.length === 0) {
    return []
  }
 
  const { data, error } = await query
    .order('order_number', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false }) as {
      data:  RawQuestionRow[] | null
      error: unknown
    }
 
  if (error !== null) {
    throw new Error(getErrorMessage(error))
  }
 
  const mapped = (data ?? []).map((row): DisplayQuestion => {
    const exam = Array.isArray(row.exams) ? row.exams[0] : row.exams
    const cat  = exam && !Array.isArray(exam.exam_categories)
      ? exam.exam_categories
      : null
    const modifier = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
    const bank = Array.isArray(row.question_banks) ? row.question_banks[0] : row.question_banks
    const programId = exam?.program_id ?? bank?.program_id ?? null
 
    return {
      id:             row.id,
      question_text:  row.question_text,
      question_type:  row.question_type as QuestionType,
      points:         row.points,
      options:        toOptions(row.options),
      correct_answer: row.correct_answer,
      explanation:    row.explanation,
      scenario:       row.scenario,       
      image_url:      row.image_url,
      section_title:  row.section_title,
      section_number: row.section_number,
      order_number:   row.order_number,
      exam_id:        row.exam_id,
      created_by:     row.created_by,
      created_at:     row.created_at,
      last_modified_by: row.last_modified_by,
      last_modified_at: row.last_modified_at,
      lastModifiedByName: modifier?.full_name ?? null,
      categoryName:   cat?.name      ?? 'Uncategorized',
      examTitle:      exam?.title     ?? null,
      examProgramId:  programId,
      difficulty:     parseDifficulty(row.explanation),
      approval_status: row.approval_status as DisplayQuestion['approval_status'],
      submitted_by: row.submitted_by,
      submitted_at: row.submitted_at,
      approved_by: row.approved_by,
      approved_at: row.approved_at,
      review_notes: row.review_notes,
      question_bank_id: row.question_bank_id,
    }
  })
 
  if (!allowedProgramIds) {
    return mapped
  }
 
  return mapped.filter((q) => q.examProgramId !== null && allowedProgramIds.includes(q.examProgramId))
}
 
// ── Insert / Update / Delete ──────────────────────────────────────────────────
// (unchanged below this point — insertQuestion, updateQuestion, deleteQuestion,
// bulkInsertQuestions do not read `scope` and are unaffected by this fix)
 
export async function insertQuestion(
  client:  TypedClient,
  payload: QuestionInsertPayload,
): Promise<void> {
  const userId = await getCurrentUserId(client)
  const now = new Date().toISOString()
  const insertPayload = {
    ...payload,
    created_by: payload.created_by ?? userId,
    last_modified_by: userId,
    last_modified_at: now,
  }
  const { error } = await client
    .from('questions')
    .insert(asMutationPayload([insertPayload]))
 
  if (error !== null) {
    throw new Error(getErrorMessage(error))
  }
  if (payload.question_bank_id) {
    await client
      .from('question_banks')
      .update(asMutationPayload({ last_modified_by: userId, last_modified_at: now, updated_at: now }))
      .eq('id', payload.question_bank_id)
  }
}
 
export async function updateQuestion(
  client:  TypedClient,
  id:      string,
  payload: QuestionInsertPayload,
): Promise<void> {
  const userId = await getCurrentUserId(client)
  const now = new Date().toISOString()
  const updatePayload = {
    ...payload,
    last_modified_by: userId,
    last_modified_at: now,
  }
  const { error } = await client
    .from('questions')
    .update(asMutationPayload(updatePayload as Record<string, unknown>))
    .eq('id', id)
 
  if (error !== null) {
    throw new Error(getErrorMessage(error))
  }
  if (payload.question_bank_id) {
    await client
      .from('question_banks')
      .update(asMutationPayload({ last_modified_by: userId, last_modified_at: now, updated_at: now }))
      .eq('id', payload.question_bank_id)
  }
}

export async function updateQuestionImageUrl(
  client:   TypedClient,
  id:       string,
  imageUrl: string,
): Promise<void> {
  const trimmedImageUrl = imageUrl.trim()

  if (typeof window !== 'undefined') {
    const res = await fetch(`/api/admin/questionnaires/questions/${encodeURIComponent(id)}/image`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ imageUrl: trimmedImageUrl }),
    })
    const body = (await res.json().catch(() => null)) as {
      error?: string
      question?: { id: string; image_url: string | null }
    } | null

    if (!res.ok) {
      throw new Error(body?.error ?? 'Image URL update failed.')
    }
    if (!body?.question) {
      throw new Error('Image URL update returned no confirmation row.')
    }
    if (body.question.image_url !== trimmedImageUrl) {
      throw new Error(`Image URL update completed but the saved value did not match the uploaded image. Saved: ${body.question.image_url ?? 'null'} Uploaded: ${trimmedImageUrl}`)
    }
    return
  }

  const userId = await getCurrentUserId(client)
  const now = new Date().toISOString()

  const payload = {
    image_url: trimmedImageUrl,
    last_modified_by: userId,
    last_modified_at: now,
  }

  const { error } = await client
    .from('questions')
    .update(asMutationPayload(payload))
    .eq('id', id)

  if (error !== null) {
    throw new Error(getErrorMessage(error))
  }

  const { data, error: verifyError } = await client
    .from('questions')
    .select('id,image_url')
    .eq('id', id)
    .maybeSingle() as {
      data: { id: string; image_url: string | null } | null
      error: unknown
    }

  if (verifyError !== null) {
    throw new Error(getErrorMessage(verifyError))
  }
  if (data === null) {
    throw new Error('Image URL update did not match a question row.')
  }
  if (data.image_url !== trimmedImageUrl) {
    throw new Error(`Image URL update completed but the saved value did not match the uploaded image. Saved: ${data.image_url ?? 'null'} Uploaded: ${trimmedImageUrl}`)
  }
}
 
export async function deleteQuestion(
  client: TypedClient,
  id:     string,
): Promise<void> {
  const userId = await getCurrentUserId(client)
  const now = new Date().toISOString()
  const { data: question } = await client
    .from('questions')
    .select('question_bank_id')
    .eq('id', id)
    .maybeSingle()
 
  const { error } = await client
    .from('questions')
    .delete()
    .eq('id', id)
 
  if (error !== null) { throw new Error(error.message) }
  if (question?.question_bank_id) {
    await client
      .from('question_banks')
      .update(asMutationPayload({ last_modified_by: userId, last_modified_at: now, updated_at: now }))
      .eq('id', question.question_bank_id)
  }
}

export async function deleteQuestions(
  client: TypedClient,
  questions: Array<{ id: string; exam_id: string | null; question_bank_id: string | null }>,
): Promise<ServiceResult<void>> {
  const scopedIds = new Map<string, { ownerId: string; ownerType: 'bank' | 'exam'; ids: string[] }>()

  for (const question of questions) {
    const ownerType = question.question_bank_id ? 'bank' : question.exam_id ? 'exam' : null
    const ownerId = question.question_bank_id ?? question.exam_id
    if (!ownerType || !ownerId) {
      return { data: null, error: `Question ${question.id} has no exam or question-bank scope.` }
    }

    const key = `${ownerType}:${ownerId}`
    const group = scopedIds.get(key)
    if (group) {
      group.ids.push(question.id)
    } else {
      scopedIds.set(key, { ownerId, ownerType, ids: [question.id] })
    }
  }

  for (const group of scopedIds.values()) {
    let query = client.from('questions').delete().in('id', group.ids)
    query = group.ownerType === 'bank'
      ? query.eq('question_bank_id', group.ownerId)
      : query.eq('exam_id', group.ownerId).is('question_bank_id', null)

    const { error } = await query
    if (error !== null) {
      return { data: null, error: getErrorMessage(error) }
    }
  }

  return { data: null, error: null }
}
 
export async function bulkInsertQuestions(
  client:   TypedClient,
  payloads: QuestionInsertPayload[],
): Promise<{ inserted: number; skippedDuplicates: number }> {
  if (payloads.length === 0) {
    return { inserted: 0, skippedDuplicates: 0 }
  }
 
  const normalized = payloads
    .map((p) => ({ ...p, question_text: p.question_text.trim() }))
    .filter((p) => p.question_text.length > 0)
 
  if (normalized.length === 0) {
    return { inserted: 0, skippedDuplicates: 0 }
  }
 
  const userId = await getCurrentUserId(client)
  const now = new Date().toISOString()
 
  const bankId = normalized[0].question_bank_id ?? null
  const examId = normalized[0].exam_id ?? null
 
  let existingQuery = client
    .from('questions')
    .select('question_text, order_number')
 
  if (bankId) {
    existingQuery = existingQuery.eq('question_bank_id', bankId)
  } else if (examId) {
    existingQuery = existingQuery.eq('exam_id', examId)
  }
 
  const { data: existingRows, error: existingError } = await existingQuery as {
    data: Array<{ question_text: string; order_number: number | null }> | null
    error: unknown
  }
 
  if (existingError !== null) {
    throw new Error(getErrorMessage(existingError))
  }
 
  const existingTexts = new Set((existingRows ?? []).map((r) => r.question_text))
 
  let nextOrder = (existingRows ?? []).reduce(
    (max, r) => (typeof r.order_number === 'number' && r.order_number > max ? r.order_number : max),
    0,
  ) + 1
 
  const seenInBatch = new Set<string>()
  const toInsert: Array<QuestionInsertPayload & {
    created_by: string | null
    last_modified_by: string | null
    last_modified_at: string
    order_number: number
  }> = []
  let skippedDuplicates = 0
 
  for (const payload of normalized) {
    if (existingTexts.has(payload.question_text) || seenInBatch.has(payload.question_text)) {
      skippedDuplicates += 1
      continue
    }
    seenInBatch.add(payload.question_text)
    toInsert.push({
      ...payload,
      created_by: payload.created_by ?? userId,
      last_modified_by: userId,
      last_modified_at: now,
      order_number: nextOrder,
    })
    nextOrder += 1
  }
 
  if (toInsert.length === 0) {
    return { inserted: 0, skippedDuplicates }
  }
 
  const { error } = await client
    .from('questions')
    .insert(asMutationPayload(toInsert))
 
  if (error !== null) {
    throw new Error(getErrorMessage(error))
  }
 
  const touchedBankIds = new Set(
    toInsert
      .map((p) => p.question_bank_id)
      .filter((id): id is string => Boolean(id)),
  )
  for (const id of touchedBankIds) {
    await client
      .from('question_banks')
      .update(asMutationPayload({ last_modified_by: userId, last_modified_at: now, updated_at: now }))
      .eq('id', id)
  }
 
  return { inserted: toInsert.length, skippedDuplicates }
}

export async function importQuestionsWithoutDuplicates(
  client: TypedClient,
  payloads: QuestionInsertPayload[],
): Promise<{ inserted: number; skippedDuplicates: number; imageCorrections: number }> {
  const normalizedPayloads = payloads
    .map((payload) => ({ ...payload, question_text: payload.question_text.trim() }))
    .filter((payload) => payload.question_text.length > 0)
  if (normalizedPayloads.length === 0) {
    return { inserted: 0, skippedDuplicates: 0, imageCorrections: 0 }
  }

  const examIds = new Set(normalizedPayloads.map((payload) => payload.exam_id).filter((id): id is string => Boolean(id)))
  if (examIds.size !== 1 || normalizedPayloads.some((payload) => !payload.exam_id)) {
    throw new Error('Imported questions must all belong to one exam.')
  }
  const examId = [...examIds][0]
  if (!examId) {
    throw new Error('An exam is required to import questions.')
  }

  const { data: existingRows, error: existingError } = await client
    .from('questions')
    .select('id, question_text, image_url, order_number')
    .eq('exam_id', examId)
  if (existingError !== null) {
    throw new Error(getErrorMessage(existingError))
  }

  const existingByText = new Map<string, Array<{ id: string; question_text: string; image_url: string | null; order_number: number | null }>>()
  for (const row of existingRows ?? []) {
    const key = normalizeQuestionText(row.question_text)
    const matches = existingByText.get(key) ?? []
    matches.push(row)
    existingByText.set(key, matches)
  }

  const userId = await getCurrentUserId(client)
  const now = new Date().toISOString()
  let nextOrder = (existingRows ?? []).reduce(
    (max, row) => typeof row.order_number === 'number' ? Math.max(max, row.order_number) : max,
    0,
  ) + 1
  let skippedDuplicates = 0
  let imageCorrections = 0
  const seenBatch = new Map<string, number>()
  const toInsert: Array<QuestionInsertPayload & {
    created_by: string | null
    last_modified_by: string | null
    last_modified_at: string
    order_number: number
  }> = []

  for (const payload of normalizedPayloads) {
    const key = normalizeQuestionText(payload.question_text)
    const existing = existingByText.get(key)
    if (existing && existing.length > 0) {
      skippedDuplicates += 1
      const candidate = existing.find((row) => !row.image_url?.trim())
      if (candidate && payload.image_url?.trim()) {
        const { data: updatedRows, error: updateError } = await client
          .from('questions')
          .update({ image_url: payload.image_url.trim() })
          .eq('id', candidate.id)
          .or('image_url.is.null,image_url.eq.')
          .select('id')
        if (updateError !== null) {
          throw new Error(getErrorMessage(updateError))
        }
        if ((updatedRows ?? []).length > 0) {
          candidate.image_url = payload.image_url.trim()
          imageCorrections += 1
        }
      }
      continue
    }

    const batchIndex = seenBatch.get(key)
    if (batchIndex !== undefined) {
      skippedDuplicates += 1
      if (!toInsert[batchIndex]?.image_url && payload.image_url?.trim()) {
        const batchQuestion = toInsert[batchIndex]
        if (batchQuestion) {
          batchQuestion.image_url = payload.image_url.trim()
        }
      }
      continue
    }

    seenBatch.set(key, toInsert.length)
    toInsert.push({
      ...payload,
      created_by: payload.created_by ?? userId,
      last_modified_by: userId,
      last_modified_at: now,
      order_number: nextOrder,
    })
    nextOrder += 1
  }

  if (toInsert.length > 0) {
    const { error: insertError } = await client
      .from('questions')
      .insert(asMutationPayload(toInsert))
    if (insertError !== null) {
      throw new Error(getErrorMessage(insertError))
    }
  }

  return { inserted: toInsert.length, skippedDuplicates, imageCorrections }
}
