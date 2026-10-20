// lib/types/admin/study-materials/study-materials.ts
// ─────────────────────────────────────────────────────────────────────────────
// Domain types for the Study Materials feature.
// StudyMaterialForm mirrors RawFormState from validators.ts exactly so that
// the hook, form component, and service all share one shape without casting.
// ─────────────────────────────────────────────────────────────────────────────

export type MaterialType = 'document' | 'video' | 'notes'
export type LinkType     = 'video' | 'meeting' | 'drive' | 'other'

// ── Domain type (UI-level, after joining program) ─────────────────────────────

export interface StudyMaterial {
  id:            string
  title:         string
  description:   string | null
  type:          MaterialType
  file_url:      string | null
  notes_content: string | null
  category:      string | null
  is_published:  boolean
  created_at:    string
  updated_at:    string
  program_id:    string | null
  program:       { id: string; code: string; name: string } | null
  external_url:  string | null
  meeting_url:   string | null
  link_type:     LinkType | null
}

// ── Raw row shape returned by Supabase before the programs join is remapped ───

export interface StudyMaterialRow {
  id:            string
  title:         string
  description:   string | null
  type:          MaterialType
  file_url:      string | null
  notes_content: string | null
  category:      string | null
  is_published:  boolean
  created_at:    string
  updated_at:    string
  program_id:    string | null
  external_url:  string | null
  meeting_url:   string | null
  link_type:     string | null
  programs:      { id: string; code: string; name: string } | null
}

// ── Form state ────────────────────────────────────────────────────────────────
// Mirrors RawFormState from validators.ts. Both must be kept in sync.
// Defining it here keeps the types barrel clean while validators.ts
// can import from here or vice-versa. We define it once here and
// re-export from validators via import.

export interface StudyMaterialForm {
  title:         string
  description:   string
  type:          MaterialType
  youtube_url:   string   // used when type === 'video'
  notes_content: string
  program_id:    string
  category:      string
  is_published:  boolean
  external_url:  string
  meeting_url:   string
  link_type:     LinkType | ''
}

// ── Validation errors ─────────────────────────────────────────────────────────

export type StudyMaterialFormErrors = Partial<
  Record<keyof StudyMaterialForm | 'file', string>
>

// ── Program option (dropdown) ─────────────────────────────────────────────────

export interface ProgramOption {
  id:   string
  code: string
  name: string
}