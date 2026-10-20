// components/dashboard/admin/study-materials/PreviewModal.tsx
'use client'

import { X, Edit2, ExternalLink, FileText, StickyNote } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { StudyMaterial } from '@/lib/types/admin/study-materials/study-materials'
import {
  getYouTubeEmbedUrl,
  getYouTubeThumbnail,
} from '@/lib/utils/admin/study-materials/youtube'
import {
  TYPE_ICON_BG,
  typeLabel,
  formatDate,
} from '@/lib/utils/admin/study-materials/display'
import { TypeBadge } from './TypeBadge'
import styles from '@/app/(dashboard)/admin/study-materials/study-materials.module.css'
import {
  overlayVariants,
  modalVariants,
  buttonVariants,
} from '@/animations/admin/study-materials/study-materials'

interface Props {
  item:    StudyMaterial | null
  onClose: () => void
  onEdit:  (mat: StudyMaterial) => void
}

// ── Sub-components ────────────────────────────────────────────────────────────

function VideoPreview({ url, title }: { url: string; title: string }) {
  const embedUrl   = getYouTubeEmbedUrl(url)
  const thumbUrl   = getYouTubeThumbnail(url, 'hq')

  if (!embedUrl) {
    return (
      <div style={{
        padding:      '1rem',
        background:   '#fff5f5',
        border:       '1.5px solid #fecaca',
        borderRadius: 10,
        fontSize:     '0.82rem',
        color:        '#c53030',
      }}>
        ⚠️ The YouTube URL saved for this material appears to be invalid. Please edit and correct it.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {/* Embed */}
      <div style={{ borderRadius: 10, overflow: 'hidden', aspectRatio: '16/9', background: '#000' }}>
        <iframe
          width="100%"
          height="100%"
          src={embedUrl}
          title={title}
          style={{ display: 'block', border: 'none' }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>

      {/* Fallback thumbnail link for blocked embeds */}
      {thumbUrl && (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          style={{
            fontSize:       '0.75rem',
            color:          '#7a8fa8',
            textDecoration: 'none',
            display:        'inline-flex',
            alignItems:     'center',
            gap:            '0.3rem',
          }}
        >
          <ExternalLink size={11} />
          Open on YouTube
        </a>
      )}
    </div>
  )
}

function DocumentPreview({ url, title }: { url: string; title: string }) {
  const filename = url.split('/').pop()?.split('?')[0] ?? title

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {/* File chip */}
      <div style={{
        display:      'flex',
        alignItems:   'center',
        gap:          '0.6rem',
        padding:      '0.65rem 0.85rem',
        background:   'rgba(59,130,246,0.06)',
        border:       '1.5px solid rgba(59,130,246,0.18)',
        borderRadius: 10,
      }}>
        <div style={{
          width:           32,
          height:          32,
          borderRadius:    8,
          background:      'rgba(59,130,246,0.12)',
          display:         'flex',
          alignItems:      'center',
          justifyContent:  'center',
          flexShrink:      0,
        }}>
          <FileText size={16} color="#1d4ed8" />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{
            fontSize:     '0.82rem',
            fontWeight:   600,
            color:        '#0d2540',
            whiteSpace:   'nowrap',
            overflow:     'hidden',
            textOverflow: 'ellipsis',
          }}>
            {filename}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#7a8fa8', marginTop: 1 }}>
            Click below to open the file
          </div>
        </div>
      </div>

      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className={styles.btnPrimary}
        style={{ textDecoration: 'none', width: 'fit-content' }}
      >
        <ExternalLink size={13} />
        Open File
      </a>
    </div>
  )
}

function NotesPreview({ content }: { content: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div style={{
        display:    'flex',
        alignItems: 'center',
        gap:        '0.35rem',
        fontSize:   '0.73rem',
        fontWeight: 600,
        color:      '#047857',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
      }}>
        <StickyNote size={11} />
        Notes Content
      </div>
      <div style={{
        background:   '#f8fafc',
        border:       '1.5px solid #e2e8f0',
        borderRadius: 10,
        padding:      '1rem',
        fontSize:     '0.83rem',
        color:        '#2d3748',
        lineHeight:   1.7,
        whiteSpace:   'pre-wrap',
        maxHeight:    280,
        overflowY:    'auto',
      }}>
        {content}
      </div>
    </div>
  )
}

