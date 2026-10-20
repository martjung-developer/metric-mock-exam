// components/dashboard/admin/questionnaires/QuestionTypeSection.tsx
// ─────────────────────────────────────────────────────────────────────────────
// CHANGES FROM PREVIOUS VERSION:
//   + Scenario column shown when at least one question in the section has one
//   + Correct-answer cell highlights detected answer; shows warning if absent
//   + Lucide icons used — no emoji literals
// ─────────────────────────────────────────────────────────────────────────────
'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronDown, HelpCircle, Eye, Pencil, Trash2,
  ChevronLeft, ChevronRight, AlertCircle, CheckCircle2,
  BookOpen, Image as ImageIcon,
} from 'lucide-react'
import type { QuestionType } from '@/lib/types/database'
import type { DisplayQuestion } from '@/lib/types/admin/questionnaires/questionnaires'
import {
  TYPE_COLORS,
  TYPE_LABELS,
  PAGE_SIZE,
} from '@/lib/constants/admin/questionnaires/questionnaires.constants'
import { DiffBadge }  from './DiffBadge'
import { SkeletonRow } from './SkeletonRow'
import styles from '@/app/(dashboard)/admin/questionnaires/questionnaires.module.css'

interface Props {
  type:      QuestionType
  questions: DisplayQuestion[]
  loading:   boolean
  onView:    (q: DisplayQuestion) => void
  onEdit:    (q: DisplayQuestion) => void
  onDelete:  (id: string) => void
  selected?: ReadonlySet<string>
  onToggleSelect?: (id: string) => void
  allSelected?: boolean
  onSelectAll?: (selected: boolean) => void
}

// Whether a question type requires a correct answer
const NEEDS_ANSWER = new Set<QuestionType>([
  'multiple_choice',
  'true_false',
  'fill_blank',
])

function formatModified(q: DisplayQuestion): string | null {
  if (!q.last_modified_at) {
    return null
  }
  const name = q.lastModifiedByName ?? 'Unknown user'
  const date = new Date(q.last_modified_at).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
  return `Last modified by ${name} on ${date}`
}

function referencesImageFilename(q: DisplayQuestion): boolean {
  const text = `${q.question_text} ${q.scenario ?? ''}`
  return /\b[\w.-]+\.(?:png|jpe?g|webp|gif)\b/i.test(text)
}

