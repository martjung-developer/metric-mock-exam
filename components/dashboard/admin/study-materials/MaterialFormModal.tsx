// components/dashboard/admin/study-materials/MaterialFormModal.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Create / Edit modal for study materials.
//
// FIX: onPatch signature changed to key-value style to match useStudyForm.
// FIX: CSS class names corrected (inputError → formError classes inline,
//      dropZone → uploadZone, dropZoneActive → uploadZoneActive).
// FIX: form.youtube_url used for video type (was referencing wrong field).
// ─────────────────────────────────────────────────────────────────────────────

'use client'

import React, { type RefObject, type DragEvent } from 'react'
import { X, Upload, ExternalLink, Video, Link } from 'lucide-react'
import { motion, AnimatePresence }               from 'framer-motion'
import type {
  StudyMaterialFormErrors,
  ProgramOption,
  LinkType,
  MaterialType,
} from '@/lib/types/admin/study-materials/study-materials'
import type { RawFormState } from '@/lib/utils/admin/study-materials/validators'
import styles from '@/app/(dashboard)/admin/study-materials/study-materials.module.css'
import {
  overlayVariants,
  modalVariants,
} from '@/animations/admin/study-materials/study-materials'

// ── Link-type options ─────────────────────────────────────────────────────────

const LINK_TYPE_OPTIONS: Array<{ value: LinkType | ''; label: string }> = [
  { value: '',        label: 'Select type…' },
  { value: 'video',   label: 'Video (YouTube / Vimeo)' },
  { value: 'meeting', label: 'Live Session (Meet / Zoom)' },
  { value: 'drive',   label: 'Google Drive' },
  { value: 'other',   label: 'Other External Link' },
]

// ── Props ─────────────────────────────────────────────────────────────────────
// onPatch uses key-value style so the component can call:
//   onPatch('title', 'My Title')
// This matches the patchForm signature in useStudyForm.

interface MaterialFormModalProps {
  open:            boolean
  isEditing:       boolean
  form:            RawFormState          // canonical form state
  errors:          StudyMaterialFormErrors
  file:            File | null
  submitting:      boolean
  dragOver:        boolean
  programs:        ProgramOption[]
  existingFileUrl: string | null
  fileInputRef:    RefObject<HTMLInputElement | null>
  onClose:         () => void
  onPatch:         <K extends keyof RawFormState>(field: K, value: RawFormState[K]) => void
  onSetFile:       (file: File | null) => void
  onDragOver:      (over: boolean) => void
  onDrop:          (e: DragEvent<HTMLDivElement>) => void
  onSubmit:        () => Promise<void>
}

// ── Component ─────────────────────────────────────────────────────────────────

