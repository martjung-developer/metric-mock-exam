/**
 * components/admin/programs/ProgramModal.tsx
 *
 * Detail modal for a single program.
 * Pure UI — all state callbacks come from the parent via props.
 */

import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

import { ProgramDescriptionEditor } from './ProgramDescriptionEditor'
import type { ProgramDisplay, DescriptionEditState } from '@/lib/types/admin/programs/programs.types'
import styles from '@/app/(dashboard)/admin/programs/programs.module.css'

// Accent palette (must match ProgramCard for consistent colour when modal opens)
const ACCENT_COLORS = [
  '#3b82f6','#10b981','#8b5cf6','#f59e0b',
  '#0891b2','#ec4899','#6366f1','#059669','#f97316',
]

function getInitials(name: string | null, email: string): string {
  if (name) {
    return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
  }
  return email.slice(0, 2).toUpperCase()
}

interface ProgramModalProps {
  program:      ProgramDisplay | null
  /** The zero-based position of this program in the full programs array — for accent colour. */
  colorIndex:   number
  editState:    DescriptionEditState
  onClose:      () => void
  onStartEdit:  (id: string, currentDesc: string | null) => void
  onChangeDesc: (value: string) => void
  onSave:       (programId: string) => void
  onCancel:     () => void
}

export function ProgramModal({
  program,
  colorIndex,
  editState,
  onClose,
  onStartEdit,
  onChangeDesc,
  onSave,
  onCancel,
}: ProgramModalProps) {
  // The modal editing id is prefixed so it doesn't collide with card editing ids
  const modalEditId = program ? `modal-${program.id}` : null
  const isEditing   = editState.editingId === modalEditId

  return (
    <AnimatePresence>
      {program && (
        <motion.div
          className={styles.modalOverlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onClose()
            }
          }}
        >
          <motion.div
            className={styles.modal}
            initial={{ opacity: 0, scale: 0.97, y: -10 }}
            animate={{ opacity: 1, scale: 1,    y: 0   }}
            exit={{    opacity: 0, scale: 0.97, y: -8  }}
            transition={{ duration: 0.22, ease: [0.34, 1.2, 0.64, 1] }}
          >
            {/* Accent bar */}
            <div
              style={{
                height:       4,
                background:   ACCENT_COLORS[colorIndex % ACCENT_COLORS.length],
                borderRadius: '16px 16px 0 0',
                flexShrink:   0,
              }}
            />

            {/* Modal header */}
            <div className={styles.modalHeader}>
              <div className={styles.modalHeaderLeft}>
                <p className={styles.modalCode}>{program.code}</p>
                <h2 className={styles.modalTitle}>{program.name}</h2>
                <div className={styles.modalMeta}>
                  <span className={styles.degreeBadge}>{program.degree_type}</span>
                  {program.major && (
                    <span className={styles.degreeBadge}>Major: {program.major}</span>
                  )}
                  <span
                    className={`${styles.statusBadge} ${
                      program.studentCount > 0
                        ? styles.statusActive
                        : styles.statusInactive
                    }`}
                  >
                    {program.studentCount > 0 ? 'Active' : 'No students'}
                  </span>
                </div>
              </div>
              <button className={styles.btnIconClose} onClick={onClose}>
                <X size={14} />
              </button>
            </div>

            {/* Modal body */}
            <div className={styles.modalBody}>

              {/* Full program name */}
              {program.full_name && (
                <div className={styles.modalSection}>
                  <div className={styles.modalSectionTitle}>Full Program Name</div>
                  <p style={{ fontSize: '0.83rem', color: '#4a5568', margin: 0, lineHeight: 1.6 }}>
                    {program.major
                      ? `${program.full_name} — Major in ${program.major}`
                      : program.full_name}
                  </p>
                </div>
              )}

              {/* Description */}
              <div className={styles.modalSection}>
                <div
                  className={styles.modalSectionTitle}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  Description
                </div>
                <ProgramDescriptionEditor
                  description={program.description}
                  isEditing={isEditing}
                  editDesc={editState.editDesc}
                  savingDesc={editState.savingDesc}
                  saveDescError={editState.saveDescError}
                  saveDescOk={editState.saveDescOk}
                  onStartEdit={() =>
                    onStartEdit(
                      `modal-${program.id}`,
                      program.description,
                    )
                  }
                  onChangeDesc={onChangeDesc}
                  onSave={() => onSave(program.id)}
                  onCancel={onCancel}
                  variant="modal"
                />
              </div>

              {/* Overview stats */}
              <div className={styles.modalSection}>
                <div className={styles.modalSectionTitle}>Overview</div>
                <div className={styles.modalStatGrid}>
                  <div className={styles.modalStatBox}>
                    <div className={styles.modalStatValue}>{program.studentCount}</div>
                    <div className={styles.modalStatLabel}>Students</div>
                  </div>
                  <div className={styles.modalStatBox}>
                    <div className={styles.modalStatValue}>{program.examCount}</div>
                    <div className={styles.modalStatLabel}>Exams</div>
                  </div>
                  <div className={styles.modalStatBox}>
                    <div className={styles.modalStatValue}>{program.years ?? 4}</div>
                    <div className={styles.modalStatLabel}>Years</div>
                  </div>
                </div>
              </div>

              {/* Enrolled students */}
              <div className={styles.modalSection}>
                <div className={styles.modalSectionTitle}>
                  Enrolled Students ({program.studentCount})
                </div>
                {program.students.length === 0 ? (
                  <p className={styles.noStudents}>
                    No students enrolled in this program yet.
                  </p>
                ) : (
                  <div className={styles.studentList}>
                    {program.students.map((s) => (
                      <div key={s.id} className={styles.studentRow}>
                        <div className={styles.studentAvatar}>
                          {getInitials(s.full_name, s.email)}
                        </div>
                        <span className={styles.studentName}>
                          {s.full_name ?? s.email}
                        </span>
                        {s.year_level && (
                          <span className={styles.studentMeta}>Yr {s.year_level}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Assigned exams */}
              <div className={styles.modalSection}>
                <div className={styles.modalSectionTitle}>
                  Assigned Exams ({program.examCount})
                </div>
                {program.exams.length === 0 ? (
                  <p className={styles.noExams}>
                    No exams assigned to this program yet.
                  </p>
                ) : (
                  <div className={styles.examList}>
                    {program.exams.map((ex) => (
                      <div key={ex.id} className={styles.examRow}>
                        <div
                          className={styles.publishedDot}
                          style={{ background: ex.is_published ? '#059669' : '#8a9ab5' }}
                        />
                        <span className={styles.examRowTitle}>{ex.title}</span>
                        <span
                          className={
                            ex.exam_type === 'mock'
                              ? styles.typeMock
                              : styles.typePractice
                          }
                        >
                          {ex.exam_type === 'mock' ? 'Mock' : 'Reviewer'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Footer */}
            <div className={styles.modalFooter}>
              <button className={styles.btnSecondary} onClick={onClose}>
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
