// components/dashboard/admin/exams/detail/EditExamModal.tsx
// Pure UI — renders the edit exam modal. No Supabase calls, no business logic.

import React from 'react'
import { Pencil, X, Save, Loader2, ChevronDown } from 'lucide-react'
import { EXAM_TYPE_META, type ExamType } from '@/lib/types/database'
import type {
  EditForm,
  EditFormErrors,
  CategoryOption,
  ProgramOption,
} from '@/lib/types/admin/exams/detail/exam.types'
import s from '@/app/(dashboard)/admin/exams/[examId]/detail.module.css'

const EXAM_TYPES: ExamType[] = ['mock', 'practice']

interface EditExamModalProps {
  editForm:     EditForm
  editErrors:   EditFormErrors
  editSaving:   boolean
  categories:   CategoryOption[]
  programs:     ProgramOption[]
  setEditField: <K extends keyof EditForm>(field: K, value: EditForm[K]) => void
  onSave:       () => Promise<void>
  onClose:      () => void
}

export default function EditExamModal({
  editForm,
  editErrors,
  editSaving,
  categories,
  programs,
  setEditField,
  onSave,
  onClose,
}: EditExamModalProps) {
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {onClose()}
  }

  return (
    <div className={s.modalOverlay} onClick={handleOverlayClick}>
      <div className={s.editModal}>

        {/* ── Header ── */}
        <div className={s.editModalHeader}>
          <div className={s.editModalHeaderLeft}>
            <div className={s.editModalIcon}>
              <Pencil size={16} color="#fff" />
            </div>
            <div>
              <h2 className={s.editModalTitle}>Edit Exam</h2>
              <p className={s.editModalSub}>Update exam details below</p>
            </div>
          </div>
          <button className={s.editModalClose} onClick={onClose} disabled={editSaving}>
            <X size={15} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className={s.editModalBody}>

          {/* Title */}
          <div className={s.editField}>
            <label className={s.editLabel}>
              Title <span className={s.req}>*</span>
            </label>
            <input
              className={`${s.editInput} ${editErrors.title ? s.editInputError : ''}`}
              value={editForm.title}
              onChange={(e) => setEditField('title', e.target.value)}
            />
            {editErrors.title && (
              <p className={s.editFieldError}>{editErrors.title}</p>
            )}
          </div>

          {/* Description */}
          <div className={s.editField}>
            <label className={s.editLabel}>Description</label>
            <textarea
              className={s.editTextarea}
              rows={3}
              value={editForm.description}
              onChange={(e) => setEditField('description', e.target.value)}
            />
          </div>

          {/* Category + Program */}
          <div className={s.editGrid2}>
            <div className={s.editField}>
              <label className={s.editLabel}>Category</label>
              <div className={s.editSelectWrap}>
                <select
                  className={s.editSelect}
                  value={editForm.category_id}
                  onChange={(e) => setEditField('category_id', e.target.value)}
                >
                  <option value="">— No category —</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <ChevronDown size={13} className={s.editSelectChevron} />
              </div>
            </div>

            <div className={s.editField}>
              <label className={s.editLabel}>Program</label>
              <div className={s.editSelectWrap}>
                <select
                  className={s.editSelect}
                  value={editForm.program_id}
                  onChange={(e) => setEditField('program_id', e.target.value)}
                >
                  <option value="">— No program —</option>
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>{p.code} — {p.name}</option>
                  ))}
                </select>
                <ChevronDown size={13} className={s.editSelectChevron} />
              </div>
            </div>
          </div>

          {/* Exam Type */}
          <div className={s.editField}>
            <label className={s.editLabel}>Exam Type</label>
            <div className={s.editTypeTabs}>
              {EXAM_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`${s.editTypeTab} ${editForm.exam_type === t ? s.editTypeTabActive : ''}`}
                  onClick={() => setEditField('exam_type', t)}
                >
                  <span className={s.editTypeTabLabel}>{EXAM_TYPE_META[t].label}</span>
                  <span className={s.editTypeTabDesc}>{EXAM_TYPE_META[t].description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Duration + Total Points + Passing Score */}
          <div className={s.editGrid3}>
            <div className={s.editField}>
              <label className={s.editLabel}>
                Duration (min) <span className={s.req}>*</span>
              </label>
              <input
                type="number"
                min={1}
                className={`${s.editInput} ${editErrors.duration_minutes ? s.editInputError : ''}`}
                value={editForm.duration_minutes}
                onChange={(e) => setEditField('duration_minutes', e.target.value)}
              />
              {editErrors.duration_minutes && (
                <p className={s.editFieldError}>{editErrors.duration_minutes}</p>
              )}
            </div>

            <div className={s.editField}>
              <label className={s.editLabel}>
                Total Points <span className={s.req}>*</span>
              </label>
              <input
                type="number"
                min={1}
                className={`${s.editInput} ${editErrors.total_points ? s.editInputError : ''}`}
                value={editForm.total_points}
                onChange={(e) => setEditField('total_points', e.target.value)}
              />
              {editErrors.total_points && (
                <p className={s.editFieldError}>{editErrors.total_points}</p>
              )}
            </div>

            <div className={s.editField}>
              <label className={s.editLabel}>
                Passing (%) <span className={s.req}>*</span>
              </label>
              <input
                type="number"
                min={0}
                max={100}
                className={`${s.editInput} ${editErrors.passing_score ? s.editInputError : ''}`}
                value={editForm.passing_score}
                onChange={(e) => setEditField('passing_score', e.target.value)}
              />
              {editErrors.passing_score && (
                <p className={s.editFieldError}>{editErrors.passing_score}</p>
              )}
            </div>
          </div>

          {/* Published toggle */}
          <div className={s.editToggleRow}>
            <div>
              <div className={s.editToggleLabel}>Published</div>
              <div className={s.editToggleSub}>Students can see and take this exam</div>
            </div>
            <label className={s.toggle}>
              <input
                type="checkbox"
                checked={editForm.is_published}
                onChange={(e) => setEditField('is_published', e.target.checked)}
              />
              <span className={s.toggleSlider} />
            </label>
          </div>

        </div>

        {/* ── Footer ── */}
        <div className={s.editModalFooter}>
          <button className={s.btnSecondary} onClick={onClose} disabled={editSaving}>
            Cancel
          </button>
          <button className={s.btnPrimary} onClick={onSave} disabled={editSaving}>
            {editSaving ? (
              <><Loader2 size={13} className={s.spinner} /> Saving…</>
            ) : (
              <><Save size={13} /> Save Changes</>
            )}
          </button>
        </div>

      </div>
    </div>
  )
}