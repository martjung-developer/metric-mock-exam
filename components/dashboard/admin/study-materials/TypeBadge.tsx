// components/dashboard/admin/study-materials/TypeBadge.tsx
//
// Renders the colored type pill (Document / Video / Notes).
// Extracted so both MaterialTable and PreviewModal can share it without
// duplicating the class-lookup logic.

'use client'

import { FileText, Video, StickyNote } from 'lucide-react'
import type { MaterialType } from '@/lib/types/admin/study-materials/study-materials'
import { typeLabel, TYPE_ICON_COLOR, TYPE_BADGE_SUFFIX } from '@/lib/utils/admin/study-materials/display'
import styles from '@/app/(dashboard)/admin/study-materials/study-materials.module.css'

interface Props {
  type: MaterialType
  /** Icon size in px. Defaults to 11. */
  iconSize?: number
}

function TypeIcon({ type, size }: { type: MaterialType; size: number }) {
  switch (type) {
    case 'document': return <FileText   size={size} strokeWidth={1.75} />
    case 'video':    return <Video      size={size} strokeWidth={1.75} />
    case 'notes':    return <StickyNote size={size} strokeWidth={1.75} />
  }
}

export function TypeBadge({ type, iconSize = 11 }: Props) {
  const badgeClass = `${styles.typeBadge} ${styles[TYPE_BADGE_SUFFIX[type]]}`
  return (
    <span className={badgeClass} style={{ color: TYPE_ICON_COLOR[type] }}>
      <TypeIcon type={type} size={iconSize} />
      {typeLabel(type)}
    </span>
  )
}

// Also export the icon-only variant for use in table cells
export function TypeIconDisplay({ type, size = 14 }: { type: MaterialType; size?: number }) {
  return <TypeIcon type={type} size={size} />
}