export function QuestionTypeSection({
  type, questions, loading, onView, onEdit, onDelete, selected = new Set<string>(), onToggleSelect,
  allSelected = false, onSelectAll,
}: Props) {
  const [expanded, setExpanded] = useState(true)
  const [page,     setPage]     = useState(1)

  const color      = TYPE_COLORS[type]
  const paginated  = questions.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const totalPages = Math.max(1, Math.ceil(questions.length / PAGE_SIZE))

  // Show scenario column only when at least one visible question has a scenario
  const hasScenarioCol = paginated.some((q) => (q.scenario ?? '').trim().length > 0)

  return (
    <div className={styles.typeSection}>
      <button
        className={styles.typeSectionHeader}
        style={{ borderLeftColor: color.color }}
        onClick={() => setExpanded((e) => !e)}
      >
        <div className={styles.typeSectionHeaderLeft}>
          <span
            className={styles.typeTag}
            style={{
              background: color.bg,
              color:      color.color,
              border:     `1px solid ${color.border}`,
            }}
          >
            {TYPE_LABELS[type]}
          </span>
          <span className={styles.typeSectionCount}>
            {questions.length} question{questions.length !== 1 ? 's' : ''}
          </span>
        </div>
        <ChevronDown
          size={15}
          color="#8a9ab5"
          style={{
            transform:  expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
          }}
        />
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            {questions.length === 0 ? (
              <div className={styles.typeSectionEmpty}>
                <HelpCircle size={16} color="#cbd5e1" />
                <span>No {TYPE_LABELS[type]} questions yet</span>
              </div>
            ) : (
              <>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        {onToggleSelect && (
                          <th>
                            <input
                              type="checkbox"
                              aria-label="Select all current filtered results"
                              checked={allSelected}
                              onChange={(event) => onSelectAll?.(event.target.checked)}
                            />
                          </th>
                        )}
                        <th style={{ width: '35%' }}>Question</th>
                        {hasScenarioCol && <th style={{ width: '15%' }}>Scenario</th>}
                        <th>Difficulty</th>
                        <th>Answer</th>
                        <th>Exam</th>
                        <th>Pts</th>
                        <th style={{ width: 100 }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading
                        ? Array.from({ length: 3 }).map((_, i) => (
                            <SkeletonRow key={i} />
                          ))
                        : paginated.map((q) => {
                            const hasAnswer    = Boolean(q.correct_answer)
                            const needsAnswer  = NEEDS_ANSWER.has(q.question_type)
                            const scenario     = (q.scenario ?? '').trim()
                            const canAttachImage = !q.image_url && referencesImageFilename(q)
                            const hasImage = Boolean(q.image_url)

                            return (
                              <tr key={q.id} className={styles.tableRow}>
                                {onToggleSelect && (
                                  <td>
                                    <input
                                      type="checkbox"
                                      aria-label="Select question"
                                      checked={selected.has(q.id)}
                                      onChange={() => onToggleSelect(q.id)}
                                    />
                                  </td>
                                )}
                                {/* Question text */}
                                <td>
                                  <div className={styles.questionCell}>
                                    <div
                                      className={styles.questionIconWrap}
                                      style={{
                                        background:   color.bg,
                                        borderColor:  color.border,
                                      }}
                                    >
                                      <HelpCircle
                                        size={13}
                                        color={color.color}
                                        strokeWidth={2}
                                      />
                                    </div>
                                    <div>
                                      <div className={styles.questionText}>
                                        {q.question_text}
                                      </div>
                                      <div className={styles.questionPoints}>
                                        {q.points} pt{q.points !== 1 ? 's' : ''}
                                      </div>
                                      {hasImage && (
                                        <Image
                                          className={styles.questionImagePreview}
                                          src={q.image_url ?? ''}
                                          alt={`Image for ${q.question_text}`}
                                          width={1200}
                                          height={800}
                                          unoptimized
                                          loading="lazy"
                                        />
                                      )}
                                      {formatModified(q) && (
                                        <div className={styles.questionPoints}>
                                          {formatModified(q)}
                                        </div>
                                      )}
                                      {hasImage && (
                                        <span
                                          style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 5,
                                            marginTop: 5,
                                            border: '1px solid #bbf7d0',
                                            borderRadius: 20,
                                            background: '#f0fdf4',
                                            color: '#047857',
                                            fontSize: '0.7rem',
                                            fontWeight: 700,
                                            padding: '2px 8px',
                                          }}
                                        >
                                          <ImageIcon size={11} />
                                          Image attached
                                        </span>
                                      )}
                                      {canAttachImage && (
                                        <button
                                          type="button"
                                          onClick={() => onEdit(q)}
                                          style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 5,
                                            marginTop: 5,
                                            border: '1px solid #bfdbfe',
                                            borderRadius: 20,
                                            background: '#eff6ff',
                                            color: '#1d4ed8',
                                            fontSize: '0.7rem',
                                            fontWeight: 700,
                                            padding: '2px 8px',
                                            cursor: 'pointer',
                                          }}
                                        >
                                          <ImageIcon size={11} />
                                          Attach image
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </td>

                                {/* Scenario (conditional column) */}
                                {hasScenarioCol && (
                                  <td>
                                    {scenario.length > 0 ? (
                                      <span
                                        title={scenario}
                                        style={{
                                          display:     'inline-flex',
                                          alignItems:  'center',
                                          gap:         4,
                                          fontSize:    '0.7rem',
                                          fontWeight:  600,
                                          color:       '#1e40af',
                                          background:  '#eff6ff',
                                          border:      '1px solid #bfdbfe',
                                          borderRadius: 20,
                                          padding:     '2px 8px',
                                          maxWidth:    130,
                                          overflow:    'hidden',
                                          textOverflow:'ellipsis',
                                          whiteSpace:  'nowrap',
                                        }}
                                      >
                                        <BookOpen size={10} />
                                        {scenario.length > 30
                                          ? `${scenario.slice(0, 30)}…`
                                          : scenario}
                                      </span>
                                    ) : (
                                      <span style={{ color: '#cbd5e1', fontSize: '0.72rem' }}>—</span>
                                    )}
                                  </td>
                                )}

                                {/* Difficulty */}
                                <td><DiffBadge diff={q.difficulty} /></td>

                                {/* Correct answer — highlight or warn */}
                                <td>
                                  {needsAnswer ? (
                                    hasAnswer ? (
                                      <span style={{
                                        display:      'inline-flex',
                                        alignItems:   'center',
                                        gap:          4,
                                        fontSize:     '0.72rem',
                                        fontWeight:   700,
                                        color:        '#059669',
                                        background:   '#f0fdf4',
                                        border:       '1px solid #bbf7d0',
                                        borderRadius: 20,
                                        padding:      '2px 8px',
                                      }}>
                                        <CheckCircle2 size={11} />
                                        {q.correct_answer}
                                      </span>
                                    ) : (
                                      <span
                                        title="No correct answer detected — set one in Edit"
                                        style={{
                                          display:      'inline-flex',
                                          alignItems:   'center',
                                          gap:          4,
                                          fontSize:     '0.72rem',
                                          fontWeight:   600,
                                          color:        '#dc2626',
                                          background:   '#fef2f2',
                                          border:       '1px solid #fecaca',
                                          borderRadius: 20,
                                          padding:      '2px 8px',
                                          cursor:       'help',
                                        }}
                                      >
                                        <AlertCircle size={11} /> None
                                      </span>
                                    )
                                  ) : (
                                    <span style={{ color: '#94a3b8', fontSize: '0.72rem' }}>
                                      Manual
                                    </span>
                                  )}
                                </td>

                                {/* Exam */}
                                <td>
                                  <span className={styles.examTag}>
                                    {q.examTitle
                                      ? q.examTitle.length > 28
                                        ? `${q.examTitle.slice(0, 28)}…`
                                        : q.examTitle
                                      : '—'}
                                  </span>
                                </td>

                                {/* Points */}
                                <td style={{
                                  fontWeight: 700,
                                  color:      '#4a5568',
                                  fontSize:   '0.8rem',
                                }}>
                                  {q.points}
                                </td>

                                {/* Actions */}
                                <td>
                                  <div className={styles.actions}>
                                    <button
                                      className={`${styles.actionBtn} ${styles.actionView}`}
                                      title="View"
                                      onClick={() => onView(q)}
                                    >
                                      <Eye size={13} />
                                    </button>
                                    <button
                                      className={`${styles.actionBtn} ${styles.actionEdit}`}
                                      title="Edit"
                                      onClick={() => onEdit(q)}
                                    >
                                      <Pencil size={13} />
                                    </button>
                                    <button
                                      className={`${styles.actionBtn} ${styles.actionDelete}`}
                                      title="Delete"
                                      onClick={() => onDelete(q.id)}
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 && (
                  <div
                    className={styles.pagination}
                    style={{ borderTop: '1px solid #f1f5f9', padding: '0.6rem 1rem' }}
                  >
                    <span className={styles.pageInfo}>
                      Page {page} of {totalPages}
                    </span>
                    <div className={styles.pageButtons}>
                      <button
                        className={styles.pageBtn}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        <ChevronLeft size={13} />
                      </button>
                      <button
                        className={styles.pageBtn}
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                      >
                        <ChevronRight size={13} />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
