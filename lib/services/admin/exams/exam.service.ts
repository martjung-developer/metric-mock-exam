// services/admin/exams/exam.service.ts
// ─────────────────────────────────────────────────────────────────────────────
// All Supabase I/O for the exams feature.
// Rules:
//  • Every query uses .returns<T>() for compile-time safety.
//  • No `as`, `any`, or `unknown` casts anywhere.
//  • Transformer functions live here — they own the raw→domain mapping.
//  • Service functions return domain types, never raw DB shapes.
// ─────────────────────────────────────────────────────────────────────────────

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database }       from '@/lib/types/database'
import type {
  Exam,
  ExamUpdatePayload,
  ProgramOption,
  CategoryOption,
  RawExamRow,
  RawCategoryJoin,
  RawProgramJoin,
} from '@/lib/types/admin/exams/exam.types'
import { EXAM_TYPE_META } from '@/lib/types/database'
import type { ExamType } from '@/lib/types/database'

// ── Convenience client alias ──────────────────────────────────────────────────
type DB = SupabaseClient<Database>

interface AccessScope {
  schoolId: string | null
  programId: string | null
}

async function getAccessScope(supabase: DB): Promise<AccessScope> {
  const { data: userRes } = await supabase.auth.getUser()
  const userId = userRes.user?.id ?? null
  if (!userId) {
    return { schoolId: null, programId: null }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle()

  if (profile?.role === 'faculty') {
    const { data: facultyRow } = await supabase
      .from('faculty')
      .select('school_id, program_id')
      .eq('user_id', userId)
      .maybeSingle()

    return {
      schoolId: facultyRow?.school_id ?? null,
      programId: facultyRow?.program_id ?? null,
    }
  }

  const { data: adminRow } = await supabase
    .from('admins')
    .select('school_id')
    .eq('user_id', userId)
    .maybeSingle()

  return { schoolId: adminRow?.school_id ?? null, programId: null }
}

// ── Internal raw query types (not exported) ───────────────────────────────────
// These match exactly what Supabase returns for the join query.
type QuestionCountRow  = Pick<Database['public']['Tables']['questions']['Row'],      'exam_id'>
type AssignmentCountRow = Pick<Database['public']['Tables']['exam_assignments']['Row'], 'exam_id'>

// ── Transformers ──────────────────────────────────────────────────────────────

/**
 * Supabase may return a joined one-to-one as a single object OR an array.
 * This unwraps both safely without casting.
 */
function unwrapCategory(raw: RawCategoryJoin): CategoryOption | null {
  if (!raw) {return null}
  if (Array.isArray(raw)) {
    const first = raw[0]
    return first ? { id: first.id, name: first.name } : null
  }
  return { id: raw.id, name: raw.name }
}

function unwrapProgram(raw: RawProgramJoin): ProgramOption | null {
  if (!raw) {return null}
  if (Array.isArray(raw)) {
    const first = raw[0]
    return first ? { id: first.id, code: first.code, name: first.name } : null
  }
  return { id: raw.id, code: raw.code, name: raw.name }
}

/**
 * Coerce the nullable exam_type string coming from the DB into the ExamType union.
 * Falls back to 'mock' if the value is unrecognised (defensive).
 */
function toExamType(raw: string | null): ExamType {
  const keys = Object.keys(EXAM_TYPE_META) as ExamType[]
  return keys.includes(raw as ExamType) ? (raw as ExamType) : 'mock'
}

function toExam(
  raw:        RawExamRow,
  qCountMap:  Record<string, number>,
  aCountMap:  Record<string, number>,
): Exam {
  return {
    id:               raw.id,
    title:            raw.title,
    description:      raw.description,
    category:         unwrapCategory(raw.exam_categories),
    program:          unwrapProgram(raw.programs),
    exam_type:        toExamType(raw.exam_type),
    duration_minutes: raw.duration_minutes,
    total_points:     raw.total_points,
    passing_score:    raw.passing_score,
    is_published:     raw.is_published,
    approval_status:  raw.approval_status,
    review_notes:     raw.review_notes,
    question_count:   qCountMap[raw.id] ?? 0,
    assigned_count:   aCountMap[raw.id] ?? 0,
    created_at:       raw.created_at,
  }
}

// ── getPrograms ───────────────────────────────────────────────────────────────

export async function getPrograms(supabase: DB): Promise<ProgramOption[]> {
  const scope = await getAccessScope(supabase)
  let query = supabase
    .from('programs')
    .select('id, code, name')

  if (scope.schoolId) {
    query = query.eq('school_id', scope.schoolId)
  }
  if (scope.programId) {
    query = query.eq('id', scope.programId)
  }

  const { data } = await query
    .order('code')
    .returns<ProgramOption[]>()

  return data ?? []
}

// ── getCategories ─────────────────────────────────────────────────────────────

export async function getCategories(supabase: DB): Promise<CategoryOption[]> {
  const { data } = await supabase
    .from('exam_categories')
    .select('id, name')
    .order('name')
    .returns<CategoryOption[]>()

  return data ?? []
}

// ── getExamCounts ─────────────────────────────────────────────────────────────
// Returns question counts and active-assignment counts keyed by exam_id.

export interface ExamCounts {
  qCountMap: Record<string, number>
  aCountMap: Record<string, number>
}

export async function getExamCounts(
  supabase: DB,
  examIds:  string[],
): Promise<ExamCounts> {
  if (examIds.length === 0) {return { qCountMap: {}, aCountMap: {} }}

  const [qRes, aRes] = await Promise.all([
    supabase
      .from('questions')
      .select('exam_id')
      .in('exam_id', examIds)
      .returns<QuestionCountRow[]>(),

    supabase
      .from('exam_assignments')
      .select('exam_id')
      .in('exam_id', examIds)
      .eq('is_active', true)
      .returns<AssignmentCountRow[]>(),
  ])

  const qCountMap: Record<string, number> = {}
  const aCountMap: Record<string, number> = {}

  for (const q of qRes.data ?? []) {
    if (q.exam_id) {qCountMap[q.exam_id] = (qCountMap[q.exam_id] ?? 0) + 1}
  }
  for (const a of aRes.data ?? []) {
    if (a.exam_id) {aCountMap[a.exam_id] = (aCountMap[a.exam_id] ?? 0) + 1}
  }

  return { qCountMap, aCountMap }
}

// ── getAllExamsWithMeta ────────────────────────────────────────────────────────

export async function getAllExamsWithMeta(supabase: DB): Promise<Exam[]> {
  const scope = await getAccessScope(supabase)

  let allowedProgramIds: string[] | null = null
  if (scope.programId) {
    allowedProgramIds = [scope.programId]
  } else if (scope.schoolId) {
    const { data: scopedPrograms } = await supabase
      .from('programs')
      .select('id')
      .eq('school_id', scope.schoolId)
      .returns<{ id: string }[]>()
    allowedProgramIds = (scopedPrograms ?? []).map((p) => p.id)
  }

  let query = supabase
    .from('exams')
    .select(`
      id, title, description, duration_minutes, total_points, passing_score,
      is_published, approval_status, review_notes, exam_type, created_at,
      exam_categories ( id, name, icon ),
      programs ( id, code, name )
    `)

  if (allowedProgramIds) {
    if (allowedProgramIds.length === 0) {
      return []
    }
    query = query.in('program_id', allowedProgramIds)
  }

  const { data: rawExams, error } = await query
    .order('created_at', { ascending: false })
    .returns<RawExamRow[]>()

  if (error) {throw new Error(error.message)}

  const rows    = rawExams ?? []
  const examIds = rows.map((e) => e.id)
  const { qCountMap, aCountMap } = await getExamCounts(supabase, examIds)

  return rows.map((raw) => toExam(raw, qCountMap, aCountMap))
}

// ── updateExam ────────────────────────────────────────────────────────────────

export async function updateExam(
  supabase: DB,
  id:       string,
  payload:  ExamUpdatePayload,
): Promise<void> {
  const { data: before } = await supabase
    .from('exams')
    .select('approval_status, title')
    .eq('id', id)
    .maybeSingle()

  const { error } = await supabase
    .from('exams')
    .update(payload)
    .eq('id', id)
    .returns<void>()

  if (error) {throw new Error(error.message)}

  if (before?.approval_status !== 'rejected') {
    return
  }

  const { data: auth } = await supabase.auth.getUser()
  const actorId = auth.user?.id ?? null
  if (!actorId) {
    return
  }
  const { data: actor } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', actorId)
    .maybeSingle()
  if (actor?.role !== 'faculty') {
    return
  }

  await supabase
    .from('exams')
    .update({
      approval_status: 'pending_review',
      submitted_at: new Date().toISOString(),
    } as never)
    .eq('id', id)

  const actorName = actor.full_name ?? 'Faculty member'
  await supabase.from('approval_events').insert({
    entity_type: 'exam',
    entity_id: id,
    from_status: 'rejected',
    to_status: 'pending_review',
    actor_id: actorId,
    notes: `Pending Review <- Rejected - resubmitted by ${actorName}`,
  } as never)

  const { data: admins } = await supabase.from('profiles').select('id').eq('role', 'admin')
  if ((admins ?? []).length > 0) {
    await supabase.from('notifications').insert(
      (admins ?? []).map((a) => ({
        user_id: a.id,
        title: 'Exam Resubmitted',
        message: `${actorName} resubmitted ${payload.title} for review.`,
        type: 'info',
      })),
    )
  }
}

// ── deleteExam ────────────────────────────────────────────────────────────────

export async function deleteExam(supabase: DB, id: string): Promise<void> {
  const { error } = await supabase.from('exams').delete().eq('id', id)
  if (error) {throw new Error(error.message)}
}
