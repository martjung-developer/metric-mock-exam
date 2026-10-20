// lib/utils/admin/study-materials/display.ts
//
// Pure display helpers: labels, CSS class lookups, color tokens.
// Imported by components — no React, no hooks.

import type { MaterialType } from '@/lib/types/admin/study-materials/study-materials'

export function typeLabel(type: MaterialType): string {
  switch (type) {
    case 'document': return 'Document'
    case 'video':    return 'Video'
    case 'notes':    return 'Notes'
  }
}

export const TYPE_ICON_BG: Record<MaterialType, string> = {
  document: 'rgba(59,130,246,0.10)',
  video:    'rgba(239,68,68,0.10)',
  notes:    'rgba(16,185,129,0.10)',
}

export const TYPE_ICON_COLOR: Record<MaterialType, string> = {
  document: '#1d4ed8',
  video:    '#b91c1c',
  notes:    '#047857',
}

/** CSS module class suffix for each type badge — append to styles.typeBadge */
export const TYPE_BADGE_SUFFIX: Record<MaterialType, 'typeDoc' | 'typeVideo' | 'typeNotes'> = {
  document: 'typeDoc',
  video:    'typeVideo',
  notes:    'typeNotes',
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-PH', {
    month: 'short',
    day:   'numeric',
    year:  'numeric',
  })
}