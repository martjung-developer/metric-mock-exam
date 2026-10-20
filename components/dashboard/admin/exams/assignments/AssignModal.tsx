/**
 * components/dashboard/admin/exams/assignments/AssignModal.tsx
 *
 * Pure presentational component.
 * Renders the full "Assign to Exam" slide-up panel with:
 *   - By Student tab (search + select + deadline)
 *   - By Program tab (dropdown + deadline)
 *
 * All state callbacks are passed in from the parent via props.
 */
'use client'

import {
  X, Search, Loader2, UserPlus, Layers, CheckCircle, ChevronDown,
} from 'lucide-react'

import type {
  Program,
  StudentSearchResult,
} from '@/lib/types/admin/exams/assignments/assignments.types'

import s from '@/app/(dashboard)/admin/exams/[examId]/assignments/assignments.module.css'

// ── By-student form ───────────────────────────────────────────────────────────

interface ByStudentFormProps {
  studentSearch:    string
  studentResults:   StudentSearchResult[]
  searching:        boolean
  selected:         StudentSearchResult[]
  deadline:         string
  assigning:        boolean
  onSearchChange:   (q: string) => void
  onToggleSelect:   (s: StudentSearchResult) => void
  onDeadlineChange: (d: string) => void
  onSubmit:         () => void
}

