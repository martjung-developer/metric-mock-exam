// lib/services/admin/study-materials/studyMaterials.service.ts
//
// All Supabase data operations for the Study Materials feature.
// No React, no hooks — pure async functions that accept a typed Supabase client.
//
// FIX: buildPayload now includes external_url, meeting_url, link_type.
// FIX: fetchStudyMaterials selects and maps all new columns.
// FIX: StudyMaterialRow is imported from the types file (not re-declared).

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database }       from '@/lib/types/database'
import type {
  StudyMaterial,
  StudyMaterialRow,
  ProgramOption,
  LinkType,
} from '@/lib/types/admin/study-materials/study-materials'
import type { RawFormState } from '@/lib/utils/admin/study-materials/validators'
import { uploadMaterialFile } from './storage.service'

type SupabaseDB = SupabaseClient<Database>

type AdminRole = 'admin' | 'faculty'

interface StudyMaterialScope {
  role: AdminRole | null
  schoolId: string | null
  programIds: string[]
  lockedProgramId: string | null
}

async function resolveStudyMaterialScope(
  supabase: SupabaseDB,
): Promise<StudyMaterialScope> {
  const { data: authRes } = await supabase.auth.getUser()
  const userId = authRes.user?.id ?? null
  if (!userId) {
    return { role: null, schoolId: null, programIds: [], lockedProgramId: null }
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

    const facultyProgramId = facultyRow?.program_id ?? null
    return {
      role: 'faculty',
      schoolId: facultyRow?.school_id ?? null,
      programIds: facultyProgramId ? [facultyProgramId] : [],
      lockedProgramId: facultyProgramId,
    }
  }

  if (profile?.role === 'admin') {
    const { data: adminRow } = await supabase
      .from('admins')
      .select('school_id')
      .eq('user_id', userId)
      .maybeSingle()

    const schoolId = adminRow?.school_id ?? null
    if (!schoolId) {
      return { role: 'admin', schoolId: null, programIds: [], lockedProgramId: null }
    }

    const { data: programRows } = await supabase
      .from('programs')
      .select('id')
      .eq('school_id', schoolId)

    return {
      role: 'admin',
      schoolId,
      programIds: (programRows ?? []).map((row) => row.id),
      lockedProgramId: null,
    }
  }

  return { role: null, schoolId: null, programIds: [], lockedProgramId: null }
}

async function assertAllowedProgramId(
  supabase: SupabaseDB,
  scope: StudyMaterialScope,
  requestedProgramId: string | null,
): Promise<string | null> {
  if (scope.role === 'faculty') {
    if (!scope.lockedProgramId) {
      throw new Error('Faculty program scope is not configured.')
    }
    return scope.lockedProgramId
  }

  if (!requestedProgramId) {
    return null
  }

  if (!scope.programIds.includes(requestedProgramId)) {
    throw new Error('You can only manage study materials within your assigned department.')
  }

  const { data: programRow, error } = await supabase
    .from('programs')
    .select('id')
    .eq('id', requestedProgramId)
    .maybeSingle()

  if (error || !programRow) {
    throw new Error('Selected program is invalid or unavailable.')
  }

  return requestedProgramId
}

async function ensureMaterialWithinScope(
  supabase: SupabaseDB,
  scope: StudyMaterialScope,
  materialId: string,
): Promise<void> {
  const { data: materialRow, error } = await supabase
    .from('study_materials')
    .select('id, program_id')
    .eq('id', materialId)
    .maybeSingle()

  if (error || !materialRow) {
    throw new Error('Study material not found.')
  }

  const materialProgramId = materialRow.program_id
  if (!materialProgramId || !scope.programIds.includes(materialProgramId)) {
    throw new Error('You can only manage study materials within your assigned department.')
  }
}

// ── SELECT ────────────────────────────────────────────────────────────────────

export async function fetchStudyMaterials(
  supabase: SupabaseDB,
): Promise<StudyMaterial[]> {
  const scope = await resolveStudyMaterialScope(supabase)
  if (scope.programIds.length === 0) {
    return []
  }

  const { data, error } = await supabase
    .from('study_materials')
    .select(`
      id,
      title,
      description,
      type,
      file_url,
      notes_content,
      program_id,
      category,
      is_published,
      created_at,
      updated_at,
      external_url,
      meeting_url,
      link_type,
      programs:program_id ( id, code, name )
    `)
    .in('program_id', scope.programIds)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  // Remap `programs` → `program` for ergonomic UI use
  return (data as StudyMaterialRow[]).map(({ programs, link_type, ...rest }) => ({
    ...rest,
    link_type: (link_type as LinkType | null) ?? null,
    program:   programs ?? null,
  }))
}

