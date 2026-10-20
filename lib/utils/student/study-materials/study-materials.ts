// lib/utils/student/study-materials/study-materials.ts
// ─────────────────────────────────────────────────────────────────────────────
// Pure utility functions for the study materials feature.
// No React, no Supabase — fully unit-testable.
// ─────────────────────────────────────────────────────────────────────────────

import type { StudyMaterial } from '@/lib/types/student/study-materials/study-materials'
import { RECENTLY_VIEWED_KEY, RECENTLY_VIEWED_MAX } from '@/lib/types/student/study-materials/study-materials'

// ── YouTube ───────────────────────────────────────────────────────────────────

export function extractYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/,
  )
  return match?.[1] ?? null
}

// ── Extended search matching ──────────────────────────────────────────────────
// Matches against title, description, category, AND program_code.
// Pass the already-lowercased, trimmed query for performance.

export function matchesSearch(material: StudyMaterial, lowerQuery: string): boolean {
  if (!lowerQuery) {return true}
  return (
    material.title.toLowerCase().includes(lowerQuery) ||
    (material.description  ?? '').toLowerCase().includes(lowerQuery) ||
    (material.category     ?? '').toLowerCase().includes(lowerQuery) ||
    (material.program_code ?? '').toLowerCase().includes(lowerQuery)
  )
}

// ── "NEW" badge helper ────────────────────────────────────────────────────────
// Returns true if the material was created within the last 3 days.

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000

export function isNewMaterial(createdAt: string): boolean {
  return Date.now() - new Date(createdAt).getTime() < THREE_DAYS_MS
}

// ── Recently viewed (localStorage) ───────────────────────────────────────────
// Stored as a JSON array of material IDs, newest first, capped at MAX.

function safeParseIds(raw: string | null): string[] {
  if (!raw) {return []}
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as unknown[]).filter((v): v is string => typeof v === 'string') : []
  } catch {
    return []
  }
}

export function getRecentlyViewedIds(): string[] {
  if (typeof window === 'undefined') {return []}
  return safeParseIds(localStorage.getItem(RECENTLY_VIEWED_KEY))
}

export function recordRecentlyViewed(materialId: string): void {
  if (typeof window === 'undefined') {return}
  const existing = getRecentlyViewedIds().filter((id) => id !== materialId)
  const next = [materialId, ...existing].slice(0, RECENTLY_VIEWED_MAX)
  localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(next))
}

// ── Page numbers builder ──────────────────────────────────────────────────────

export function buildPageNums(totalPages: number, currentPage: number): (number | '…')[] {
  const nums: (number | '…')[] = []
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) {nums.push(i)}
    return nums
  }
  nums.push(1)
  if (currentPage > 3) {nums.push('…')}
  const start = Math.max(2, currentPage - 1)
  const end   = Math.min(totalPages - 1, currentPage + 1)
  for (let i = start; i <= end; i++) {nums.push(i)}
  if (currentPage < totalPages - 2) {nums.push('…')}
  nums.push(totalPages)
  return nums
}