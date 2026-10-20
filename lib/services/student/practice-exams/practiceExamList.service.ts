// lib/services/student/practice-exams/practiceExamList.service.ts

import { createClient } from '@/lib/supabase/client'

type CategoryShape = { id: string; name: string; icon: string | null; program_id: string | null }
type ProgramShape  = { id: string; code: string; name: string } | null

export type ExamStatus = 'available' | 'coming_soon'

export interface ReviewItem {
  id:         string
  title:      string
  shortCode:  string
  programCode?: string
  category:   string
  categoryProgramId: string | null
  program:    string
  status:     ExamStatus
  questions?: number
  duration?:  string
}

type ExamRaw = {
  id:               string
  title:            string
  duration_minutes: number
  is_published:     boolean
  exam_type:        string | null
  program_id:       string | null
  exam_categories:  CategoryShape | CategoryShape[] | null
  programs:         ProgramShape  | ProgramShape[]  | null
}

function unwrapCategory(raw: CategoryShape | CategoryShape[] | null): CategoryShape | null {
  if (!raw) {return null}
  return Array.isArray(raw) ? (raw[0] ?? null) : raw
}

function unwrapProgram(raw: ProgramShape | ProgramShape[] | null): ProgramShape {
  if (!raw) {return null}
  return Array.isArray(raw) ? (raw[0] ?? null) : raw
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) {return `${m} min`}
  if (m === 0) {return `${h} hr${h > 1 ? 's' : ''}`}
  return `${h} hr${h > 1 ? 's' : ''} ${m} min`
}

export async function fetchStudentProgramId(
  userId: string,
  signal: AbortSignal,
): Promise<string | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('students')
    .select('program_id')
    .eq('id', userId)
    .single()
    .abortSignal(signal)
  if (error !== null) {return null}
  return data?.program_id ?? null
}

export async function fetchReviewsForStudent(
  studentId: string,
  programId: string | null,
  signal:    AbortSignal,
): Promise<{ reviews: ReviewItem[]; error: string | null }> {
  const supabase = createClient()

  try {
    if (!programId) {
      return { reviews: [], error: 'No degree program is assigned to your student account.' }
    }

    const baseSelect = `
      id, title, duration_minutes, is_published, exam_type, program_id,
      exam_categories ( id, name, icon, program_id ),
      programs ( id, code, name )
    `

    const { data: programExamData, error: programExamErr } = await supabase
      .from('exams')
      .select(baseSelect)
      .eq('is_published', true)
      .eq('exam_type', 'practice')
      .eq('program_id', programId)
      .order('created_at', { ascending: false })
      .abortSignal(signal)

    if (programExamErr) { return { reviews: [], error: 'Could not load reviewers.' } }

    // ── CHANGED: no more cross-program fallback. If this program has zero
    // published reviewers, `exams` stays empty and the UI shows the normal
    // "No reviewers found" empty state — it must never show another
    // program's reviewers.
    const exams: ExamRaw[] = programExamData ?? []

    if (exams.length === 0) { return { reviews: [], error: null } }

    const examIds = exams.map(e => e.id)

    const { data: assignments, error: asnErr } = await supabase
      .from('exam_assignments')
      .select('exam_id')
      .eq('is_active', true)
      .in('exam_id', examIds)
      .or(`student_id.eq.${studentId},program_id.eq.${programId}`)
      .abortSignal(signal)

    if (asnErr) { return { reviews: [], error: 'Could not load assignments.' } }

    const assignedIds = new Set<string>(
      (assignments ?? [])
        .map((a: { exam_id: string | null }) => a.exam_id)
        .filter((id): id is string => id !== null),
    )

    const qCountMap: Record<string, number> = {}
    const { data: qRows } = await supabase
      .from('questions')
      .select('exam_id')
      .in('exam_id', examIds)
      .abortSignal(signal)

    ;(qRows ?? []).forEach((q: { exam_id: string | null }) => {
      if (q.exam_id) { qCountMap[q.exam_id] = (qCountMap[q.exam_id] ?? 0) + 1 }
    })

    const reviews: ReviewItem[] = exams.map(exam => {
      const cat  = unwrapCategory(exam.exam_categories)
      const prog = unwrapProgram(exam.programs)
      return {
        id:        exam.id,
        title:     exam.title,
        shortCode: prog?.code ?? (cat?.name?.match(/\b([A-Z])/g)?.join('') ?? 'EXAM'),
        programCode: prog?.code,
        category:  cat?.name ?? 'Uncategorized',
        categoryProgramId: cat?.program_id ?? null,
        program:   prog?.code ?? prog?.name ?? 'Unassigned Program',
        status:    assignedIds.has(exam.id) ? 'available' : 'coming_soon',
        questions: qCountMap[exam.id],
        duration:  formatDuration(exam.duration_minutes),
      }
    })

    return { reviews, error: null }
  } catch (err) {
    if ((err as Error).name === 'AbortError') { return { reviews: [], error: null } }
    return { reviews: [], error: 'Unexpected error loading reviews.' }
  }
}