export async function fetchPrograms(
  supabase: SupabaseDB,
): Promise<ProgramOption[]> {
  const scope = await resolveStudyMaterialScope(supabase)
  if (!scope.schoolId) {
    return []
  }

  let query = supabase
    .from('programs')
    .select('id, code, name')
    .eq('school_id', scope.schoolId)

  if (scope.role === 'faculty' && scope.lockedProgramId) {
    query = query.eq('id', scope.lockedProgramId)
  }

  const { data, error } = await query.order('name')

  if (error) {
    throw new Error(error.message)
  }
  return data as ProgramOption[]
}

// ── Build insert/update payload ───────────────────────────────────────────────

interface BuildPayloadArgs {
  supabase:        SupabaseDB
  form:            RawFormState
  file:            File | null
  existingFileUrl: string | null
}

async function buildPayload(args: BuildPayloadArgs) {
  const { supabase, form, file, existingFileUrl } = args

  let fileUrl: string | null = existingFileUrl

  // Upload physical file for document type
  if (form.type === 'document' && file) {
    const { publicUrl } = await uploadMaterialFile(supabase, file)
    fileUrl = publicUrl
  }

  // For video type, store YouTube URL in file_url
  if (form.type === 'video') {
    fileUrl = form.youtube_url.trim() || null
  }

  return {
    title:         form.title.trim(),
    description:   form.description.trim() || null,
    type:          form.type,
    file_url:      form.type !== 'notes' ? fileUrl : null,
    notes_content: form.type === 'notes' ? form.notes_content.trim() : null,
    program_id:    form.program_id || null,
    category:      form.category.trim() || null,
    is_published:  form.is_published,
    // New external resource fields
    external_url:  form.external_url.trim() || null,
    meeting_url:   form.meeting_url.trim() || null,
    link_type:     (form.link_type || null) as LinkType | null,
  }
}

// ── CREATE ────────────────────────────────────────────────────────────────────

export interface CreateMaterialArgs {
  supabase: SupabaseDB
  form:     RawFormState
  file:     File | null
}

export async function createStudyMaterial(
  args: CreateMaterialArgs,
): Promise<void> {
  const scope = await resolveStudyMaterialScope(args.supabase)
  const scopedProgramId = await assertAllowedProgramId(
    args.supabase,
    scope,
    args.form.program_id || null,
  )

  const payload = await buildPayload({
    supabase:        args.supabase,
    form:            { ...args.form, program_id: scopedProgramId ?? '' },
    file:            args.file,
    existingFileUrl: null,
  })

  const { error } = await args.supabase
    .from('study_materials')
    .insert(payload)

  if (error) {
    throw new Error(error.message)
  }
}

// ── UPDATE ────────────────────────────────────────────────────────────────────

export interface UpdateMaterialArgs {
  supabase:        SupabaseDB
  id:              string
  form:            RawFormState
  file:            File | null
  existingFileUrl: string | null
}

export async function updateStudyMaterial(
  args: UpdateMaterialArgs,
): Promise<void> {
  const scope = await resolveStudyMaterialScope(args.supabase)
  await ensureMaterialWithinScope(args.supabase, scope, args.id)
  const scopedProgramId = await assertAllowedProgramId(
    args.supabase,
    scope,
    args.form.program_id || null,
  )

  const payload = await buildPayload({
    supabase:        args.supabase,
    form:            { ...args.form, program_id: scopedProgramId ?? '' },
    file:            args.file,
    existingFileUrl: args.existingFileUrl,
  })

  const { error } = await args.supabase
    .from('study_materials')
    .update(payload)
    .eq('id', args.id)

  if (error) {
    throw new Error(error.message)
  }
}

// ── DELETE ────────────────────────────────────────────────────────────────────

export async function deleteStudyMaterial(
  supabase: SupabaseDB,
  id: string,
): Promise<void> {
  const scope = await resolveStudyMaterialScope(supabase)
  await ensureMaterialWithinScope(supabase, scope, id)

  const { error } = await supabase
    .from('study_materials')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }
}

// ── TOGGLE PUBLISH ────────────────────────────────────────────────────────────

export async function toggleMaterialPublish(
  supabase: SupabaseDB,
  id: string,
  isPublished: boolean,
): Promise<void> {
  const scope = await resolveStudyMaterialScope(supabase)
  await ensureMaterialWithinScope(supabase, scope, id)

  const { error } = await supabase
    .from('study_materials')
    .update({ is_published: isPublished })
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }
}
