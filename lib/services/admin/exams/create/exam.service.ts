// lib/services/admin/exams/create/exam.service.ts
//
// FIXED: buildInsertPayload now writes `program_id` (the UUID FK column)
// instead of `program` (the legacy text column that the join ignores).
// ─────────────────────────────────────────────────────────────────────────────

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database }       from '@/lib/types/database'
import type { ExamFormData }   from '@/lib/types/admin/exams/create/exam.types'
import type { CategoryOption } from '@/lib/types/admin/exams/create/exam.types'

type DB = SupabaseClient<Database>

// Shape written to the DB — only the columns we set on insert
type ExamInsertPayload = {
  title:            string
  description:      string | null
  category_id:      string | null
  program_id:       string | null   // ← UUID FK, joins to programs table
  exam_type:        string
  duration_minutes: number
  total_points:     number
  passing_score:    number
  is_published:     boolean
  created_by:       string | null
}

// ── getCurrentUserId ──────────────────────────────────────────────────────────

export async function getCurrentUserId(supabase: DB): Promise<string | null> {
  const { data } = await supabase.auth.getUser()
  return data.user?.id ?? null
}

// ── fetchCategories ───────────────────────────────────────────────────────────

export async function fetchCategories(supabase: DB): Promise<CategoryOption[]> {
  const { data } = await supabase
    .from('exam_categories')
    .select('id, name, program_id')
    .order('name')

  return (data ?? []) as CategoryOption[]
}

export async function insertCategory(
  supabase:  DB,
  name:      string,
  programId: string,
): Promise<CategoryOption> {
  const trimmed = name.trim()
  const { data: existing, error: existingError } = await supabase
    .from('exam_categories')
    .select('id')
    .eq('name', trimmed)
    .eq('program_id', programId)
    .maybeSingle()

  if (existingError !== null) {
    throw new Error(existingError.message)
  }
  if (existing !== null) {
    throw new Error('A category with this name already exists for the selected program.')
  }

  const { data, error } = await supabase
    .from('exam_categories')
    .insert({
      name:       trimmed,
      program_id: programId,
    })
    .select('id, name, program_id')
    .single()

  if (error !== null || data === null) {
    throw new Error(error?.message ?? 'Failed to create category.')
  }

  return data as CategoryOption
}

// ── buildInsertPayload ────────────────────────────────────────────────────────
//
// CRITICAL FIX: previously wrote form.program (a text value like "BSPsych")
// to the `program` text column, leaving `program_id` null. The Supabase join
// `programs ( id, code, name )` keys off `program_id`, so the join always
// returned null and the table showed "—".
//
// Now we write form.program_id (a UUID) to `program_id` so the FK join works.

export function buildInsertPayload(
  form:   ExamFormData,
  userId: string | null,
): ExamInsertPayload {
  return {
    title:            form.title.trim(),
    description:      form.description.trim() || null,
    category_id:      form.category_id  || null,
    program_id:       form.program_id   || null,   // ← FIXED: was form.program → wrong column
    exam_type:        form.exam_type,
    duration_minutes: Number(form.duration_minutes),
    total_points:     Number(form.total_points),
    passing_score:    Number(form.passing_score),
    is_published:     form.is_published,
    created_by:       userId,
  }
}

// ── insertExam ────────────────────────────────────────────────────────────────

export async function insertExam(
  supabase: DB,
  payload:  ExamInsertPayload,
): Promise<string> {
  const { data, error } = await supabase
    .from('exams')
    .insert(payload)
    .select('id')
    .single()

  if (error !== null || data === null) {
    throw new Error(error?.message ?? 'Failed to create exam.')
  }

  return data.id
}
