// lib/utils/admin/study-materials/validators.ts
//
// Single source of truth for form shape and validation.
// RawFormState is the canonical flat form object used by useStudyForm,
// MaterialFormModal, and the service layer.

import { z } from 'zod'

export type MaterialType = 'document' | 'video' | 'notes'
export type LinkType     = 'video' | 'meeting' | 'drive' | 'other'

export const MATERIAL_TYPES: MaterialType[] = ['document', 'video', 'notes']
export const MAX_MATERIAL_UPLOAD_BYTES = 1024 * 1024 * 1024
export const MAX_MATERIAL_UPLOAD_LABEL = '1GB'
export const COMMON_MATERIAL_ACCEPT = [
  '.pdf',
  '.doc',
  '.docx',
  '.ppt',
  '.pptx',
  '.xls',
  '.xlsx',
  '.csv',
  '.txt',
  '.rtf',
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.svg',
  '.mp3',
  '.wav',
  '.m4a',
  '.mp4',
  '.mov',
  '.avi',
  '.mkv',
  '.webm',
  '.zip',
  '.rar',
  '.7z',
].join(',')

// ── YouTube URL helper ────────────────────────────────────────────────────────

export function extractYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/,
  )
  return match ? match[1] : null
}

// ── Base schema (fields common to all types) ──────────────────────────────────

const baseSchema = z.object({
  title:        z.string().min(1, 'Title is required.'),
  description:  z.string().optional(),
  program_id:   z.string().optional(),
  category:     z.string().optional(),
  is_published: z.boolean(),
  external_url: z.string().url('Must be a valid URL.').or(z.literal('')).optional(),
  meeting_url:  z.string().url('Must be a valid URL.').or(z.literal('')).optional(),
  link_type:    z.enum(['video', 'meeting', 'drive', 'other']).or(z.literal('')).optional(),
})

// ── Per-type discriminated schemas ────────────────────────────────────────────

export const documentSchema = baseSchema.extend({
  type:          z.literal('document'),
  youtube_url:   z.string().optional(),
  notes_content: z.string().optional(),
})

export const videoSchema = baseSchema.extend({
  type:          z.literal('video'),
  youtube_url:   z
    .string()
    .min(1, 'YouTube URL is required.')
    .refine(
      (url) => extractYouTubeId(url) !== null,
      'Invalid YouTube URL. Please use a standard youtube.com or youtu.be link.',
    ),
  notes_content: z.string().optional(),
})

export const notesSchema = baseSchema.extend({
  type:          z.literal('notes'),
  youtube_url:   z.string().optional(),
  notes_content: z.string().min(1, 'Notes content is required.'),
})

export const studyMaterialSchema = z.discriminatedUnion('type', [
  documentSchema,
  videoSchema,
  notesSchema,
])

export type StudyMaterialFormValues = z.infer<typeof studyMaterialSchema>

// ── Flat form state ───────────────────────────────────────────────────────────
// This is the canonical shape used across useStudyForm, MaterialFormModal,
// and the service layer. All fields are strings/booleans for easy form binding.

export interface RawFormState {
  title:         string
  description:   string
  type:          MaterialType
  youtube_url:   string
  notes_content: string
  program_id:    string
  category:      string
  is_published:  boolean
  // External resource fields
  external_url:  string
  meeting_url:   string
  link_type:     LinkType | ''
}

export const EMPTY_FORM: RawFormState = {
  title:         '',
  description:   '',
  type:          'document',
  youtube_url:   '',
  notes_content: '',
  program_id:    '',
  category:      '',
  is_published:  false,
  external_url:  '',
  meeting_url:   '',
  link_type:     '',
}

// ── Validation errors ─────────────────────────────────────────────────────────

export interface ValidationErrors {
  title?:         string
  youtube_url?:   string
  notes_content?: string
  program_id?:    string
  file?:          string
  external_url?:  string
  meeting_url?:   string
}

// ── Validate raw form + optional file, return typed errors ────────────────────

export function validateMaterialForm(
  raw: RawFormState,
  file: File | null,
  isEditing: boolean,
): ValidationErrors {
  const result = studyMaterialSchema.safeParse(raw)
  const errors: ValidationErrors = {}

  if (!result.success) {
    for (const issue of result.error.issues) {
      const field = issue.path[0] as keyof ValidationErrors
      if (!errors[field]) {
        errors[field] = issue.message
      }
    }
  }

  // Document file: required on create only (edit can keep existing file)
  if (raw.type === 'document' && !isEditing && !file && !raw.external_url.trim()) {
    errors.file = 'Please upload a file or provide an external URL.'
  }
  if (file && file.size > MAX_MATERIAL_UPLOAD_BYTES) {
    errors.file = `File must be ${MAX_MATERIAL_UPLOAD_LABEL} or smaller.`
  }

  return errors
}