export function MaterialFormModal({
  open, isEditing, form, errors, file, submitting, dragOver,
  programs, existingFileUrl, fileInputRef,
  onClose, onPatch, onSetFile, onDragOver, onDrop, onSubmit,
}: MaterialFormModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={styles.modalOverlay}
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={(e) => { if (e.target === e.currentTarget) { onClose() } }}
        >
          <motion.div
            className={styles.modal}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* ── Header ── */}
            <div className={styles.modalHeader}>
              <div>
                <h2 className={styles.modalTitle}>
                  {isEditing ? 'Edit Material' : 'Add Study Material'}
                </h2>
                <p className={styles.modalSubtitle}>
                  {isEditing
                    ? 'Update the details below and save.'
                    : 'Fill in the details to add a new material.'}
                </p>
              </div>
              <button
                className={styles.btnIconClose}
                onClick={onClose}
                aria-label="Close form"
              >
                <X size={13} />
              </button>
            </div>

            {/* ── Body ── */}
            <div className={styles.modalBody}>

              {/* Title */}
              <div className={styles.formField}>
                <label className={styles.formLabel}>
                  Title <span>*</span>
                </label>
                <input
                  className={`${styles.formInput} ${errors.title ? styles.error : ''}`}
                  value={form.title}
                  onChange={(e) => { onPatch('title', e.target.value) }}
                  placeholder="Material title…"
                />
                {errors.title && (
                  <p className={styles.formError}>{errors.title}</p>
                )}
              </div>

              {/* Description */}
              <div className={styles.formField}>
                <label className={styles.formLabel}>Description</label>
                <textarea
                  className={styles.formTextarea}
                  rows={2}
                  value={form.description}
                  onChange={(e) => { onPatch('description', e.target.value) }}
                  placeholder="Optional description…"
                />
              </div>

              {/* Type + Program */}
              <div className={styles.formGrid}>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Type</label>
                  <select
                    className={styles.formSelect}
                    value={form.type}
                    onChange={(e) => {
                      onPatch('type', e.target.value as MaterialType)
                    }}
                  >
                    <option value="document">Document</option>
                    <option value="video">Video</option>
                    <option value="notes">Notes</option>
                  </select>
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Program</label>
                  <select
                    className={styles.formSelect}
                    value={form.program_id}
                    onChange={(e) => { onPatch('program_id', e.target.value) }}
                  >
                    <option value="">— No program —</option>
                    {programs.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} — {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Category */}
              <div className={styles.formField}>
                <label className={styles.formLabel}>Category</label>
                <input
                  className={styles.formInput}
                  value={form.category}
                  onChange={(e) => { onPatch('category', e.target.value) }}
                  placeholder="e.g. Pharmacology, Board Review…"
                />
              </div>

              {/* ── Video: YouTube URL ── */}
              {form.type === 'video' && (
                <div className={styles.formField}>
                  <label className={styles.formLabel}>
                    YouTube URL <span>*</span>
                  </label>
                  <input
                    className={`${styles.formInput} ${errors.youtube_url ? styles.error : ''}`}
                    type="url"
                    value={form.youtube_url}
                    onChange={(e) => { onPatch('youtube_url', e.target.value) }}
                    placeholder="https://www.youtube.com/watch?v=…"
                  />
                  {errors.youtube_url && (
                    <p className={styles.formError}>{errors.youtube_url}</p>
                  )}
                  <p className={styles.formHint}>
                    Supports youtube.com/watch, youtu.be, and /embed/ links.
                  </p>
                </div>
              )}

              {/* ── Document: file upload ── */}
              {form.type === 'document' && (
                <div className={styles.formField}>
                  <label className={styles.formLabel}>
                    File Upload
                    <span style={{ color: '#8a9ab5', fontWeight: 400, marginLeft: 6 }}>
                      (optional if external URL is provided)
                    </span>
                  </label>
                  <div
                    className={`${styles.uploadZone} ${dragOver ? styles.uploadZoneActive : ''}`}
                    onDragOver={(e) => { e.preventDefault(); onDragOver(true) }}
                    onDragLeave={() => { onDragOver(false) }}
                    onDrop={onDrop}
                    onClick={() => { fileInputRef.current?.click() }}
                    role="button"
                    tabIndex={0}
                    aria-label="Upload file"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        fileInputRef.current?.click()
                      }
                    }}
                  >
                    <Upload size={20} color="#8a9ab5" />
                    {file ? (
                      <p className={styles.uploadZoneTitle} style={{ color: '#1d4ed8' }}>
                        {file.name}
                      </p>
                    ) : existingFileUrl ? (
                      <p className={styles.uploadZoneTitle} style={{ color: '#059669' }}>
                        File uploaded — drop a new one to replace
                      </p>
                    ) : (
                      <>
                        <p className={styles.uploadZoneTitle}>
                          Drag &amp; drop or click to select
                        </p>
                        <p className={styles.uploadZoneSub}>PDF, DOCX, PPTX, etc.</p>
                      </>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) { onSetFile(f) }
                      }}
                    />
                  </div>
                  {errors.file && (
                    <p className={styles.formError}>{errors.file}</p>
                  )}
                </div>
              )}

              {/* ── Notes: text content ── */}
              {form.type === 'notes' && (
                <div className={styles.formField}>
                  <label className={styles.formLabel}>
                    Notes Content <span>*</span>
                  </label>
                  <textarea
                    className={`${styles.formTextarea} ${errors.notes_content ? styles.error : ''}`}
                    rows={6}
                    value={form.notes_content}
                    onChange={(e) => { onPatch('notes_content', e.target.value) }}
                    placeholder="Write your notes here…"
                  />
                  {errors.notes_content && (
                    <p className={styles.formError}>{errors.notes_content}</p>
                  )}
                </div>
              )}

              {/* ── External Resources ── */}
              <div style={{
                borderTop:  '1.5px solid #e4e9f0',
                paddingTop: '1rem',
                marginTop:  '0.25rem',
                display:    'flex',
                flexDirection: 'column',
                gap:        '0.75rem',
              }}>
                <p style={{
                  fontSize:      '0.72rem',
                  fontWeight:    700,
                  color:         '#8a9ab5',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  margin:        0,
                }}>
                  External Resources (optional)
                </p>

                {/* external_url */}
                <div className={styles.formField}>
                  <label className={styles.formLabel}>
                    <ExternalLink
                      size={11}
                      style={{ marginRight: 4, verticalAlign: 'middle' }}
                    />
                    External URL
                  </label>
                  <input
                    className={`${styles.formInput} ${errors.external_url ? styles.error : ''}`}
                    type="url"
                    value={form.external_url}
                    onChange={(e) => { onPatch('external_url', e.target.value) }}
                    placeholder="https://drive.google.com/… or https://youtube.com/…"
                  />
                  {errors.external_url && (
                    <p className={styles.formError}>{errors.external_url}</p>
                  )}
                </div>

                {/* link_type + meeting_url */}
                <div className={styles.formGrid}>
                  <div className={styles.formField}>
                    <label className={styles.formLabel}>
                      <Link size={11} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                      Link Type
                    </label>
                    <select
                      className={styles.formSelect}
                      value={form.link_type}
                      onChange={(e) => {
                        onPatch('link_type', e.target.value as LinkType | '')
                      }}
                    >
                      {LINK_TYPE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formField}>
                    <label className={styles.formLabel}>
                      <Video size={11} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                      Meeting URL
                    </label>
                    <input
                      className={styles.formInput}
                      type="url"
                      value={form.meeting_url}
                      onChange={(e) => { onPatch('meeting_url', e.target.value) }}
                      placeholder="https://meet.google.com/…"
                    />
                  </div>
                </div>
              </div>

              {/* ── Publish toggle ── */}
              <div className={styles.toggleRow}>
                <div>
                  <div className={styles.toggleLabel}>Published</div>
                  <div className={styles.toggleSub}>Visible to students when published</div>
                </div>
                <label className={styles.toggle}>
                  <input
                    type="checkbox"
                    checked={form.is_published}
                    onChange={(e) => { onPatch('is_published', e.target.checked) }}
                  />
                  <span className={styles.toggleSlider} />
                </label>
              </div>

            </div>

            {/* ── Footer ── */}
            <div className={styles.modalFooter}>
              <button
                className={styles.btnSecondary}
                onClick={onClose}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                className={styles.btnPrimary}
                onClick={() => { void onSubmit() }}
                disabled={submitting}
              >
                {submitting
                  ? 'Saving…'
                  : isEditing ? 'Save Changes' : 'Create Material'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