function ByStudentForm({
  studentSearch,
  studentResults,
  searching,
  selected,
  deadline,
  assigning,
  onSearchChange,
  onToggleSelect,
  onDeadlineChange,
  onSubmit,
}: ByStudentFormProps) {
  const isSelected = (id: string) => selected.some((s) => s.id === id)

  return (
    <>
      {/* Search */}
      <div className={s.formField}>
        <label className={s.formLabel} htmlFor="student-search">
          Search Students
        </label>
        <div className={s.searchWrap}>
          <Search size={13} className={s.searchIcon} />
          <input
            id="student-search"
            className={s.searchInput}
            placeholder="Name or email…"
            value={studentSearch}
            onChange={(e) => onSearchChange(e.target.value)}
            autoComplete="off"
          />
          {searching && (
            <Loader2 size={13} className={s.searchSpinner} />
          )}
        </div>

        {studentResults.length > 0 && (
          <div className={s.searchDropdown}>
            {studentResults.map((student) => (
              <div
                key={student.id}
                role="option"
                aria-selected={isSelected(student.id)}
                className={`${s.searchDropdownItem} ${
                  isSelected(student.id) ? s.searchDropdownItemSelected : ''
                }`}
                onClick={() => onToggleSelect(student)}
              >
                <div className={s.searchDropdownAvatar}>
                  {student.full_name.slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className={s.searchDropdownName}>{student.full_name}</div>
                  <div className={s.searchDropdownEmail}>{student.email}</div>
                </div>
                {student.program_code && (
                  <span className={s.searchDropdownProg}>
                    {student.program_code}
                  </span>
                )}
                {isSelected(student.id) && (
                  <CheckCircle size={14} color="#059669" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected chips */}
      {selected.length > 0 && (
        <div className={s.selectedList}>
          <p className={s.selectedListLabel}>
            {selected.length} student{selected.length !== 1 ? 's' : ''} selected
          </p>
          <div className={s.selectedChips}>
            {selected.map((st) => (
              <span key={st.id} className={s.selectedChip}>
                {st.full_name}
                <button
                  onClick={() => onToggleSelect(st)}
                  aria-label={`Remove ${st.full_name}`}
                >
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Deadline */}
      <div className={s.formField}>
        <label className={s.formLabel} htmlFor="student-deadline">
          Deadline{' '}
          <span className={s.formLabelOpt}>(optional)</span>
        </label>
        <input
          id="student-deadline"
          type="datetime-local"
          className={s.formInput}
          value={deadline}
          onChange={(e) => onDeadlineChange(e.target.value)}
        />
      </div>

      {/* Submit */}
      <button
        className={s.btnPrimaryFull}
        onClick={onSubmit}
        disabled={assigning || selected.length === 0}
      >
        {assigning ? (
          <>
            <Loader2 size={13} className={s.spinner} /> Assigning…
          </>
        ) : (
          <>
            <UserPlus size={13} />
            Assign{' '}
            {selected.length > 0
              ? `${selected.length} Student${selected.length > 1 ? 's' : ''}`
              : 'Students'}
          </>
        )}
      </button>
    </>
  )
}

// ── By-program form ───────────────────────────────────────────────────────────

interface ByProgramFormProps {
  programs:         Program[]
  selectedProg:     string
  progDeadline:     string
  assigning:        boolean
  onProgChange:     (id: string) => void
  onDeadlineChange: (d: string) => void
  onSubmit:         () => void
}

function ByProgramForm({
  programs,
  selectedProg,
  progDeadline,
  assigning,
  onProgChange,
  onDeadlineChange,
  onSubmit,
}: ByProgramFormProps) {
  return (
    <>
      {/* Program select */}
      <div className={s.formField}>
        <label className={s.formLabel} htmlFor="program-select">
          Select Program <span className={s.req}>*</span>
        </label>
        <div className={s.selectWrap}>
          <select
            id="program-select"
            className={s.formSelect}
            value={selectedProg}
            onChange={(e) => onProgChange(e.target.value)}
          >
            <option value="">Choose a program…</option>
            {programs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} — {p.name}
              </option>
            ))}
          </select>
          <ChevronDown size={13} className={s.selectChevron} />
        </div>
        <p className={s.fieldHint}>
          All active students in this program will have access.
        </p>
      </div>

      {/* Deadline */}
      <div className={s.formField}>
        <label className={s.formLabel} htmlFor="program-deadline">
          Deadline{' '}
          <span className={s.formLabelOpt}>(optional)</span>
        </label>
        <input
          id="program-deadline"
          type="datetime-local"
          className={s.formInput}
          value={progDeadline}
          onChange={(e) => onDeadlineChange(e.target.value)}
        />
      </div>

      {/* Submit */}
      <button
        className={s.btnPrimaryFull}
        onClick={onSubmit}
        disabled={assigning || !selectedProg}
      >
        {assigning ? (
          <>
            <Loader2 size={13} className={s.spinner} /> Assigning…
          </>
        ) : (
          <>
            <Layers size={13} /> Assign Program
          </>
        )}
      </button>
    </>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface AssignModalProps {
  // Panel state
  assignMode:       'student' | 'program'
  onModeChange:     (m: 'student' | 'program') => void
  onClose:          () => void

  // Student props
  studentSearch:    string
  studentResults:   StudentSearchResult[]
  searching:        boolean
  selected:         StudentSearchResult[]
  deadline:         string
  onSearchChange:   (q: string) => void
  onToggleSelect:   (s: StudentSearchResult) => void
  onDeadlineChange: (d: string) => void
  onAssignStudents: () => void

  // Program props
  programs:         Program[]
  selectedProg:     string
  progDeadline:     string
  assigning:        boolean
  onProgChange:     (id: string) => void
  onProgDeadlineChange: (d: string) => void
  onAssignProgram:  () => void
}

export function AssignModal({
  assignMode,
  onModeChange,
  onClose,
  studentSearch,
  studentResults,
  searching,
  selected,
  deadline,
  onSearchChange,
  onToggleSelect,
  onDeadlineChange,
  onAssignStudents,
  programs,
  selectedProg,
  progDeadline,
  assigning,
  onProgChange,
  onProgDeadlineChange,
  onAssignProgram,
}: AssignModalProps) {
  return (
    <div
      className={s.modalOverlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) {onClose()}
      }}
    >
      <div className={s.assignModal}>
        {/* Header */}
        <div className={s.assignModalHeader}>
          <div>
            <h2 className={s.modalTitle}>Assign to Exam</h2>
            <p className={s.modalSubtitle}>
              Add students individually or by program
            </p>
          </div>
          <button
            className={s.modalClose}
            onClick={onClose}
            aria-label="Close panel"
          >
            <X size={14} />
          </button>
        </div>

        {/* Mode tabs */}
        <div className={s.assignTabs}>
          <button
            className={`${s.assignTab} ${
              assignMode === 'student' ? s.assignTabActive : ''
            }`}
            onClick={() => onModeChange('student')}
          >
            <UserPlus size={14} /> By Student
          </button>
          <button
            className={`${s.assignTab} ${
              assignMode === 'program' ? s.assignTabActive : ''
            }`}
            onClick={() => onModeChange('program')}
          >
            <Layers size={14} /> By Program
          </button>
        </div>

        {/* Body */}
        <div className={s.assignModalBody}>
          {assignMode === 'student' ? (
            <ByStudentForm
              studentSearch={studentSearch}
              studentResults={studentResults}
              searching={searching}
              selected={selected}
              deadline={deadline}
              assigning={assigning}
              onSearchChange={onSearchChange}
              onToggleSelect={onToggleSelect}
              onDeadlineChange={onDeadlineChange}
              onSubmit={onAssignStudents}
            />
          ) : (
            <ByProgramForm
              programs={programs}
              selectedProg={selectedProg}
              progDeadline={progDeadline}
              assigning={assigning}
              onProgChange={onProgChange}
              onDeadlineChange={onProgDeadlineChange}
              onSubmit={onAssignProgram}
            />
          )}
        </div>
      </div>
    </div>
  )
}