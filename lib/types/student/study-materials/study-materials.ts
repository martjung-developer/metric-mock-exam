// lib/types/student/study-materials/study-materials.ts
// ─────────────────────────────────────────────────────────────────────────────
// Extended with external_url, meeting_url, link_type.
// All additions are optional — existing consumers are unaffected.
// ─────────────────────────────────────────────────────────────────────────────

import type { StudyMaterialType } from '@/lib/types/database'
import type { LinkType }          from '@/lib/types/database'

export type { StudyMaterialType }
export type MaterialType = StudyMaterialType

export interface StudyMaterial {
  // ── Core — always present ────────────────────────────────────────────────
  id:            string
  title:         string
  description:   string | null
  type:          StudyMaterialType
  file_url:      string | null
  notes_content: string | null
  category:      string | null
  created_at:    string
  program_id:    string | null
  program_code:  string | null
  program_name:  string | null

  // ── External resource fields (non-breaking additions) ────────────────────
  // external_url — any external resource (YouTube, Drive, etc.)
  external_url?: string | null
  // meeting_url  — Google Meet / Zoom (shows "Join Session" button)
  meeting_url?:  string | null
  // link_type    — hints the UI how to render the external_url
  link_type?:    LinkType | null

  // ── Existing optional fields (unchanged) ────────────────────────────────
  is_favorited?: boolean
  difficulty?:   'beginner' | 'intermediate' | 'advanced'
}

// ── Filter state (unchanged) ──────────────────────────────────────────────────
export type TypeFilter = 'All Types' | StudyMaterialType

export interface StudyMaterialFilters {
  search:   string
  category: string
  type:     TypeFilter
}

export const INITIAL_FILTERS: StudyMaterialFilters = {
  search:   '',
  category: 'All Categories',
  type:     'All Types',
}

export const RECENTLY_VIEWED_KEY = 'sm_recently_viewed'
export const RECENTLY_VIEWED_MAX = 5

// ── Link-type helpers ─────────────────────────────────────────────────────────

/** Returns true when the external_url is a recognisable YouTube link. */
export function isYouTubeUrl(url: string | null | undefined): boolean {
  if (!url) {return false}
  return /youtube\.com\/watch|youtu\.be\//.test(url)
}

/** Resolves what the primary resource URL for a material is. */
export function resolvePrimaryUrl(mat: Pick<StudyMaterial, 'file_url' | 'external_url'>): string | null {
  return mat.file_url ?? mat.external_url ?? null
}