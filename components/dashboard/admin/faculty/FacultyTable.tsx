// components/dashboard/admin/faculty/FacultyTable.tsx
'use client'

import { useState, useEffect, useMemo } from 'react'
import { Eye, Pencil, Trash2, CheckCircle2, XCircle, X } from 'lucide-react'
import {
  ROLE_TYPE_OPTIONS,
  ROLE_TYPE_SHORT_LABELS,
  sortRoleTypes,
}                                       from '@/lib/types/admin/faculty'
import type {
  FacultyRow,
  FacultyRoleType,
  FacultyProgramLink,
  FacultyDepartment,
  FacultyProgram,
  FacultyProgramSelection,
  ProgramOption,
}                                       from '@/lib/types/admin/faculty'
import { getProgramsForDepartment }    from '@/lib/utils/admin/faculty/validateFacultyForm'
import { createClient }                from '@/lib/supabase/client'
import { toggleFacultyStatus, updateFacultyById, deleteFacultyById } from '@/lib/services/admin/faculty/facultyService'
import styles                          from '@/components/dashboard/admin/faculty/css/FacultyTable.module.css'

interface FacultyTableProps {
  faculty:   FacultyRow[]
  onRefresh: () => void
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
}

const ROLE_BADGE_CLASS: Record<FacultyRoleType, string> = {
  professional: 'badgeProfessional',
  major:        'badgeMajor',
  minor:        'badgeMinor',
}

function RoleBadges({ roleTypes }: { roleTypes: FacultyRoleType[] }) {
  if (!roleTypes || roleTypes.length === 0) { return <span className={styles.badgeNone}>—</span> }
  return (
    <div className={styles.badgeStack}>
      {sortRoleTypes(roleTypes).map((rt) => (
        <span key={rt} className={`${styles.badge} ${styles[ROLE_BADGE_CLASS[rt]]}`}>
          {ROLE_TYPE_SHORT_LABELS[rt]}
        </span>
      ))}
    </div>
  )
}

function ProgramBadges({ programs }: { programs: FacultyProgramLink[] }) {
  if (!programs || programs.length === 0) { return <span className={styles.badgeNone}>—</span> }
  return (
    <div className={styles.badgeStack}>
      {programs.map((p) => (
        <span key={p.program_id} className={styles.badge} title={p.is_program_head ? 'Program Head' : undefined}>
          {p.program_code}{p.is_program_head ? '' : ''}
        </span>
      ))}
    </div>
  )
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span className={`${styles.statusBadge} ${isActive ? styles.statusActive : styles.statusInactive}`}>
      {isActive ? <><CheckCircle2 size={11} /> Active</> : <><XCircle size={11} /> Inactive</>}
    </span>
  )
}

