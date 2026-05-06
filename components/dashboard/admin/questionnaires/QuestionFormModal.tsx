'use client'
// components/dashboard/admin/questionnaires/QuestionFormModal.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Create / Edit Question modal — pure UI, all state from useQuestionnaires.
// ─────────────────────────────────────────────────────────────────────────────

import {
  Plus, Pencil, X, CheckCircle2, AlertTriangle,
  Loader2, ChevronDown, BookOpen,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

import { TYPE_ORDER }               from '@/lib/constants/admin/questionnaires/questionnaires.constants'
import { modalVariants }            from '@/animations/admin/questionnaires/questionnaires'
import type { QuestionType }        from '@/lib/types/database'
import type { UseQuestionnairesReturn } from '@/lib/hooks/admin/questionnaires/useQuestionnaires'
import styles                       from '@/app/(dashboard)/admin/questionnaires/questionnaires.module.css'

type Q = UseQuestionnairesReturn

interface QuestionFormModalProps {
  q: Q
}

export function QuestionFormModal({ q }: QuestionFormModalProps) {
  const isCreate = q.formMode === 'create'

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
                disabled={q.saving}
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