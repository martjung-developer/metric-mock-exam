// components/dashboard/student/study-materials/PreviewModal.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Extends the existing PreviewModal with smart rendering for:
//   • external_url (YouTube embed OR external open button)
//   • meeting_url  ("Join Session" highlighted button)
//   • link_type    (badge labelling)
//
// All original rendering paths (video embed via file_url, document open button,
// notes content) are preserved exactly. New paths only activate when
// external_url / meeting_url are present and the existing path is absent.
// ─────────────────────────────────────────────────────────────────────────────

'use client'

import { useEffect }         from 'react'
import { X, ExternalLink, Video }   from 'lucide-react'
import type { StudyMaterial, MaterialType } from '@/lib/types/student/study-materials/study-materials'
import { extractYouTubeId }  from '@/lib/utils/student/study-materials/study-materials'
import { isYouTubeUrl }      from '@/lib/types/student/study-materials/study-materials'
import styles from '@/app/(dashboard)/student/study-materials/study-materials.module.css'

// ── Link-type badge labels ────────────────────────────────────────────────────

const LINK_TYPE_LABEL: Record<string, string> = {
  video:   'Video',
  meeting: 'Live Session',
  drive:   'Google Drive',
  other:   'External Resource',
}

const TYPE_META: Record<MaterialType, { label: string; accentClass: string }> = {
  document: { label: 'Document', accentClass: styles.accentPdf   },
  video:    { label: 'Video',    accentClass: styles.accentVideo },
  notes:    { label: 'Notes',    accentClass: styles.accentNotes },
}

interface PreviewModalProps {
  item:      StudyMaterial
  onClose:   () => void
  onViewed?: (id: string) => void
}

export function PreviewModal({ item, onClose, onViewed }: PreviewModalProps) {
  const meta = TYPE_META[item.type]

  // Fire onViewed exactly once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { onViewed?.(item.id) }, [])

  // Keyboard + scroll lock
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') {onClose()} }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  // ── Resolve what to render in the body ────────────────────────────────────
  // Priority:
  //   1. file_url video embed (existing)
  //   2. external_url YouTube embed (new)
  //   3. file_url document open (existing)
  //   4. external_url open button (new)
  //   5. notes_content (existing)

  const linkTypeBadge = item.link_type ? LINK_TYPE_LABEL[item.link_type] : null

  return (
    <div
      className={styles.modalOverlay}
      onClick={(e) => { if (e.target === e.currentTarget) {onClose()} }}
      role="dialog"
      aria-modal="true"
      aria-label={item.title}
    >
      <div className={styles.modal}>

        {/* Accent bar */}
        <div className={`${styles.modalAccent} ${meta.accentClass}`} />

        {/* Header */}
        <div className={styles.modalHeader}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
              <span className={`${styles.typeBadge} ${meta.accentClass}`}>{meta.label}</span>
              {/* Link-type badge (new — only shown when link_type is set) */}
              {linkTypeBadge && (
                <span style={{
                  fontSize:      '0.62rem',
                  fontWeight:    700,
                  padding:       '0.18rem 0.5rem',
                  borderRadius:  '4px',
                  background:    item.link_type === 'meeting' ? '#dcfce7' : '#eff4ff',
                  color:         item.link_type === 'meeting' ? '#15803d' : '#1d4ed8',
                  border:        `1px solid ${item.link_type === 'meeting' ? '#86efac' : '#bfdbfe'}`,
                  letterSpacing: '0.03em',
                }}>
                  {linkTypeBadge}
                </span>
              )}
              {item.program_code && (
                <span className={styles.categoryTag}>{item.program_code}</span>
              )}
              {item.category && (
                <span className={styles.categoryTag}>{item.category}</span>
              )}
            </div>
            <h2 className={styles.modalTitle}>{item.title}</h2>
            {item.description && (
              <p className={styles.modalDesc}>{item.description}</p>
            )}
          </div>
          <button className={styles.modalClose} onClick={onClose} aria-label="Close">
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className={styles.modalBody}>

          {/* ── CASE 1: Video type — file_url YouTube embed (existing) ─────── */}
          {item.type === 'video' && item.file_url && (() => {
            const ytId = extractYouTubeId(item.file_url)
            return ytId ? (
              <div className={styles.videoWrap}>
                <iframe
                  src={`https://www.youtube.com/embed/${ytId}`}
                  title={item.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <a href={item.file_url} target="_blank" rel="noreferrer" className={styles.openBtn}>
                <ExternalLink size={14} /> Open Video
              </a>
            )
          })()}

          {/* ── CASE 2: external_url YouTube embed (new) ─────────────────── */}
          {!item.file_url && item.external_url && isYouTubeUrl(item.external_url) && (() => {
            const ytId = extractYouTubeId(item.external_url)
            return ytId ? (
              <div className={styles.videoWrap}>
                <iframe
                  src={`https://www.youtube.com/embed/${ytId}`}
                  title={item.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : null
          })()}

          {/* ── CASE 3: Document — file_url open button (existing) ────────── */}
          {item.type === 'document' && item.file_url && (
            <>
              <p className={styles.docHint}>Click below to open or download this document.</p>
              <div>
                <a href={item.file_url} target="_blank" rel="noreferrer" className={styles.openBtn}>
                  <ExternalLink size={14} /> Open Document
                </a>
              </div>
            </>
          )}

          {/* ── CASE 4: external_url non-YouTube open button (new) ────────── */}
          {item.external_url && !isYouTubeUrl(item.external_url) && (
            <div>
              <a
                href={item.external_url}
                target="_blank"
                rel="noreferrer"
                className={styles.openBtn}
              >
                <ExternalLink size={14} />
                Open{item.link_type === 'drive' ? ' Drive File' : ' Resource'}
              </a>
            </div>
          )}

          {/* ── CASE 5: Notes (existing) ──────────────────────────────────── */}
          {item.type === 'notes' && item.notes_content && (
            <div className={styles.notesContent}>{item.notes_content}</div>
          )}

          {/* ── Meeting link — "Join Session" (new) ──────────────────────── */}
          {item.meeting_url && (
            <div style={{ marginTop: '1rem' }}>
              <a
                href={item.meeting_url}
                target="_blank"
                rel="noreferrer"
                style={{
                  display:        'inline-flex',
                  alignItems:     'center',
                  gap:            '0.45rem',
                  padding:        '0.6rem 1.25rem',
                  background:     '#dcfce7',
                  color:          '#15803d',
                  border:         '1.5px solid #86efac',
                  borderRadius:   '9px',
                  fontWeight:     700,
                  fontSize:       '0.82rem',
                  textDecoration: 'none',
                  transition:     'background 0.15s',
                }}
              >
                <Video size={14} strokeWidth={2} />
                Join Session
              </a>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <button className={styles.closeBtn} onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}