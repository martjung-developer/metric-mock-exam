// components/dashboard/admin/study-materials/MaterialTable.tsx
'use client'

import { memo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen, Eye, EyeOff, Edit2, Trash2, CheckCircle,
} from 'lucide-react'
import type { StudyMaterial } from '@/lib/types/admin/study-materials/study-materials'
import { TypeBadge, TypeIconDisplay } from './TypeBadge'
import { TYPE_ICON_BG, formatDate } from '@/lib/utils/admin/study-materials/display'
import styles from '@/app/(dashboard)/admin/study-materials/study-materials.module.css'
import { tableRowVariants } from '@/animations/admin/study-materials/study-materials'

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className={styles.skeletonRow} aria-hidden="true">
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div className={styles.skeleton} style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <div className={styles.skeleton} style={{ width: 160, height: 13 }} />
            <div className={styles.skeleton} style={{ width: 100, height: 11 }} />
          </div>
        </div>
      </td>
      <td><div className={styles.skeleton} style={{ width: 70, height: 22, borderRadius: 20 }} /></td>
      <td><div className={styles.skeleton} style={{ width: 60, height: 22, borderRadius: 6 }} /></td>
      <td><div className={styles.skeleton} style={{ width: 80, height: 12 }} /></td>
      <td><div className={styles.skeleton} style={{ width: 65, height: 12 }} /></td>
      <td>
        <div style={{ display: 'flex', gap: 4 }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={styles.skeleton} style={{ width: 28, height: 28, borderRadius: 7 }} />
          ))}
        </div>
      </td>
    </tr>
  )
}

// ── Row ───────────────────────────────────────────────────────────────────────

interface RowProps {
  mat:             StudyMaterial
  onPreview:       (mat: StudyMaterial) => void
  onEdit:          (mat: StudyMaterial) => void
  onDelete:        (mat: StudyMaterial) => void
  onTogglePublish: (mat: StudyMaterial) => void
}

// memo prevents re-rendering unchanged rows when siblings update
const MaterialRow = memo(function MaterialRow({
  mat, onPreview, onEdit, onDelete, onTogglePublish,
}: RowProps) {
  const handlePreview       = useCallback(() => onPreview(mat),       [mat, onPreview])
  const handleEdit          = useCallback(() => onEdit(mat),          [mat, onEdit])
  const handleDelete        = useCallback(() => onDelete(mat),        [mat, onDelete])
  const handleTogglePublish = useCallback(() => onTogglePublish(mat), [mat, onTogglePublish])

  return (
    <motion.tr
      className={styles.tableRow}
      variants={tableRowVariants}
      layout
    >
      {/* Title + description */}
      <td>
        <div className={styles.matTitleCell}>
          <div
            className={styles.matIconWrap}
            style={{ background: TYPE_ICON_BG[mat.type] }}
            aria-hidden="true"
          >
            <TypeIconDisplay type={mat.type} size={14} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div className={styles.matTitle}>{mat.title}</div>
            {mat.description && (
              <div className={styles.matDesc} title={mat.description}>
                {mat.description}
              </div>
            )}
          </div>
        </div>
      </td>

      {/* Type badge */}
      <td>
        <TypeBadge type={mat.type} />
      </td>

      {/* Program */}
      <td>
        {mat.program
          ? <span className={styles.programBadge}>{mat.program.code}</span>
          : <span style={{ color: '#8a9ab5', fontSize: '0.77rem' }}>—</span>
        }
      </td>

      {/* Date */}
      <td style={{ color: '#7a8fa8', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
        {formatDate(mat.created_at)}
      </td>

      {/* Publish status */}
      <td>
        <div className={styles.pubStatus}>
          <span
            className={styles.pubDot}
            style={{ background: mat.is_published ? '#059669' : '#8a9ab5' }}
          />
          {mat.is_published ? 'Published' : 'Draft'}
        </div>
      </td>

      {/* Actions */}
      <td>
        <div className={styles.actionGroup} role="group" aria-label={`Actions for ${mat.title}`}>
          <button
            className={styles.btnIconSm}
            title="Preview"
            aria-label={`Preview ${mat.title}`}
            onClick={handlePreview}
          >
            <Eye size={13} />
          </button>

          <button
            className={styles.btnIconSm}
            title={mat.is_published ? 'Unpublish' : 'Publish'}
            aria-label={mat.is_published ? `Unpublish ${mat.title}` : `Publish ${mat.title}`}
            onClick={handleTogglePublish}
          >
            {mat.is_published
              ? <EyeOff      size={13} />
              : <CheckCircle size={13} />
            }
          </button>

          <button
            className={styles.btnIconSm}
            title="Edit"
            aria-label={`Edit ${mat.title}`}
            onClick={handleEdit}
          >
            <Edit2 size={13} />
          </button>

          <button
            className={`${styles.btnIconSm} ${styles.danger}`}
            title="Delete"
            aria-label={`Delete ${mat.title}`}
            onClick={handleDelete}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </td>
    </motion.tr>
  )
})

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <tr>
      <td colSpan={6}>
        <div className={styles.emptyState} role="status">
          <div className={styles.emptyIcon} aria-hidden="true">
            <BookOpen size={20} color="#8a9ab5" />
          </div>
          <p className={styles.emptyTitle}>No materials found</p>
          <p className={styles.emptySub}>
            Try adjusting your filters or add a new material.
          </p>
        </div>
      </td>
    </tr>
  )
}

// ── Table ─────────────────────────────────────────────────────────────────────

interface Props {
  materials:       StudyMaterial[]
  loading:         boolean
  onPreview:       (mat: StudyMaterial) => void
  onEdit:          (mat: StudyMaterial) => void
  onDelete:        (mat: StudyMaterial) => void
  onTogglePublish: (mat: StudyMaterial) => void
}

export function MaterialTable({
  materials, loading, onPreview, onEdit, onDelete, onTogglePublish,
}: Props) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table} aria-label="Study materials">
        <thead>
          <tr>
            <th scope="col">Title</th>
            <th scope="col">Type</th>
            <th scope="col">Program</th>
            <th scope="col">Date Added</th>
            <th scope="col">Status</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>

        <tbody>
          {loading ? (
            // Skeleton rows while fetching
            Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
          ) : materials.length === 0 ? (
            <EmptyState />
          ) : (
            <AnimatePresence initial={false} mode="popLayout">
              {materials.map((mat) => (
                <MaterialRow
                  key={mat.id}
                  mat={mat}
                  onPreview={onPreview}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onTogglePublish={onTogglePublish}
                />
              ))}
            </AnimatePresence>
          )}
        </tbody>
      </table>
    </div>
  )
}