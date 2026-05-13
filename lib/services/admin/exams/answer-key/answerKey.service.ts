// lib/services/admin/exams/answer-key/answerKey.service.ts
// ─────────────────────────────────────────────────────────────────────────────
// CHANGES FROM PREVIOUS VERSION:
//   + fetchAnswerKeyEntries selects `scenario` column
//   + mapRowToEntry populates entry.scenario
// ─────────────────────────────────────────────────────────────────────────────

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database }       from '@/lib/types/database'
import type { QuestionType }   from '@/lib/types/database'
import type { Json }           from '@/lib/types/database'
import { parseOptions }        from '@/lib/utils/admin/answer-key/parseOptions'
import type {
  AnswerKeyEntry,
  ExamMeta,
  QuestionRaw,
  SavePayload,
  ServiceResult,
} from '@/lib/types/admin/exams/answer-key/answerKey.types'

type DB = SupabaseClient<Database>

function ok<T>(data: T): ServiceResult<T>           { return { data, error: null }  }
function err<T = void>(msg: string): ServiceResult<T> { return { data: null, error: msg } }

const VALID_QUESTION_TYPES = new Set<string>([
  'multiple_choice', 'true_false', 'short_answer', 'essay', 'matching', 'fill_blank',
])

function isQuestionType(v: string): v is QuestionType {
  return VALID_QUESTION_TYPES.has(v)
}

function mapRowToEntry(row: QuestionRaw): AnswerKeyEntry | null {
  if (!isQuestionType(row.question_type)) { return null }

  return {
    question_id:           row.id,
    question_text:         row.question_text,
    question_type:         row.question_type,
    points:                row.points,
    order_number:          row.order_number,
    options:               parseOptions(row.options as Json | null),
    correct_answer:        row.correct_answer,
    override:              null,
    explanation:           row.explanation,
    scenario:              row.scenario,          
    originalCorrectAnswer: row.correct_answer,
    originalExplanation:   row.explanation,
  }
}

export async function fetchExamMeta(
  supabase: DB,
  examId:   string,
): Promise<ServiceResult<ExamMeta>> {
  const { data, error } = await supabase
    .from('exams')
    .select('title, total_points, exam_type')
    .eq('id', examId)
    .single()
    .overrideTypes<Pick<Database['public']['Tables']['exams']['Row'], 'title' | 'total_points' | 'exam_type'>, { merge: false }>()

  if (error !== null || data === null) {
    return err(error?.message ?? 'Exam not found')
  }

  return ok<ExamMeta>({
    title:        data.title,
    total_points: data.total_points,
    exam_type:    data.exam_type ?? 'mock',
  })
}

export async function fetchAnswerKeyEntries(
  supabase: DB,
  examId:   string,
): Promise<ServiceResult<AnswerKeyEntry[]>> {
  const { data, error } = await supabase
    .from('questions')
    .select(
      // NEW: scenario added to selection
      'id, question_text, question_type, points, order_number, options, correct_answer, explanation, scenario',
    )
    .eq('exam_id', examId)
    .order('order_number', { ascending: true, nullsFirst: false })

  if (error !== null) { return err(error.message) }

  const rows    = (data ?? []) as QuestionRaw[]
  const entries = rows
    .map(mapRowToEntry)
    .filter((e): e is AnswerKeyEntry => e !== null)

  return ok(entries)
}

export async function saveAnswerKeyEntries(
  supabase:  DB,
  payloads:  SavePayload[],
): Promise<ServiceResult<{ failedCount: number }>> {
  if (!payloads.length) { return ok({ failedCount: 0 }) }

  const results = await Promise.all(
    payloads.map((p) => {
      const patch: Database['public']['Tables']['questions']['Update'] = {
        correct_answer: p.correct_answer,
        explanation:    p.explanation,
      }

      return supabase
        .from('questions')
        .update(patch)
        .eq('id', p.question_id)
    }),
  )

  const failedCount = results.filter((r) => r.error !== null).length
  if (failedCount > 0) {
    return err(`${failedCount} question(s) failed to save.`)
  }

  return ok({ failedCount: 0 })
}
