// lib/services/student/study-materials/studyMaterials.service.ts
// ─────────────────────────────────────────────────────────────────────────────
// All Supabase I/O for the student study materials feature.
// Rules:
//  • .returns<T>() on every query — no `as`, `any`, or `unknown`.
//  • View-first with fallback to direct join (preserves original behaviour).
//  • Filters: program_id matches student OR program_id IS NULL (global).
//  • Returns domain types, never raw DB shapes.
// ─────────────────────────────────────────────────────────────────────────────

import type { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js'
import type { Database, ViewRow }               from '@/lib/types/database'
import type { StudyMaterial }                   from '@/lib/types/student/study-materials/study-materials'

type FavoriteRow = {
  Row: {
    user_id: string
    material_id: string
  }
  Insert: {
    user_id: string
    material_id: string
  }
  Update: {
    user_id?: string
    material_id?: string
  }
  Relationships: []
}

type AppDatabase = Database & {
  public: Database['public'] & {
    Tables: Database['public']['Tables'] & {
      favorites: FavoriteRow
    }
  }
}

type DB = SupabaseClient<AppDatabase>

// ── Raw fallback join shape ───────────────────────────────────────────────────
// When the view doesn't exist yet we fall back to study_materials + programs join.
// Supabase may return the joined program as a single object or an array.

import type { StudyMaterialType } from '@/lib/types/database'

type ProgramJoin =
  | { id: string; code: string; name: string }
  | { id: string; code: string; name: string }[]
  | null

interface FallbackRow {
  id:            string
  title:         string
  description:   string | null
  type:          StudyMaterialType
  file_url:      string | null
  notes_content: string | null
  category:      string | null
  created_at:    string
  program_id:    string | null
  meeting_url:   string | null
  programs:      ProgramJoin
}

function unwrapProgram(raw: ProgramJoin): { code: string; name: string } | null {
  if (!raw) {return null}
  if (Array.isArray(raw)) {return raw[0] ?? null}
  return raw
}

// ── normalise ─────────────────────────────────────────────────────────────────
// Maps either the view row or the fallback join row to StudyMaterial.

function normaliseViewRow(row: ViewRow<'published_study_materials'>): StudyMaterial {
  return {
    id:            row.id,
    title:         row.title,
    description:   row.description,
    type:          row.type,
    file_url:      row.file_url,
    notes_content: row.notes_content,
    category:      row.category,
    created_at:    row.created_at,
    program_id:    row.program_id,
    meeting_url:   row.meeting_url,
    program_code:  row.program_code,
    program_name:  row.program_name,
  }
}

function normaliseFallbackRow(row: FallbackRow): StudyMaterial {
  const prog = unwrapProgram(row.programs)
  return {
    id:            row.id,
    title:         row.title,
    description:   row.description,
    type:          row.type,
    file_url:      row.file_url,
    notes_content: row.notes_content,
    category:      row.category,
    created_at:    row.created_at,
    program_id:    row.program_id,
    meeting_url:   row.meeting_url,
    program_code:  prog?.code ?? null,
    program_name:  prog?.name ?? null,
  }
}

// ── fetchStudyMaterials ───────────────────────────────────────────────────────
// Primary: published_study_materials view filtered by program.
// Fallback: study_materials + programs join (view doesn't exist yet).
//
// Visibility rules:
//   • program_id = student's program_id  (their program's materials)
//   • OR program_id IS NULL              (global / cross-program materials)

export interface FetchStudyMaterialsSuccess {
  ok:        true
  materials: StudyMaterial[]
}
export interface FetchStudyMaterialsFailure {
  ok:      false
  message: string
}
export type FetchStudyMaterialsOutcome =
  | FetchStudyMaterialsSuccess
  | FetchStudyMaterialsFailure

export async function fetchStudyMaterials(
  supabase:  DB,
  programId: string | null,
): Promise<FetchStudyMaterialsOutcome> {

  // ── Primary: view query ───────────────────────────────────────────────────
  let viewQuery = supabase
    .from('published_study_materials')
    .select('*')

  // Apply program filter only when the student has a program
  if (programId) {
    viewQuery = viewQuery.or(`program_id.eq.${programId},program_id.is.null`)
  }

  const viewRequest = viewQuery
    .order('created_at', { ascending: false })
    .overrideTypes<ViewRow<'published_study_materials'>[], { merge: false }>()

  const { data: viewData, error: viewError } = await viewRequest

  if (!viewError) {
    return {
      ok:        true,
      materials: (viewData ?? []).map(normaliseViewRow),
    }
  }

  // ── Fallback: direct join ─────────────────────────────────────────────────
  let fallbackQuery = supabase
    .from('study_materials')
    .select(`
      id, title, description, type, file_url, notes_content,
      category, created_at, program_id, meeting_url,
      programs:program_id ( id, code, name )
    `)
    .eq('is_published', true)

  if (programId) {
    fallbackQuery = fallbackQuery.or(`program_id.eq.${programId},program_id.is.null`)
  }

  const fallbackRequest = fallbackQuery
    .order('created_at', { ascending: false })
    .overrideTypes<FallbackRow[], { merge: false }>()

  const { data: fallbackData, error: fallbackError } = await fallbackRequest

  if (fallbackError) {
    return {
      ok:      false,
      message: 'Could not load study materials. Please try again.',
    }
  }

  return {
    ok:        true,
    materials: (fallbackData ?? []).map(normaliseFallbackRow),
  }
}

// ── Favorites ─────────────────────────────────────────────────────────────────

export async function getFavoriteIds(
  supabase: DB,
  userId:   string,
): Promise<string[]> {
  const { data } = await supabase
    .from('favorites')
    .select('material_id')
    .eq('user_id', userId)
    .overrideTypes<{ material_id: string }[], { merge: false }>()

  return (data ?? []).map((r) => r.material_id)
}

export async function toggleFavorite(
  supabase:   DB,
  userId:     string,
  materialId: string,
  currently:  boolean,
): Promise<boolean> {
  if (currently) {
    await supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('material_id', materialId)
    return false
  } else {
    await supabase
      .from('favorites')
      .insert({ user_id: userId, material_id: materialId })
    return true
  }
}

// ── Realtime subscription ─────────────────────────────────────────────────────
// Subscribes to study_materials changes and calls onRefresh on any event.
// Returns the channel so the caller can unsubscribe on cleanup.

export function subscribeToStudyMaterials(
  supabase:  DB,
  onRefresh: () => void,
): RealtimeChannel {
  return supabase
    .channel('study_materials_changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'study_materials' },
      onRefresh,
    )
    .subscribe()
}