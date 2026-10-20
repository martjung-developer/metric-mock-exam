// components/dashboard/admin/exams/questions/QuestionModal.tsx
// Pure UI — fully controlled form modal.
// Receives all state + handlers from useQuestionForm via props.

import { AlertCircle, CheckCircle2, ImageIcon, Loader2, Pencil, Plus, Save, Trash2, Upload, X } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import type {
  QuestionForm,
  QuestionOption,
  QuestionType,
} from '@/lib/types/admin/exams/questions/questions.types'
import { GROUP_ORDER, TYPE_META } from '@/lib/utils/admin/questions/helpers'
import s from '@/app/(dashboard)/admin/exams/[examId]/questions/questions.module.css'
import type { JSX } from 'react/jsx-dev-runtime'

interface QuestionModalProps {
  examId:    string
  isEditing: boolean
  form:      QuestionForm
  formError: string | null
  saving:    boolean

  onClose:          () => void
  onSave:           () => void
  onTypeChange:     (t: QuestionType)              => void
  onTextChange:     (v: string)                    => void
  onPointsChange:   (v: number)                    => void
  onExplChange:     (v: string)                    => void
  onAnswerChange:   (v: string)                    => void
  onImageFile:      (file: File)                   => void
  onImageRemove:    ()                             => void
  imageUploading:   boolean
  imageUploadError: string | null
  onOptionText:     (index: number, text: string)  => void
  onAddOption:      ()                             => void
  onRemoveOption:   (index: number)                => void
}

