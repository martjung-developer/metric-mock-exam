// components/dashboard/admin/questionnaires/QuestionFormModal.tsx
'use client'
// ─────────────────────────────────────────────────────────────────────────────
// Create / Edit Question modal — pure UI, all state from useQuestionnaires.
// CHANGES FROM PREVIOUS VERSION:
//   FIX: Remove/Replace previously only cleared/overwrote `image_url` in form
//   state, leaving the old file permanently orphaned in Supabase Storage.
//   Both actions now also delete the previous file from the bucket. The
//   storage path is extracted from the public URL rather than tracked
//   separately, since getPublicUrl's output is deterministic:
//   {base}/storage/v1/object/public/{bucket}/{path}
// ─────────────────────────────────────────────────────────────────────────────

import { useRef, useState } from 'react'
import Image from 'next/image'
import {
  Plus, Pencil, X, CheckCircle2, AlertTriangle,
  Loader2, ChevronDown, BookOpen, Image as ImageIcon, Upload,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

import { TYPE_ORDER, IMAGE_BUCKET, ACCEPTED_IMAGE_TYPES } from '@/lib/constants/admin/questionnaires/questionnaires.constants'
import { modalVariants }            from '@/animations/admin/questionnaires/questionnaires'
import { createClient }             from '@/lib/supabase/client'
import type { QuestionType }        from '@/lib/types/database'
import type { UseQuestionnairesReturn } from '@/lib/hooks/admin/questionnaires/useQuestionnaires'
import styles                       from '@/app/(dashboard)/admin/questionnaires/questionnaires.module.css'

type Q = UseQuestionnairesReturn

interface QuestionFormModalProps {
  q: Q
}

// ── ADDED — extract the storage path from a Supabase public URL, so we can
// call .remove() on it. Returns null if the URL doesn't match the expected
// public-object shape (e.g. it's an external URL, not one of ours).
function extractStoragePath(publicUrl: string, bucket: string): string | null {
  const marker = `/storage/v1/object/public/${bucket}/`
  const idx = publicUrl.indexOf(marker)
  if (idx === -1) { return null }
  return publicUrl.slice(idx + marker.length)
}

export function QuestionFormModal({ q }: QuestionFormModalProps) {
  const isCreate = q.formMode === 'create'
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [uploadSuccess, setUploadSuccess] = useState('')

  // ── ADDED — best-effort delete of a previous file; never blocks the UI on
  // failure (e.g. file already gone, network hiccup) since the field update
  // matters more than storage hygiene in the moment.
  async function deleteStorageFile(publicUrl: string): Promise<void> {
    const path = extractStoragePath(publicUrl, IMAGE_BUCKET)
    if (!path) { return }
    try {
      await supabase.storage.from(IMAGE_BUCKET).remove([path])
    } catch {
      // Non-fatal — orphaned file, but the question's image_url is still correct.
    }
  }

  async function handleImageSelect(file: File): Promise<void> {
    setUploadError('')
    setUploadSuccess('')
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image must be under 5MB.')
      return
    }

    setUploading(true)
    const previousImageUrl = q.form.image_url   // ── ADDED — capture before overwrite
    let uploadedImageUrl = ''
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const programSegment = q.form.program_id
        ? (q.programs.find((p) => p.id === q.form.program_id)?.code ?? 'general')
        : 'general'
      const examSegment = q.form.exam_id || 'unassigned'
      const path = `${programSegment}/exams/${examSegment}/${crypto.randomUUID()}-${safeName}`

      const { error: uploadErr } = await supabase.storage
        .from(IMAGE_BUCKET)
        .upload(path, file, { cacheControl: '3600', upsert: false })

      if (uploadErr) {
        throw new Error(uploadErr.message)
      }

      const { data: publicUrlData } = supabase.storage
        .from(IMAGE_BUCKET)
        .getPublicUrl(path)

      uploadedImageUrl = publicUrlData.publicUrl
      await q.attachImageToCurrentQuestion(uploadedImageUrl)
      setUploadSuccess('Image attached successfully.')

      // ── ADDED — clean up the file this one replaced (Replace flow), only
      // after the new upload succeeded so we never end up with zero images
      // if the new upload fails.
      if (previousImageUrl.trim()) {
        void deleteStorageFile(previousImageUrl)
      }
    } catch (err) {
      if (uploadedImageUrl) {
        void deleteStorageFile(uploadedImageUrl)
      }
      setUploadError(err instanceof Error ? err.message : 'Image upload failed.')
    } finally {
      setUploading(false)
    }
  }

  // ── ADDED — Remove button handler: deletes the file from storage, then
  // clears the field. Wrapped so the button can show a brief pending state.
  async function handleRemoveImage(): Promise<void> {
    const currentUrl = q.form.image_url
    if (!currentUrl.trim()) { return }

    setUploading(true)
    setUploadError('')
    setUploadSuccess('')
    try {
      await deleteStorageFile(currentUrl)
      q.setField('image_url', '')
      setUploadSuccess('Image removed.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <AnimatePresence>
      {q.showForm && (
        <motion.div
          className={styles.modalOverlay}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => { if (e.target === e.currentTarget) {q.closeForm()} }}
        >
          <motion.div
            className={styles.formModal}
            variants={modalVariants} initial="hidden" animate="visible" exit="exit"
          >
            {/* ── Header ── */}
            <div className={styles.formModalHeader}>
              <span className={styles.formModalTitle}>
                <span className={styles.formModalTitleIcon}>
                  {isCreate ? <Plus size={14} color="#fff" /> : <Pencil size={13} color="#fff" />}
                </span>
                {isCreate ? 'Add Question' : 'Edit Question'}
              </span>
              <button className={styles.btnIconClose} onClick={q.closeForm}><X size={14} /></button>
            </div>

            <div className={styles.form}>

              {/* ── Question text ── */}
              <div className={styles.formGroupFull}>
                <label className={`${styles.formLabel} ${styles.formLabelRequired}`}>Question Text</label>
                <textarea
                  className={styles.formTextarea}
                  placeholder="Enter the full question here…"
                  rows={3}
                  value={q.form.question_text}
                  onChange={(e) => q.setField('question_text', e.target.value)}
                />
              </div>

              {/* ── Program + Exam ── */}
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={`${styles.formLabel} ${styles.formLabelRequired}`}>Degree Program</label>
                  <div className={styles.selectWrap}>
                    <select
                      className={styles.formSelect}
                      value={q.form.program_id}
                      onChange={(e) => q.setField('program_id', e.target.value)}
                    >
                      <option value="">— Select program —</option>
                      {q.programs.map((p) => (
                        <option key={p.id} value={p.id}>{p.code} — {p.name}</option>
                      ))}
                    </select>
                    <ChevronDown size={13} className={styles.selectChevron} />
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label className={`${styles.formLabel} ${styles.formLabelRequired}`}>Assign to Exam</label>
                  <div className={styles.selectWrap}>
                    <select
                      className={styles.formSelect}
                      value={q.form.exam_id}
                      onChange={(e) => q.setField('exam_id', e.target.value)}
                      disabled={!q.form.program_id}
                    >
                      <option value="">
                        {q.form.program_id ? '— Select exam —' : '— Select program first —'}
                      </option>
                      {q.examsForForm.map((ex) => (
                        <option key={ex.id} value={ex.id}>{ex.title}</option>
                      ))}
                    </select>
                    <ChevronDown size={13} className={styles.selectChevron} />
                  </div>
                </div>
              </div>

              {/* ── Type + Difficulty + Points ── */}
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={`${styles.formLabel} ${styles.formLabelRequired}`}>Question Type</label>
                  <div className={styles.selectWrap}>
                    <select
                      className={styles.formSelect}
                      value={q.form.question_type}
                      onChange={(e) => {
                        q.setField('question_type', e.target.value as QuestionType)
                        q.setField('correct_answer', '')
                      }}
                    >
                      {TYPE_ORDER.map((t) => (
                        <option key={t} value={t}>
                          {t.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={13} className={styles.selectChevron} />
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Difficulty</label>
                  <div className={styles.selectWrap}>
                    <select
                      className={styles.formSelect}
                      value={q.form.difficulty}
                      onChange={(e) => q.setField('difficulty', e.target.value as 'easy' | 'medium' | 'hard')}
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                    <ChevronDown size={13} className={styles.selectChevron} />
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Points</label>
                  <input
                    className={styles.formInput}
                    type="number"
                    min={1}
                    value={q.form.points}
                    onChange={(e) => q.setField('points', Number(e.target.value))}
                  />
                </div>
              </div>

              {/* ── MCQ choices ── */}
              {q.form.question_type === 'multiple_choice' && (
                <div className={styles.formGroupFull}>
                  <label className={`${styles.formLabel} ${styles.formLabelRequired}`}>
                    Answer Choices
                    <span className={styles.choicesHint}>&nbsp;— click ✓ to mark correct</span>
                  </label>
                  <div className={styles.choicesSection}>
                    {q.form.choices.map((choice, idx) => (
                      <div key={choice.label} className={styles.choiceRow}>
                        <span className={styles.choiceLabel}>{choice.label}</span>
                        <input
                          className={styles.choiceInput}
                          placeholder={`Choice ${choice.label}`}
                          value={choice.text}
                          onChange={(e) => q.setChoiceText(idx, e.target.value)}
                        />
                        <button
                          type="button"
                          className={`${styles.choiceCorrectBtn} ${
                            q.form.correct_answer === choice.label ? styles.choiceCorrectActive : ''
                          }`}
                          onClick={() => q.setField('correct_answer', choice.label)}
                        >
                          <CheckCircle2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── True/False ── */}
              {q.form.question_type === 'true_false' && (
                <div className={styles.formGroupFull}>
                  <label className={`${styles.formLabel} ${styles.formLabelRequired}`}>Correct Answer</label>
                  <div className={styles.selectWrap}>
                    <select
                      className={styles.formSelect}
                      value={q.form.correct_answer}
                      onChange={(e) => q.setField('correct_answer', e.target.value)}
                    >
                      <option value="">— Select —</option>
                      <option value="true">True</option>
                      <option value="false">False</option>
                    </select>
                    <ChevronDown size={13} className={styles.selectChevron} />
                  </div>
                </div>
              )}

              {/* ── Short / Fill / Matching ── */}
              {(['short_answer', 'fill_blank', 'matching'] as QuestionType[]).includes(q.form.question_type) && (
                <div className={styles.formGroupFull}>
                  <label className={styles.formLabel}>Correct Answer</label>
                  <input
                    className={styles.formInput}
                    placeholder={
                      q.form.question_type === 'matching'
                        ? 'e.g. 1-C, 2-A, 3-B'
                        : 'Enter the expected answer'
                    }
                    value={q.form.correct_answer}
                    onChange={(e) => q.setField('correct_answer', e.target.value)}
                  />
                </div>
              )}

              {/* ── Explanation ── */}
              <div className={styles.formGroupFull}>
                <label className={styles.formLabel}>Explanation (optional)</label>
                <textarea
                  className={styles.formTextarea}
                  placeholder="Provide an explanation…"
                  rows={2}
                  value={q.form.explanation}
                  onChange={(e) => q.setField('explanation', e.target.value)}
                />
              </div>

              {/* ── Scenario ── */}
              <div className={styles.formGroupFull}>
                <label className={styles.formLabel}>
                  <BookOpen size={12} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }} />
                  Scenario / Reading passage
                  <span style={{ marginLeft: 6, fontSize: '0.7rem', fontWeight: 400, color: '#94a3b8' }}>
                    optional — shown above the question during exams
                  </span>
                </label>
                <textarea
                  className={styles.formTextarea}
                  placeholder="Paste the scenario, case study, or reading passage here…"
                  rows={3}
                  value={q.form.scenario}
                  onChange={(e) => q.setField('scenario', e.target.value)}
                />
              </div>

              {/* ── Image ── */}
              <div className={styles.formGroupFull}>
                <label className={styles.formLabel}>
                  <ImageIcon size={12} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }} />
                  Image
                  <span style={{ marginLeft: 6, fontSize: '0.7rem', fontWeight: 400, color: '#94a3b8' }}>
                    optional — use only where a visual is genuinely needed (diagrams, graphs, figures)
                  </span>
                </label>

                {q.form.image_url ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <Image
                      src={q.form.image_url}
                      alt="Question visual preview"
                      width={800}
                      height={220}
                      style={{
                        maxWidth: '100%', maxHeight: 220, borderRadius: 8,
                        border: '1px solid #e2e8f0', objectFit: 'contain',
                      }}
                    />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        type="button"
                        className={styles.btnSecondary}
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                      >
                        {uploading
                          ? <Loader2 size={13} className={styles.spinner} />
                          : <Upload size={13} />}
                        Replace
                      </button>
                      <button
                        type="button"
                        className={styles.btnSecondary}
                        onClick={() => void handleRemoveImage()}
                        disabled={uploading}
                      >
                        {uploading
                          ? <Loader2 size={13} className={styles.spinner} />
                          : <X size={13} />}
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    className={styles.btnSecondary}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading
                      ? <Loader2 size={14} className={styles.spinner} />
                      : <Upload size={14} />}
                    {uploading ? 'Uploading…' : 'Upload Image'}
                  </button>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_IMAGE_TYPES}
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) { void handleImageSelect(file) }
                    e.target.value = ''
                  }}
                />

                {uploadError && (
                  <p className={styles.formError} style={{ marginTop: 6 }}>
                    <AlertTriangle size={13} /> {uploadError}
                  </p>
                )}
                {uploadSuccess && (
                  <p className={styles.formError} style={{ marginTop: 6, background: '#f0fdf4', borderColor: '#bbf7d0', color: '#047857' }}>
                    <CheckCircle2 size={13} /> {uploadSuccess}
                  </p>
                )}
              </div>

              {q.formError && (
                <p className={styles.formError}>
                  <AlertTriangle size={13} /> {q.formError}
                </p>
              )}
            </div>

            {/* ── Footer ── */}
            <div className={styles.formModalFooter}>
              <button className={styles.btnSecondary} onClick={q.closeForm}>
                <X size={13} /> Cancel
              </button>
              <button
                className={styles.btnPrimary}
                onClick={() => void q.handleSave()}
                disabled={q.saving || uploading}
              >
                {q.saving
                  ? <Loader2 size={14} className={styles.spinner} />
                  : isCreate ? <Plus size={14} /> : <Pencil size={14} />}
                {q.saving ? 'Saving…' : isCreate ? 'Add Question' : 'Save Changes'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
