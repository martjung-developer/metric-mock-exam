// components/dashboard/student/study-materials/MaterialCard.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Extended with:
//   • "Open Resource" button when external_url is set and non-YouTube
//   • "Join Session" button when meeting_url is set
//   • link_type badge ("Live Session", "External Resource", etc.)
//
// All original structure, CSS classes, and behaviour are preserved.
// ─────────────────────────────────────────────────────────────────────────────

import { FileText, Video, StickyNote, BookOpen, Star, ExternalLink } from 'lucide-react'
import type { StudyMaterial, MaterialType } from '@/lib/types/student/study-materials/study-materials'
import { isNewMaterial }     from '@/lib/utils/student/study-materials/study-materials'
import { isYouTubeUrl }      from '@/lib/types/student/study-materials/study-materials'
import styles from '@/app/(dashboard)/student/study-materials/study-materials.module.css'

// ── TYPE_META (unchanged) ─────────────────────────────────────────────────────

const TYPE_META: Record<MaterialType, { label: string; accentClass: string; iconColorClass: string }> = {
  document: { label: 'Document', accentClass: styles.accentPdf,   iconColorClass: styles.iconPdf   },
  video:    { label: 'Video',    accentClass: styles.accentVideo, iconColorClass: styles.iconVideo },
  notes:    { label: 'Notes',    accentClass: styles.accentNotes, iconColorClass: styles.iconNotes },
}

function typeIcon(type: MaterialType) {
  if (type === 'document') {return <FileText   size={18} strokeWidth={1.75} />}
  if (type === 'video')    {return <Video      size={18} strokeWidth={1.75} />}
  return                          <StickyNote size={18} strokeWidth={1.75} />
}

// ── Link-type badge labels ─────────────────────────────────────────────────────

const LINK_TYPE_LABEL: Record<string, string> = {
  video:   'Video',
  meeting: 'Live Session',
  drive:   'Google Drive',
  other:   'External Resource',
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface MaterialCardProps {
  item:         StudyMaterial
  onView:       (item: StudyMaterial) => void
  onToggleFav?: (id: string) => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export function MaterialCard({ item, onView, onToggleFav }: MaterialCardProps) {
  const meta  = TYPE_META[item.type]
  const isNew = isNewMaterial(item.created_at)
  const isFav = item.is_favorited ?? false

  // Whether the card has an external resource button (non-YouTube external_url)
  const hasExternalBtn =
    item.external_url !== null &&
    item.external_url !== undefined &&
    item.external_url !== '' &&
    !isYouTubeUrl(item.external_url)

  const linkTypeBadge = item.link_type ? LINK_TYPE_LABEL[item.link_type] : null

  return (
    <div className={styles.card}>
      {/* Existing accent bar */}
      <div className={`${styles.cardAccent} ${meta.accentClass}`} />

      {/* Favorite star (existing optional feature) */}
      {onToggleFav && (
        <button
          onClick={() => onToggleFav(item.id)}
          aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
          style={{
            position:   'absolute',
            top:        '0.7rem',
            right:      '0.7rem',
            background: 'none',
            border:     'none',
            cursor:     'pointer',
            padding:    '2px',
            color:      isFav ? '#f59e0b' : '#d1d5db',
            transition: 'color 0.15s',
            zIndex:     1,
          }}
        >
          <Star size={15} fill={isFav ? '#f59e0b' : 'none'} strokeWidth={2} />
        </button>
      )}

      {/* Top row */}
      <div className={styles.cardTop}>
        <div className={`${styles.cardIconWrap} ${meta.iconColorClass}`}>
          {typeIcon(item.type)}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
          {isNew && (
            <span style={{
              fontSize:      '0.6rem',
              fontWeight:    800,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              padding:       '0.2rem 0.5rem',
              borderRadius:  '99px',
              background:    '#dcfce7',
              color:         '#15803d',
              border:        '1px solid #86efac',
            }}>
              NEW
            </span>
          )}
          {/* Link-type badge (new — only when link_type is set) */}
          {linkTypeBadge && (
            <span style={{
              fontSize:      '0.6rem',
              fontWeight:    800,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              padding:       '0.2rem 0.5rem',
              borderRadius:  '99px',
              background:    item.link_type === 'meeting' ? '#dcfce7' : '#eff4ff',
              color:         item.link_type === 'meeting' ? '#15803d' : '#1d4ed8',
              border:        `1px solid ${item.link_type === 'meeting' ? '#86efac' : '#bfdbfe'}`,
            }}>
              {linkTypeBadge}
            </span>
          )}
          <span className={`${styles.typeBadge} ${meta.accentClass}`}>
            {meta.label}
          </span>
        </div>
      </div>

      {/* Card body (unchanged) */}
      <div className={styles.cardBody}>
        {item.program_code && (
          <p className={styles.shortCode}>{item.program_code}</p>
        )}
        <h3 className={styles.cardTitle}>{item.title}</h3>
        {item.description && (
          <p className={styles.cardDesc}>{item.description}</p>
        )}
        {item.category && (
          <span className={styles.categoryTag}>{item.category}</span>
        )}
      </div>

      {/* Footer */}
      <div className={styles.cardFooter}>

        {/* ── Join Session button (new — only when meeting_url is set) ── */}
        {item.meeting_url && (
          <a
            href={item.meeting_url}
            target="_blank"
            rel="noreferrer"
            style={{
              display:        'inline-flex',
              alignItems:     'center',
              justifyContent: 'center',
              gap:            '0.4rem',
              padding:        '0.45rem 1rem',
              marginBottom:   '0.5rem',
              background:     '#f0fdf4',
              color:          '#15803d',
              border:         '1px solid #86efac',
              borderRadius:   '8px',
              fontSize:       '0.77rem',
              fontWeight:     600,
              textDecoration: 'none',
              width:          '100%',
              transition:     'background 0.15s',
              boxSizing:      'border-box' as const,
            }}
          >
            <ExternalLink size={13} strokeWidth={2} />
            Join Session
          </a>
        )}

        {/* ── Open Resource button (new — non-YouTube external_url) ── */}
        {hasExternalBtn && (
          <a
            href={item.external_url ?? ''}
            target="_blank"
            rel="noreferrer"
            style={{
              display:        'inline-flex',
              alignItems:     'center',
              justifyContent: 'center',
              gap:            '0.4rem',
              padding:        '0.45rem 1rem',
              marginBottom:   '0.5rem',
              background:     '#eff4ff',
              color:          '#1d4ed8',
              border:         '1px solid #bfdbfe',
              borderRadius:   '8px',
              fontSize:       '0.77rem',
              fontWeight:     600,
              textDecoration: 'none',
              width:          '100%',
              transition:     'background 0.15s',
              boxSizing:      'border-box' as const,
            }}
          >
            <ExternalLink size={13} strokeWidth={2} />
            Open Resource
          </a>
        )}

        {/* Existing View Material button (unchanged) */}
        <button className={styles.viewBtn} onClick={() => onView(item)}>
          <BookOpen size={14} strokeWidth={2} />
          View Material
        </button>

      </div>
    </div>
  )
}