function EmptyPreview({ type }: { type: string }) {
  return (
    <div style={{
      padding:      '2rem 1rem',
      textAlign:    'center',
      color:        '#8a9ab5',
      fontSize:     '0.82rem',
      background:   '#f8fafc',
      borderRadius: 10,
      border:       '1.5px dashed #e2e8f0',
    }}>
      No preview available for this {type} material.
    </div>
  )
}

// ── Main Modal ────────────────────────────────────────────────────────────────

export function PreviewModal({ item, onClose, onEdit }: Props) {
  if (!item) {return null}

  const accentColor = TYPE_ICON_BG[item.type]

  const handleEdit = () => {
    onClose()
    onEdit(item)
  }

  return (
    <AnimatePresence>
      <motion.div
        className={styles.modalOverlay}
        variants={overlayVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={(e) => { if (e.target === e.currentTarget) {onClose()} }}
      >
        <motion.div
          className={styles.modal}
          style={{ maxWidth: 640 }}
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Accent bar */}
          <div style={{
            height:       4,
            background:   accentColor,
            borderRadius: '16px 16px 0 0',
            flexShrink:   0,
          }} />

          {/* Header */}
          <div className={styles.modalHeader}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{
                display:     'flex',
                alignItems:  'center',
                gap:         '0.4rem',
                marginBottom: 6,
                flexWrap:    'wrap',
              }}>
                <TypeBadge type={item.type} />
                {item.program && (
                  <span className={styles.programBadge}>{item.program.code}</span>
                )}
                <span style={{ fontSize: '0.72rem', color: '#8a9ab5', marginLeft: 'auto' }}>
                  {formatDate(item.created_at)}
                </span>
              </div>
              <h2 className={styles.modalTitle}>{item.title}</h2>
              {item.description && (
                <p className={styles.modalSubtitle}>{item.description}</p>
              )}
            </div>
            <button
              className={styles.btnIconClose}
              onClick={onClose}
              aria-label={`Close preview of ${item.title}`}
            >
              <X size={13} />
            </button>
          </div>

          {/* Body */}
          <div className={styles.modalBody}>
            {item.type === 'video' && (
              item.file_url
                ? <VideoPreview url={item.file_url} title={item.title} />
                : <EmptyPreview type={typeLabel(item.type)} />
            )}

            {item.type === 'document' && (
              item.file_url
                ? <DocumentPreview url={item.file_url} title={item.title} />
                : <EmptyPreview type={typeLabel(item.type)} />
            )}

            {item.type === 'notes' && (
              item.notes_content
                ? <NotesPreview content={item.notes_content} />
                : <EmptyPreview type={typeLabel(item.type)} />
            )}

            {/* Publish status chip */}
            <div style={{
              display:      'flex',
              alignItems:   'center',
              gap:          '0.4rem',
              fontSize:     '0.75rem',
              fontWeight:   500,
              color:        item.is_published ? '#047857' : '#64748b',
            }}>
              <span style={{
                width:        7,
                height:       7,
                borderRadius: '50%',
                background:   item.is_published ? '#059669' : '#94a3b8',
                display:      'inline-block',
                flexShrink:   0,
              }} />
              {item.is_published ? 'Published — visible to students' : 'Draft — not yet visible'}
            </div>
          </div>

          {/* Footer */}
          <div className={styles.modalFooter}>
            <button className={styles.btnSecondary} onClick={onClose}>
              Close
            </button>
            <motion.button
              className={styles.btnPrimary}
              variants={buttonVariants}
              initial="idle"
              whileHover="hover"
              whileTap="tap"
              onClick={handleEdit}
              aria-label={`Edit ${typeLabel(item.type)}: ${item.title}`}
            >
              <Edit2 size={13} />
              Edit Material
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}