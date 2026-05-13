// components/dashboard/admin/exams/EditExamModal.tsx   
import { Pencil, X, ChevronDown, Loader2, Save } from 'lucide-react'
import type { Exam, EditForm, EditFormErrors, CategoryOption, ProgramOption } from '@/lib/types/admin/exams/exam.types'
import { EXAM_TYPE_META } from '@/lib/types/database'
import type { ExamType } from '@/lib/types/database'
import s from '@/app/(dashboard)/admin/exams/exams.module.css'

interface EditExamModalProps {
  exam:         Exam
  form:         EditForm
  errors:       EditFormErrors
  saving:       boolean
  categories:   CategoryOption[]
  programs:     ProgramOption[]
  onClose:      () => void
  onSave:       () => void
  onFormChange: React.Dispatch<React.SetStateAction<EditForm | null>>
}

export function EditExamModal({
  form,
  errors,
  saving,
  categories,
  programs,
  onClose,
  onSave,
  onFormChange,
}: EditExamModalProps) {
  // Type-safe field patcher — keeps the dispatch signature intact
  function patch(update: Partial<EditForm>) {
    onFormChange((prev) => (prev ? { ...prev, ...update } : prev))
  }

  return (
    <div
      className={s.modalOverlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) {onClose()}
      }}
    >
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
          <button
            className={s.editModalClose}
            onClick={onClose}
            disabled={saving}
          >
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
              className={`${s.editInput} ${errors.title ? s.editInputError : ''}`}
              value={form.title}
              onChange={(e) => patch({ title: e.target.value })}
              placeholder="e.g. Midterm Mock Exam – BSPsych"
            />
            {errors.title && <p className={s.editFieldError}>{errors.title}</p>}
          </div>

          {/* Description */}
          <div className={s.editField}>
            <label className={s.editLabel}>Description</label>
            <textarea
              className={s.editTextarea}
              rows={3}
              value={form.description}
              onChange={(e) => patch({ description: e.target.value })}
              placeholder="Optional description…"
            />
          </div>

          {/* Category + Program */}
          <div className={s.editGrid2}>
            <div className={s.editField}>
              <label className={s.editLabel}>Category</label>
              <div className={s.editSelectWrap}>
                <select
                  className={s.editSelect}
                  value={form.category_id}
                  onChange={(e) => patch({ category_id: e.target.value })}
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
                  value={form.program_id}
                  onChange={(e) => patch({ program_id: e.target.value })}
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

          {/* Exam type tabs */}
          <div className={s.editField}>
            <label className={s.editLabel}>Exam Type</label>
            <div className={s.editTypeTabs}>
              {(['mock', 'practice'] as ExamType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`${s.editTypeTab} ${form.exam_type === t ? s.editTypeTabActive : ''}`}
                  onClick={() => patch({ exam_type: t })}
                >
                  <span className={s.editTypeTabLabel}>{EXAM_TYPE_META[t].label}</span>
                  <span className={s.editTypeTabDesc}>{EXAM_TYPE_META[t].description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Duration / Points / Passing */}
          <div className={s.editGrid3}>
            <div className={s.editField}>
              <label className={s.editLabel}>
                Duration (min) <span className={s.req}>*</span>
              </label>
              <input
                type="number"
                min={1}
                className={`${s.editInput} ${errors.duration_minutes ? s.editInputError : ''}`}
                value={form.duration_minutes}
                onChange={(e) => patch({ duration_minutes: e.target.value })}
              />
              {errors.duration_minutes && (
                <p className={s.editFieldError}>{errors.duration_minutes}</p>
              )}
            </div>

            <div className={s.editField}>
              <label className={s.editLabel}>
                Total Points <span className={s.req}>*</span>
              </label>
              <input
                type="number"
                min={1}
                className={`${s.editInput} ${errors.total_points ? s.editInputError : ''}`}
                value={form.total_points}
                onChange={(e) => patch({ total_points: e.target.value })}
              />
              {errors.total_points && (
                <p className={s.editFieldError}>{errors.total_points}</p>
              )}
            </div>

            <div className={s.editField}>
              <label className={s.editLabel}>
                Passing Score (%) <span className={s.req}>*</span>
              </label>
              <input
                type="number"
                min={0}
                max={100}
                className={`${s.editInput} ${errors.passing_score ? s.editInputError : ''}`}
                value={form.passing_score}
                onChange={(e) => patch({ passing_score: e.target.value })}
              />
              {errors.passing_score && (
                <p className={s.editFieldError}>{errors.passing_score}</p>
              )}
            </div>
          </div>

          {/* Publish toggle */}
          <div className={s.editToggleRow}>
            <div>
              <div className={s.editToggleLabel}>Published</div>
              <div className={s.editToggleSub}>Students can see and take this exam</div>
            </div>
            <label className={s.toggle}>
              <input
                type="checkbox"
                checked={form.is_published}
                onChange={(e) => patch({ is_published: e.target.checked })}
              />
              <span className={s.toggleSlider} />
            </label>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className={s.editModalFooter}>
          <button className={s.btnSecondary} onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button className={s.btnPrimary} onClick={onSave} disabled={saving}>
            {saving
              ? <><Loader2 size={13} className={s.spinner} /> Saving…</>
              : <><Save size={13} /> Save Changes</>}
          </button>
        </div>
      </div>
    </div>
  )
}