export default function FacultyTable({ faculty, onRefresh }: FacultyTableProps) {
  const [toggling, setToggling] = useState<string | null>(null)
  const [previewRow, setPreviewRow] = useState<FacultyRow | null>(null)
  const [editRow, setEditRow] = useState<FacultyRow | null>(null)
  const [deleteRow, setDeleteRow] = useState<FacultyRow | null>(null)
  const [editName, setEditName] = useState('')
  const [editRoleTypes, setEditRoleTypes] = useState<FacultyRoleType[]>([])
  // Full editable selection set (add/remove + per-program head flag)
  const [editSelectedPrograms, setEditSelectedPrograms] = useState<FacultyProgramSelection[]>([])
  const [editProgramOptions, setEditProgramOptions] = useState<ProgramOption[]>([])
  const [editOptionsLoading, setEditOptionsLoading] = useState(false)
  const [editOptionsError, setEditOptionsError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleToggle(row: FacultyRow) {
    setToggling(row.faculty_id)
    await toggleFacultyStatus(row.faculty_id, !row.is_active)
    setToggling(null)
    onRefresh()
  }

  function openEdit(row: FacultyRow) {
    setEditRow(row)
    setEditName(row.full_name)
    setEditRoleTypes(row.role_types ?? [])
    setEditSelectedPrograms(
      row.programs.map((p) => ({
        programId: p.program_id,
        code: (p.program_code ?? '') as FacultyProgram,
        isProgramHead: p.is_program_head,
      })),
    )
    setEditOptionsError(null)
  }

  // Load the full program catalog once a row is being edited, so we can
  // offer programs the faculty member doesn't hold yet.
  useEffect(() => {
    if (!editRow) { return }
    const supabase = createClient()
    let cancelled = false

    // Show loading as soon as the edit panel begins fetching its options.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEditOptionsLoading(true)
    setEditOptionsError(null)

    void (async () => {
      const { data, error } = await supabase
        .from('programs')
        .select('id, code, name, schools(code, name)')
        .order('code', { ascending: true })

      if (cancelled) { return }

      if (error) {
        setEditOptionsError('Failed to load programs. Please try again.')
        setEditProgramOptions([])
        setEditOptionsLoading(false)
        return
      }

      const mapped: ProgramOption[] = (data ?? []).map((row) => {
        const school = Array.isArray(row.schools) ? row.schools[0] : row.schools
        return {
          id: row.id,
          code: row.code,
          name: row.name,
          school_code: school?.code ?? '',
          school_name: school?.name ?? '',
        }
      })
      setEditProgramOptions(mapped)
      setEditOptionsLoading(false)
    })()

    return () => { cancelled = true }
  }, [editRow])

  function toggleEditRoleType(value: FacultyRoleType) {
    setEditRoleTypes((prev) => (prev.includes(value) ? prev.filter((r) => r !== value) : [...prev, value]))
  }

  // Add/remove a program from the faculty member's set
  function toggleEditProgram(opt: ProgramOption) {
    setEditSelectedPrograms((prev) => {
      const exists = prev.find((p) => p.programId === opt.id)
      if (exists) {
        return prev.filter((p) => p.programId !== opt.id)
      }
      return [...prev, { programId: opt.id, code: opt.code as FacultyProgram, isProgramHead: false }]
    })
  }

  function toggleEditProgramHead(programId: string) {
    setEditSelectedPrograms((prev) =>
      prev.map((p) => (p.programId === programId ? { ...p, isProgramHead: !p.isProgramHead } : p)),
    )
  }

  // The faculty member's department is fixed at "one school only". Prefer
  // the legacy mirror (school_code) but fall back to the first linked
  // program's school_code in case the mirror is stale or empty — this
  // avoids the "No programs found" dead-end when data is slightly out of sync.
  const editDepartment = useMemo<FacultyDepartment | ''>(() => {
    if (!editRow) { return '' }
    if (editRow.school_code) { return editRow.school_code as FacultyDepartment }
    const fallback = editRow.programs.find((p) => p.school_code)?.school_code
    return (fallback ?? '') as FacultyDepartment | ''
  }, [editRow])

  const editAvailableCodes = editDepartment ? getProgramsForDepartment(editDepartment) : []
  const editAvailableOptions = editProgramOptions.filter((p) =>
    editAvailableCodes.includes(p.code as FacultyProgram),
  )

  async function saveEdit() {
    if (!editRow) { return }
    setSaving(true)
    const result = await updateFacultyById(editRow.faculty_id, {
      full_name: editName,
      role_types: editRoleTypes,
      programs: editSelectedPrograms.map((p) => ({
        program_id: p.programId,
        is_program_head: p.isProgramHead,
      })),
    })
    setSaving(false)
    if (!result.success) {
      setEditOptionsError(result.error ?? 'Failed to save changes.')
      return
    }
    setEditRow(null)
    onRefresh()
  }

  async function confirmDelete() {
    if (!deleteRow) { return }
    await deleteFacultyById(deleteRow.faculty_id)
    setDeleteRow(null)
    onRefresh()
  }

  if (faculty.length === 0) {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyText}>No faculty members found.</p>
        <p className={styles.emptySubtext}>Click &quot;Add Faculty&quot; to create the first account.</p>
      </div>
    )
  }

  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.th}>Name</th>
            <th className={styles.th}>Faculty ID</th>
            <th className={styles.th}>Email</th>
            <th className={styles.th}>Department</th>
            <th className={styles.th}>Programs</th>
            <th className={styles.th}>Role Type</th>
            <th className={styles.th}>Status</th>
            <th className={styles.th}>Created</th>
            <th className={`${styles.th} ${styles.thActions}`}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {faculty.map((row) => (
            <tr key={row.id} className={styles.tr}>
              <td className={`${styles.td} ${styles.tdName}`}>
                <div className={styles.avatar} aria-hidden="true">
                  {row.full_name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
                </div>
                <span className={styles.name}>{row.full_name}</span>
              </td>
              <td className={styles.td}><code className={styles.idCode}>{row.faculty_id}</code></td>
              <td className={styles.td}><span className={styles.email}>{row.email}</span></td>
              <td className={styles.td}><span className={styles.dept}>{row.school_code ?? '—'}</span></td>
              <td className={styles.td}><ProgramBadges programs={row.programs} /></td>
              <td className={styles.td}><RoleBadges roleTypes={row.role_types} /></td>
              <td className={styles.td}><StatusBadge isActive={row.is_active} /></td>
              <td className={styles.td}><span className={styles.date}>{formatDate(row.created_at)}</span></td>
              <td className={`${styles.td} ${styles.tdActions}`}>
                <div className={styles.actionRow}>
                  <button type="button" className={styles.iconAction} onClick={() => setPreviewRow(row)} title="Preview" aria-label={`Preview ${row.full_name}`}>
                    <Eye size={14} />
                  </button>
                  <button type="button" className={styles.iconAction} onClick={() => openEdit(row)} title="Edit" aria-label={`Edit ${row.full_name}`}>
                    <Pencil size={14} />
                  </button>
                  <button type="button" className={`${styles.iconAction} ${styles.iconActionDanger}`} onClick={() => setDeleteRow(row)} title="Delete" aria-label={`Delete ${row.full_name}`}>
                    <Trash2 size={14} />
                  </button>
                  <button
                    type="button" className={styles.iconAction} onClick={() => void handleToggle(row)}
                    title={row.is_active ? 'Deactivate' : 'Activate'}
                    aria-label={`${row.is_active ? 'Deactivate' : 'Activate'} ${row.full_name}`}
                    disabled={toggling === row.faculty_id}
                  >
                    {row.is_active ? <XCircle size={14} /> : <CheckCircle2 size={14} />}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {previewRow && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <button className={styles.modalClose} onClick={() => setPreviewRow(null)}><X size={14} /></button>
            <h3 className={styles.modalTitle}>Faculty Preview</h3>
            <p className={styles.modalLine}><strong>Name:</strong> {previewRow.full_name}</p>
            <p className={styles.modalLine}><strong>Email:</strong> {previewRow.email}</p>
            <p className={styles.modalLine}><strong>Department:</strong> {previewRow.school_code ?? '—'}</p>
            <p className={styles.modalLine}>
              <strong>Programs:</strong>{' '}
              {previewRow.programs.length > 0
                ? previewRow.programs.map((p) => `${p.program_code}${p.is_program_head ? ' (Head)' : ''}`).join(', ')
                : '—'}
            </p>
            <p className={styles.modalLine}>
              <strong>Role Types:</strong>{' '}
              {previewRow.role_types && previewRow.role_types.length > 0
                ? sortRoleTypes(previewRow.role_types).map((rt) => ROLE_TYPE_SHORT_LABELS[rt]).join(', ')
                : '—'}
            </p>
            <p className={styles.modalLine}><strong>Status:</strong> {previewRow.is_active ? 'Active' : 'Inactive'}</p>
          </div>
        </div>
      )}

      {editRow && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <button className={styles.modalClose} onClick={() => setEditRow(null)}><X size={14} /></button>
            <h3 className={styles.modalTitle}>Edit Faculty</h3>

            <div className={styles.modalScrollBody}>
              <label className={styles.modalLabel}>Full Name</label>
              <input className={styles.modalInput} value={editName} onChange={(e) => setEditName(e.target.value)} />

              <label className={styles.modalLabel}>Role Types</label>
              <div className={styles.modalCheckGroup} role="group" aria-label="Role types">
                {ROLE_TYPE_OPTIONS.map((val) => (
                  <label key={val} className={styles.modalCheckItem}>
                    <input type="checkbox" checked={editRoleTypes.includes(val)} onChange={() => toggleEditRoleType(val)} />
                    {ROLE_TYPE_SHORT_LABELS[val]}
                  </label>
                ))}
              </div>

              {/* Full add/remove program picker, constrained to the faculty
                  member's existing department/school, plus a Program Head
                  toggle for each selected program — mirrors Add Faculty. */}
              <label className={styles.modalLabel}>Programs</label>
              <span className={styles.hint}>
                Programs must all belong to {editDepartment || 'the same department'}.
              </span>

              {editOptionsError && (
                <span className={styles.fieldError}>{editOptionsError}</span>
              )}

              <div className={styles.modalProgramGroup} role="group" aria-label="Programs">
                {editOptionsLoading && (
                  <span className={styles.hint}>Loading programs…</span>
                )}
                {!editOptionsLoading && editAvailableOptions.length === 0 && (
                  <span className={styles.hint}>No programs found for this department.</span>
                )}
                {!editOptionsLoading && editAvailableOptions.map((opt) => {
                  const sel = editSelectedPrograms.find((p) => p.programId === opt.id)
                  return (
                    <div key={opt.id} className={styles.programRow}>
                      <label className={styles.modalCheckItem}>
                        <input
                          type="checkbox"
                          checked={Boolean(sel)}
                          onChange={() => toggleEditProgram(opt)}
                        />
                        {opt.code} — {opt.name}
                      </label>
                      {sel && (
                        <label className={styles.programHeadInline}>
                          <input
                            type="checkbox"
                            checked={sel.isProgramHead}
                            onChange={() => toggleEditProgramHead(opt.id)}
                          />
                          Program Head
                        </label>
                      )}
                    </div>
                  )
                })}
              </div>
              {editSelectedPrograms.length === 0 && (
                <span className={styles.fieldError}>Select at least one program.</span>
              )}
            </div>

            <div className={styles.modalActions}>
              <button className={styles.modalBtnSecondary} onClick={() => setEditRow(null)} disabled={saving}>Cancel</button>
              <button
                className={styles.modalBtnPrimary}
                onClick={() => void saveEdit()}
                disabled={editRoleTypes.length === 0 || editSelectedPrograms.length === 0 || saving}
              >
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteRow && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <button className={styles.modalClose} onClick={() => setDeleteRow(null)}><X size={14} /></button>
            <h3 className={styles.modalTitle}>Delete Faculty</h3>
            <p className={styles.modalLine}>This will remove <strong>{deleteRow.full_name}</strong> from the faculty list.</p>
            <div className={styles.modalActions}>
              <button className={styles.modalBtnSecondary} onClick={() => setDeleteRow(null)}>Cancel</button>
              <button className={`${styles.modalBtnPrimary} ${styles.modalBtnDanger}`} onClick={() => void confirmDelete()}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
