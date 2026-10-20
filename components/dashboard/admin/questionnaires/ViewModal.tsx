// components/dashboard/admin/questionnaires/ViewModal.tsx
'use client'
// ─────────────────────────────────────────────────────────────────────────────
// Read-only question detail modal.
// CHANGES FROM PREVIOUS VERSION:
//   + Renders q.viewQ.image_url when present, placed after the scenario
//     block and before the answer choices (matches typical exam layout).
// ─────────────────────────────────────────────────────────────────────────────

import { X, Pencil, CheckCircle2, BookOpen, Image as ImageIcon } from 'lucide-react'
import { motion, AnimatePresence }           from 'framer-motion'
import Image                                 from 'next/image'

import { modalVariants }               from '@/animations/admin/questionnaires/questionnaires'
import { TypeTag }                     from './TypeTag'
import { DiffBadge }                   from './DiffBadge'
import type { UseQuestionnairesReturn } from '@/lib/hooks/admin/questionnaires/useQuestionnaires'
import styles                          from '@/app/(dashboard)/admin/questionnaires/questionnaires.module.css'

type Q = UseQuestionnairesReturn

export function ViewModal({ q }: { q: Q }) {
  if (!q.viewQ) {return null}
  const modifiedBy = q.viewQ.lastModifiedByName ?? 'Unknown user'
  const modifiedAt = q.viewQ.last_modified_at
    ? new Date(q.viewQ.last_modified_at).toLocaleDateString('en-PH', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : null

  return (
    <AnimatePresence>
      {q.viewQ && (
        <motion.div
          className={styles.modalOverlay}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => { if (e.target === e.currentTarget) {q.setViewQ(null)} }}
        >
          <motion.div
            className={styles.viewModal}
            variants={modalVariants} initial="hidden" animate="visible" exit="exit"
          >
            {/* ── Header ── */}
            <div className={styles.viewModalHeader}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontWeight: 800, fontSize: '0.92rem',
                  color: '#0d1523', marginBottom: 6, lineHeight: 1.4,
                }}>
                  {q.viewQ.question_text}
                </div>
                <div className={styles.viewModalMeta}>
                  <TypeTag type={q.viewQ.question_type} />
                  <DiffBadge diff={q.viewQ.difficulty} />
                </div>
              </div>
              <button className={styles.btnIconClose} onClick={() => q.setViewQ(null)}>
                <X size={14} />
              </button>
            </div>

            <div className={styles.viewModalBody}>

              {/* ── Scenario ── */}
              {(q.viewQ.scenario ?? '').trim().length > 0 && (
                <div className={styles.viewSection}>
                  <div className={styles.viewSectionTitle}>
                    <BookOpen size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                    Scenario / Reading passage
                  </div>
                  <div style={{
                    fontSize: '0.8rem', lineHeight: 1.65,
                    color: '#1e40af', background: '#eff6ff',
                    border: '1px solid #bfdbfe', borderRadius: 8,
                    padding: '0.6rem 0.75rem', whiteSpace: 'pre-wrap',
                  }}>
                    {q.viewQ.scenario}
                  </div>
                </div>
              )}

              {/* ── Image (ADDED) ── */}
              {(q.viewQ.image_url ?? '').trim().length > 0 && (
                <div className={styles.viewSection}>
                  <div className={styles.viewSectionTitle}>
                    <ImageIcon size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                    Image
                  </div>
                  <Image
                    src={q.viewQ.image_url ?? ''}
                    alt="Question visual"
                    width={1200}
                    height={320}
                    style={{
                      maxWidth: '100%', maxHeight: 320, borderRadius: 8,
                      border: '1px solid #e2e8f0', objectFit: 'contain', display: 'block', height: 'auto',
                    }}
                  />
                </div>
              )}

              {/* ── MCQ options ── */}
              {q.viewQ.question_type === 'multiple_choice' && q.viewQ.options && (
                <div className={styles.viewSection}>
                  <div className={styles.viewSectionTitle}>Answer Choices</div>
                  {q.viewQ.options.map((opt) => (
                    <div
                      key={opt.label}
                      className={`${styles.viewChoice} ${
                        q.viewQ?.correct_answer === opt.label ? styles.viewChoiceCorrect : ''
                      }`}
                    >
                      <span className={styles.viewChoiceLabel}>{opt.label}</span>
                      {opt.text}
                      {q.viewQ?.correct_answer === opt.label && (
                        <CheckCircle2 size={14} style={{ marginLeft: 'auto' }} />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* ── Non-MCQ correct answer ── */}
              {q.viewQ.question_type !== 'multiple_choice' &&
                q.viewQ.question_type !== 'essay' &&
                q.viewQ.correct_answer && (
                <div className={styles.viewSection}>
                  <div className={styles.viewSectionTitle}>Correct Answer</div>
                  <div className={styles.correctAnswerBox}>
                    <CheckCircle2 size={14} /> {q.viewQ.correct_answer}
                  </div>
                </div>
              )}

              {/* ── Explanation ── */}
              {q.viewQ.explanation && (
                <div className={styles.viewSection}>
                  <div className={styles.viewSectionTitle}>Explanation</div>
                  <div className={styles.explanationBox}>
                    {q.stripDifficultyTag(q.viewQ.explanation)}
                  </div>
                </div>
              )}

              {/* ── Details ── */}
              <div className={styles.viewSection}>
                <div className={styles.viewSectionTitle}>Details</div>
                <div className={styles.viewSectionContent} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span><strong>Points:</strong> {q.viewQ.points}</span>
                  {q.viewQ.examTitle && <span><strong>Exam:</strong> {q.viewQ.examTitle}</span>}
                  <span>
                    <strong>Added:</strong>{' '}
                    {new Date(q.viewQ.created_at).toLocaleDateString('en-PH', {
                      year: 'numeric', month: 'long', day: 'numeric',
                    })}
                  </span>
                  {modifiedAt && (
                    <span><strong>Last modified:</strong> by {modifiedBy} on {modifiedAt}</span>
                  )}
                </div>
              </div>

              {/* ── Actions ── */}
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button
                  className={styles.btnSecondary}
                  onClick={() => { if (q.viewQ) { q.setViewQ(null); q.openEdit(q.viewQ) } }}
                >
                  <Pencil size={13} /> Edit
                </button>
                <button className={styles.btnSecondary} onClick={() => q.setViewQ(null)}>
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}