export function QuestionModal({
  examId,
  isEditing,
  form,
  formError,
  saving,
  onClose,
  onSave,
  onTypeChange,
  onTextChange,
  onPointsChange,
  onExplChange,
  onAnswerChange,
  onImageFile,
  onImageRemove,
  imageUploading,
  imageUploadError,
  onOptionText,
  onAddOption,
  onRemoveOption,
}: QuestionModalProps): JSX.Element {
  const isManualType =
    form.question_type === 'essay' ||
    form.question_type === 'short_answer' ||
    form.question_type === 'matching'

  return (
    <div
      className={s.modalOverlay}
      onClick={(e) => { if (e.target === e.currentTarget) {onClose()} }}
    >
      <div className={s.modal}>
        {/* ── Header ── */}
        <div className={s.modalHeader}>
          <div className={s.modalHeaderLeft}>
            <div className={s.modalHeaderIcon}>
              <AlertCircle size={16} color="#fff" />
            </div>
            <h2 className={s.modalTitle}>
              {isEditing ? 'Edit Question' : 'Add Question'}
            </h2>
          </div>
          <button className={s.modalClose} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className={s.modalBody}>
          {/* Form-level error */}
          {formError && (
            <div className={s.formError}>
              <AlertCircle size={13} />
              {formError}
            </div>
          )}

          {/* Type selector */}
          <div className={s.formGroup}>
            <label className={s.label}>Question Type</label>
            <div className={s.typeGrid}>
              {GROUP_ORDER.map((type: QuestionType) => {
                const meta = TYPE_META[type]
                const Icon = meta.icon
                return (
                  <button
                    key={type}
                    type="button"
                    className={`${s.typeOption} ${form.question_type === type ? s.typeOptionActive : ''} ${s[`typeOption_${meta.color}`]}`}
                    onClick={() => onTypeChange(type)}
                  >
                    <Icon size={13} />
                    <span>{meta.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Question text */}
          <div className={s.formGroup}>
            <label className={s.label}>
              Question Text <span className={s.required}>*</span>
            </label>
            <textarea
              className={s.textarea}
              rows={3}
              placeholder="Enter the question…"
              value={form.question_text}
              onChange={(e) => onTextChange(e.target.value)}
            />
          </div>

          {/* Points */}
          <div className={s.formRow}>
            <div className={s.formGroup}>
              <label className={s.label}>
                Points <span className={s.required}>*</span>
              </label>
              <input
                type="number"
                className={s.input}
                min={1}
                max={100}
                value={form.points}
                onChange={(e) => onPointsChange(Number(e.target.value))}
              />
            </div>
          </div>

          {/* ── MCQ options ── */}
          <div className={s.formGroup}>
            <label className={s.label}>
              Question Image <span className={s.optional}>(optional)</span>
            </label>
            {form.image_url ? (
              <div className={s.imagePreviewWrap}>
                <Image className={s.imagePreview} src={form.image_url} alt="Question image preview" width={1200} height={800} unoptimized />
                <button className={s.btnSecondary} type="button" onClick={onImageRemove} disabled={saving || imageUploading}>
                  <Trash2 size={13} /> Remove
                </button>
              </div>
            ) : (
              <label className={`${s.imageUploadBox} ${imageUploading ? s.imageUploadBoxBusy : ''}`}>
                {imageUploading ? <Loader2 size={16} className={s.spinner} /> : <ImageIcon size={16} />}
                <span>{imageUploading ? 'Uploading image...' : 'Upload JPG, PNG, or WebP'}</span>
                <input
                  className={s.imageInput}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={saving || imageUploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    e.target.value = ''
                    if (file) {onImageFile(file)}
                  }}
                />
              </label>
            )}
            {form.image_url && (
              <label className={s.replaceImageBtn}>
                <Upload size={12} /> Replace image
                <input
                  className={s.imageInput}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={saving || imageUploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    e.target.value = ''
                    if (file) {onImageFile(file)}
                  }}
                />
              </label>
            )}
            {imageUploadError && <p className={s.imageUploadError}>{imageUploadError}</p>}
          </div>

          {form.question_type === 'multiple_choice' && (
            <div className={s.formGroup}>
              <label className={s.label}>
                Answer Options <span className={s.required}>*</span>
              </label>
              <div className={s.optionsList}>
                {form.options.map((opt: QuestionOption, i: number) => (
                  <div key={i} className={s.optionRow}>
                    <button
                      type="button"
                      className={`${s.optionLabel} ${form.correct_answer === opt.label ? s.optionLabelCorrect : ''}`}
                      title="Set as correct"
                      onClick={() => onAnswerChange(opt.label)}
                    >
                      {opt.label}
                    </button>
                    <input
                      className={s.optionInput}
                      placeholder={`Option ${opt.label}`}
                      value={opt.text}
                      onChange={(e) => onOptionText(i, e.target.value)}
                    />
                    {form.options.length > 2 && (
                      <button
                        className={s.optionRemove}
                        type="button"
                        onClick={() => onRemoveOption(i)}
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {form.options.length < 6 && (
                <button className={s.addOptionBtn} type="button" onClick={onAddOption}>
                  <Plus size={12} /> Add Option
                </button>
              )}
              {form.correct_answer && (
                <p className={s.correctHint}>
                  <CheckCircle2 size={12} /> Correct answer: Option {form.correct_answer}
                </p>
              )}
            </div>
          )}

          {/* ── True / False ── */}
          {form.question_type === 'true_false' && (
            <div className={s.formGroup}>
              <label className={s.label}>
                Correct Answer <span className={s.required}>*</span>
              </label>
              <div className={s.tfRow}>
                <button
                  type="button"
                  className={`${s.tfBtn} ${form.correct_answer === 'true' ? s.tfBtnActive : ''}`}
                  onClick={() => onAnswerChange('true')}
                >
                  True
                </button>
                <button
                  type="button"
                  className={`${s.tfBtn} ${form.correct_answer === 'false' ? s.tfBtnActive : ''}`}
                  onClick={() => onAnswerChange('false')}
                >
                  False
                </button>
              </div>
            </div>
          )}

          {/* ── Fill blank ── */}
          {form.question_type === 'fill_blank' && (
            <div className={s.formGroup}>
              <label className={s.label}>
                Correct Answer <span className={s.required}>*</span>
              </label>
              <input
                className={s.input}
                placeholder="Expected answer…"
                value={form.correct_answer}
                onChange={(e) => onAnswerChange(e.target.value)}
              />
            </div>
          )}

          {/* ── Manual grading notice ── */}
          {isManualType && (
            <div className={s.manualNotice}>
              <Pencil size={13} />
              <div>
                <strong>{TYPE_META[form.question_type].label}</strong>
                {' — '}{TYPE_META[form.question_type].description}
                <br />
                <span className={s.manualNoticeSub}>
                  Set scoring rubrics on the{' '}
                  <Link
                    href={`/admin/exams/${examId}/answer-key`}
                    className={s.answerKeyLink}
                    target="_blank"
                  >
                    Answer Key
                  </Link>{' '}
                  page.
                </span>
              </div>
            </div>
          )}

          {/* Explanation */}
          <div className={s.formGroup}>
            <label className={s.label}>
              Explanation <span className={s.optional}>(optional)</span>
            </label>
            <textarea
              className={s.textarea}
              rows={2}
              placeholder="Shown to students after submission…"
              value={form.explanation}
              onChange={(e) => onExplChange(e.target.value)}
            />
          </div>
        </div>

        {/* ── Footer ── */}
        <div className={s.modalFooter}>
          <button className={s.btnSecondary} onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button className={s.btnPrimary} onClick={onSave} disabled={saving}>
            {saving
              ? <><Loader2 size={13} className={s.spinner} /> Saving…</>
              : <><Save size={13} /> {isEditing ? 'Save Changes' : 'Create Question'}</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}
