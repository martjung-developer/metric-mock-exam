// lib/services/admin/exams/submissions/exam.service.ts
// ─────────────────────────────────────────────────────────────────────────────
// Supabase calls for exam metadata used in the submissions/grading flow.
// All `as any` and unsafe casts have been removed now that database.ts
// correctly types grading_mode, allowed_programs, and allowed_year_levels
// on the exams table.
// ─────────────────────────────────────────────────────────────────────────────

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database }       from '@/lib/types/database'
import type { GradingMode }    from '@/lib/types/database'
import type { ServiceResult }  from '@/lib/types/admin/exams/submissions/submission.types'
import type { ExamInfo }       from '@/lib/types/admin/exams/submissions/exam.types'
import type { TosAreaConfig }  from '@/lib/types/admin/exams/exam.types'
export { validateExamAccess } from '@/lib/services/admin/exams/submissions/submission.service'

type PublicSchema = Database['public']
type ExamsRow     = PublicSchema['Tables']['exams']['Row']
type ExamsUpdate  = PublicSchema['Tables']['exams']['Update']
type TosAreaRow   = Pick<PublicSchema['Tables']['exam_tos_areas']['Row'],
  'area_title' | 'weight_percent' | 'expected_items' | 'min_percent'>
type DB           = SupabaseClient<Database>

function ok<T>(data: T): ServiceResult<T>             { return { data, error: null } }
function err<T = void>(msg: string): ServiceResult<T> { return { data: null, error: msg } }

// ── getExamAccessConstraints ──────────────────────────────────────────────────
export async function getExamAccessConstraints(
  supabase: DB,
  examId:   string,
): Promise<ServiceResult<{ allowed_programs: string[] | null; allowed_year_levels: number[] | null }>> {
  const { data, error } = await supabase
    .from('exams')
    .select('allowed_programs,allowed_year_levels')
    .eq('id', examId)
    .single<Pick<ExamsRow, 'allowed_programs' | 'allowed_year_levels'>>()

  if (error || !data) {return err(error?.message ?? 'Exam not found')}

  const exam = data

  return ok({
    allowed_programs:    exam.allowed_programs    ?? null,
    allowed_year_levels: exam.allowed_year_levels ?? null,
  })
}

// ── getExamInfo ───────────────────────────────────────────────────────────────
// Fetches passing_score, total_points, and grading_mode.
// grading_mode is now correctly typed as GradingMode in database.ts,
// so no unsafe cast or `as typeof data & { grading_mode? }` is needed.

export async function getExamInfo(
  supabase: DB,
  examId:   string,
): Promise<ServiceResult<ExamInfo>> {
  const { data, error } = await supabase
    .from('exams')
    .select('passing_score,total_points,grading_mode,duration_minutes')
    .eq('id', examId)
    .single<Pick<ExamsRow, 'passing_score' | 'total_points' | 'grading_mode' | 'duration_minutes'>>()

  if (error || !data) {return err(error?.message ?? 'Exam not found')}

  const exam = data
  const mode: GradingMode = exam.grading_mode ?? 'auto'

  return ok<ExamInfo>({
    passing_score: exam.passing_score,
    total_points:  exam.total_points,
    grading_mode:  mode,
    duration_minutes: exam.duration_minutes ?? undefined,
  })
}

// ── updateGradingMode ─────────────────────────────────────────────────────────
// Uses the Database-derived Update type — no `as Record<string, unknown>` needed.

export async function updateGradingMode(
  supabase: DB,
  examId:   string,
  mode:     GradingMode,
): Promise<ServiceResult> {
  const { error } = await supabase
    .from('exams')
    .update({ grading_mode: mode } satisfies ExamsUpdate)
    .eq('id', examId)

  return error ? err(error.message) : ok(undefined)
}

export async function getTosAreas(
  supabase: DB,
  examId: string,
): Promise<ServiceResult<TosAreaConfig[]>> {
  const { data, error } = await supabase
    .from('exam_tos_areas')
    .select('area_title,weight_percent,expected_items,min_percent')
    .eq('exam_id', examId)
    .order('area_title', { ascending: true })
    .overrideTypes<TosAreaRow[], { merge: false }>()

  if (error) {return err(error.message)}

  return ok((data ?? []).map((area) => ({
    area_title: area.area_title,
    weight_percent: area.weight_percent,
    expected_items: area.expected_items,
    min_percent: area.min_percent,
  })))
}
